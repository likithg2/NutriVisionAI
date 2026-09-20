// routes/chatbot.js
import express from "express";
import axios from "axios";
import llmFormatter from "../services/formatters/llmFormatter.js";

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

// Helper to always send plain-text responses (avoid HTML content-type)
function sendPlain(res, text, status = 200) {
  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
  } catch (e) {
    // ignore header set errors (very rare)
  }
  return res.status(status).send(typeof text === "string" ? text : String(text));
}

// Helper: format a single item into the SmartShelf DB text response
function formatSingleItem(item) {
  const summary = `Summary: ${item.name || "Item"} — expires on ${
    item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "no expiry recorded"
  }.`;

  const details = [
    "Details:",
    `• Brand: ${item.brand || "—"}`,
    `• Quantity: ${item.quantity ?? "—"} ${item.unit || ""}`.trim(),
    `• Location: ${item.location || "—"}`,
    `• Status: ${item.status || "—"}`
  ].join("\n");

  const actions = [
    "Suggested actions:",
    `1. Mark as consumed — POST /api/items/${item.id}/consume`,
    `2. Edit expiry — UI: Items → ${item.name || "Item"} → Edit`,
    "3. Set reminder — UI: Reminders → Add Reminder"
  ].join("\n");

  return `${summary}\n\n${details}\n\n${actions}\n\nsource: SmartShelf DB`;
}

// Helper: format items list (expiry intent) into readable text
function formatItemsList(items = [], days = null) {
  const title = days != null
    ? `Summary: Found ${items.length} item(s) expiring within ${days} day(s).`
    : `Summary: Found ${items.length} item(s).`;

  const detailsLines = items.map((it, idx) => {
    const d = it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "no expiry recorded";
    return `${idx + 1}. ${it.name} — ${it.brand ? `${it.brand} — ` : ""}${d} — ${it.location || "—"} (${it.status || "—"})`;
  });

  const details = ["Details:"].concat(detailsLines).join("\n");

  const actions = [
    "Suggested actions:",
    "1. Open Items → filter by expiry to view details.",
    "2. Edit item expiry or set reminders from item details.",
    "3. Mark consumed if already used."
  ].join("\n");

  return `${title}\n\n${details}\n\n${actions}\n\nsource: SmartShelf DB`;
}

// POST /api/chat
router.post("/", async (req, res) => {
  const { userId, message } = req.body || {};

  console.debug("[ChatBotAssistant] sending chat, userId:", userId);

  if (!userId || !message) {
    return sendPlain(res, "Missing userId or message.", 200);
  }

  const skipKeywords = ["suggest", "recipe", "meal", "idea", "healthy", "diet"];
  const isSuggestion = skipKeywords.some(kw => message.toLowerCase().includes(kw)) || req.body.skipSearchDB;

  let contextItems = null;

  // 1) Try database search first for context or fast-path
  try {
    const ai = await searchDB(userId, message);
    console.debug("[ChatBotAssistant] ai-search result:", ai && (ai.found ? (ai.items ? `items:${ai.items.length}` : 'single item') : 'not found'));

    if (ai && ai.found) {
        // Context Path: Collect items to pass to LLM
        contextItems = ai.items || (ai.item ? [ai.item] : null);
    }
  } catch (err) {
    console.error("[chatbot] DB search failed:", err?.message || err);
  }

  // 2) LLM GENERATION → Send to LLM for recipes, tips, natural conversational answers
  try {
    const llmReply = await llmFormatter(message, contextItems);
    const replyText =
      typeof llmReply === "string"
        ? llmReply
        : llmReply && llmReply.summary
        ? `${llmReply.summary}${llmReply.details ? `\n\n${llmReply.details}` : ""}`
        : String(llmReply || "I can help — ask me about items or recipes.");

    console.debug("[ChatBotAssistant] /chat reply:", typeof replyText === "string" ? replyText.slice(0, 200) : "non-string reply");
    return sendPlain(res, replyText, 200);
  } catch (err) {
    console.error("[chatbot] LLM error:", err?.message || err);
    return sendPlain(res, "Something went wrong while generating a response. Please try again.", 200);
  }
});

import { kitchenRecipe, shoppingRecommendations, dashboardSuggestions } from '../controllers/aiController.js';

// Since chatbot is mounted at /api/chat, we can mount these here as /api/chat/kitchen and /api/chat/recommendations
// Actually, in `server.js`, it's `app.use('/api/chat', chatbotRoute);`. 
// So this becomes POST /api/chat/kitchen
// Let's add the requireAuth middleware if possible, or just call the controller directly. 
import { requireAuth } from '../middleware/authMiddleware.js';

router.post("/kitchen", requireAuth, kitchenRecipe);
router.post("/recommendations", requireAuth, shoppingRecommendations);
router.get("/dashboard-suggestions", requireAuth, dashboardSuggestions);

export default router;
