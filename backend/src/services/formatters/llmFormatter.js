// services/formatters/llmFormatter.js
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.7-flash").replace(/^models\//i, "").trim();

const aiClient = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Prompt wrapper
const wrapPrompt = (userMessage, contextItems = null) => {
  const safeMsg = (userMessage ?? "").toString().trim();
  
  let contextStr = "";
  if (contextItems && contextItems.length > 0) {
    const itemStrings = contextItems.map(it => {
      const expiry = it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "no expiry";
      return `- ${it.name} (Brand: ${it.brand || 'None'}, Location: ${it.location || 'Unknown'}, Expiry: ${expiry})`;
    }).join("\n");
    contextStr = `\nHere are some items from the user's inventory that might be relevant:\n${itemStrings}\n`;
  }

  return `
You are SmartShelf AI — a friendly, proactive, confident, and inspiring nutrition and food assistant.

Voice Rules:
- Never say "sorry".
- Never apologize.
- Never invent SmartShelf DB values.
- Answer in natural, conversational markdown.
- Do NOT use a rigid "Summary/Details/Actions" format. Be conversational.
- If the user asks for a recipe or meal suggestion, give them a creative, delicious idea and format it nicely with markdown.
- For general questions (recipes, storage tips, suggestions), use general knowledge.
- Keep the tone helpful, clear, and inspiring.
- Always be confident.
${contextStr}
User message:
"${safeMsg}"
`.trim();
};

export default async function llmFormatter(userMessage, contextItems = null) {
  if (!aiClient) {
    return "I’m ready to help, but the GEMINI_API_KEY is missing. Please add it to enable advanced suggestions.";
  }

  const promptText = wrapPrompt(userMessage, contextItems);

  try {
    const interaction = await aiClient.interactions.create({
      model: GEMINI_MODEL,
      input: promptText
    });

    const extracted = interaction.output_text;

    const output =
      extracted && typeof extracted === "string" && extracted.trim()
        ? extracted.trim()
        : "I can help with that. Feel free to ask me anything about your items or nutrition!";

    return output;
  } catch (err) {
    console.error("[LLM Formatter Error]", err);
    return (
      "Summary: I’m here to help.\n\n" +
      "Details:\n• AI formatting temporarily unavailable.\n• You can still ask about your SmartShelf items.\n\n" +
      "Suggested actions:\n1. Retry.\n2. Ask an item question.\n3. Check connection.\n\n" +
      "source: Local fallback"
    );
  }
}
