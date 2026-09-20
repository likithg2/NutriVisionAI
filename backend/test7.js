import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { inlineData: { data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", mimeType: "image/png" } },
        "Return a JSON with a single key 'color' describing the image."
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log("SUCCESS:");
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}
run();
