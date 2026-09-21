// routes/chatbot.js
import express from "express";
import axios from "axios";
import llmFormatter from "../services/formatters/llmFormatter.js";
import MealLog from "../models/MealLog.js";
import Item from "../models/Item.js";
import Activity from "../models/Activity.js";
import { Op } from "sequelize";

const router = express.Router();

// helper to call local ai-search (kept simple and local)
async function searchDB(userId, message) {
  try {
    const resp = await axios.post(
      "http://localhost:5000/api/items/ai-search",
      { userId, query: message },
      { timeout: 8000 }
    );
    return resp.data || { found: false };
  } catch (err) {
    console.error("[chatbot] ai-search error:", err?.message || err);
    return { found: false };
  }
}

/**
 * Fetch all relevant user context: items, meal logs, activities
 */
async function getUserContext(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [items, todayLogs, recentLogs] = await Promise.all([
      Item.findAll({
        where: { userId, status: { [Op.in]: ["active", "expiring_soon"] } },
        order: [["expiryDate", "ASC"]],
        limit: 50,
      }),
      MealLog.findAll({
        where: { userId, date: today },
        order: [["createdAt", "DESC"]],
      }),
      MealLog.findAll({
        where: { userId, date: { [Op.gte]: sevenDaysAgo } },
        order: [["date", "DESC"], ["createdAt", "DESC"]],
        limit: 30,
      }),
    ]);

    return { items, todayLogs, recentLogs };
  } catch (err) {
    console.error("[chatbot] getUserContext failed:", err?.message || err);
    return { items: [], todayLogs: [], recentLogs: [] };
  }
}

/**
 * Build a rich context string from all user data
 */
function buildContextString(contextItems, userCtx) {
  const lines = [];

  if (contextItems && contextItems.length > 0) {
    lines.push("=== SmartShelf Inventory (relevant items) ===");
    contextItems.forEach((it) => {
      const expiry = it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "no expiry";
      lines.push(`- ${it.name} (Brand: ${it.brand || "—"}, Location: ${it.location || "—"}, Expiry: ${expiry})`);
    });
    lines.push("");
  }

  if (userCtx) {
    if (userCtx.items && userCtx.items.length > 0) {
      lines.push("=== Full Inventory ===");
      userCtx.items.forEach((it) => {
        const expiry = it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "no expiry";
        lines.push(
          `- ${it.name} | Qty: ${it.quantity ?? "?"} ${it.unit || ""} | Location: ${it.location || "—"} | Expiry: ${expiry} | Cal: ${it.calories ?? "?"}kcal | P: ${it.protein ?? "?"}g`
        );
      });
      lines.push("");
    }

    if (userCtx.todayLogs && userCtx.todayLogs.length > 0) {
      const totals = userCtx.todayLogs.reduce(
        (acc, l) => {
          acc.calories += (l.calories || 0) * (l.servings || 1);
          acc.protein += (l.protein || 0) * (l.servings || 1);
          acc.carbs += (l.carbs || 0) * (l.servings || 1);
          acc.fat += (l.fat || 0) * (l.servings || 1);
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      lines.push("=== Today's Food Log ===");
      userCtx.todayLogs.forEach((l) => {
        lines.push(
          `- ${l.itemName} (${l.mealType}) — ${Math.round((l.calories || 0) * (l.servings || 1))} kcal, P: ${Math.round((l.protein || 0) * (l.servings || 1))}g, C: ${Math.round((l.carbs || 0) * (l.servings || 1))}g, F: ${Math.round((l.fat || 0) * (l.servings || 1))}g`
        );
      });
      lines.push(
        `Today's totals: ${Math.round(totals.calories)} kcal | Protein: ${Math.round(totals.protein)}g | Carbs: ${Math.round(totals.carbs)}g | Fat: ${Math.round(totals.fat)}g`
      );
      lines.push("");
    } else {
      lines.push("=== Today's Food Log ===");
      lines.push("No meals logged today yet.");
      lines.push("");
    }

    if (userCtx.recentLogs && userCtx.recentLogs.length > 0) {
      lines.push("=== Recent Meal History (last 7 days) ===");
      userCtx.recentLogs.slice(0, 10).forEach((l) => {
        lines.push(`- [${l.date}] ${l.itemName} (${l.mealType}) — ${Math.round((l.calories || 0) * (l.servings || 1))} kcal`);
      });
      lines.push("");
    }
  }

  return lines.join("\n");
}

// Helper to always send plain-text responses
function sendPlain(res, text, status = 200) {
  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
  } catch (e) {}
  return res.status(status).send(typeof text === "string" ? text : String(text));
}

// POST /api/chat
router.post("/", async (req, res) => {
  const { userId, message } = req.body || {};

  console.debug("[ChatBotAssistant] sending chat, userId:", userId);

  if (!userId || !message) {
    return sendPlain(res, "Missing userId or message.", 200);
  }

  let contextItems = null;
  let userCtx = null;

  // 1) Try database search first for targeted item context
  try {
    const ai = await searchDB(userId, message);
    console.debug("[ChatBotAssistant] ai-search result:", ai && (ai.found ? (ai.items ? `items:${ai.items.length}` : "single item") : "not found"));
    if (ai && ai.found) {
      contextItems = ai.items || (ai.item ? [ai.item] : null);
    }
  } catch (err) {
    console.error("[chatbot] DB search failed:", err?.message || err);
  }

  // 2) Fetch full user context (inventory, food logs)
  try {
    userCtx = await getUserContext(userId);
  } catch (err) {
    console.error("[chatbot] context fetch failed:", err?.message || err);
  }

  // 3) Build rich context string
  const richContext = buildContextString(contextItems, userCtx);

  // 4) LLM GENERATION
  try {
    const llmReply = await llmFormatter(message, null, richContext);
    const replyText =
      typeof llmReply === "string"
        ? llmReply
        : llmReply && llmReply.summary
        ? `${llmReply.summary}${llmReply.details ? `\n\n${llmReply.details}` : ""}`
        : String(llmReply || "I can help — ask me about your items, nutrition, or food logs.");

    console.debug("[ChatBotAssistant] /chat reply:", typeof replyText === "string" ? replyText.slice(0, 200) : "non-string reply");
    return sendPlain(res, replyText, 200);
  } catch (err) {
    console.error("[chatbot] LLM error:", err?.message || err);
    return sendPlain(res, "Something went wrong while generating a response. Please try again.", 200);
  }
});

import { kitchenRecipe, shoppingRecommendations, dashboardSuggestions } from '../controllers/aiController.js';

// Since chatbot is mounted at /api/chat, we can mount these here as /api/chat/kitchen and /api/chat/recommendations
import { requireAuth } from '../middleware/authMiddleware.js';

router.post("/kitchen", requireAuth, kitchenRecipe);
router.post("/recommendations", requireAuth, shoppingRecommendations);
router.get("/dashboard-suggestions", requireAuth, dashboardSuggestions);

export default router;
