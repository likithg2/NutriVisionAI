import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.5-flash").replace(/^models\//i, "").trim();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const aiClient = new GoogleGenAI({ apiKey: API_KEY });
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

async function callGemini(prompt) {
  if (!API_KEY && !OPENAI_API_KEY) throw new Error("Missing AI API KEYS");
  
  if (API_KEY) {
    try {
      console.log(`Using Gemini model: ${GEMINI_MODEL}`);
      const interaction = await aiClient.interactions.create({
        model: GEMINI_MODEL,
        input: prompt,
      });
      return interaction.output_text;
    } catch (err) {
      console.error("Gemini API Error:", err.message, err);
      // Fall through to OpenAI
    }
  }

  if (openai) {
    try {
      console.log("[AI] Falling back to OpenAI...");
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI Fallback Error:", err.message, err);
    }
  }

  throw new Error("All AI APIs failed.");
}

async function run() {
  try {
    const res = await callGemini("test");
    console.log("Success:", res);
  } catch (err) {
    console.error("Fatal:", err.message);
  }
}
run();
