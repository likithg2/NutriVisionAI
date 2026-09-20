import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.7-flash",
      input: [
        { data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", mime_type: "image/png" },
        "What is this?"
      ],
      generation_config: {
        responseMimeType: "application/json",
      }
    });
    console.log(interaction.output_text);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}
run();
