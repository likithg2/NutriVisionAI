import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(requireAuth);

async function generateWithFallback(prompt, imageBuffer = null, imageMimeType = null) {
  const keys = [
    { type: 'gemini', key: process.env.GEMINI_API_KEY },
    { type: 'gemini', key: process.env.GEMINI_API_KEY2 },
    { type: 'nemotron', key: process.env.NEMOTRON_API_KEY },
    { type: 'openai', key: process.env.OPENAI_API_KEY }
  ];

  for (const { type, key } of keys) {
    if (!key) continue;

    try {
      if (type === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: key });
        const contents = imageBuffer 
          ? [
              { inlineData: { data: imageBuffer.toString("base64"), mimeType: imageMimeType } },
              prompt
            ]
          : prompt;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents,
          config: { responseMimeType: "application/json" }
        });
        return response.text || "";
      } else if (type === 'nemotron') {
        const openai = new OpenAI({ apiKey: key, baseURL: "https://integrate.api.nvidia.com/v1" });
        const messages = [];
        if (imageBuffer) {
           messages.push({
             role: "user",
             content: [
               { type: "text", text: prompt },
               { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBuffer.toString("base64")}` } }
             ]
           });
        } else {
           messages.push({ role: "user", content: prompt });
        }
        const response = await openai.chat.completions.create({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages,
          response_format: { type: "json_object" }
        });
        return response.choices[0].message.content || "";
      } else if (type === 'openai') {
        const openai = new OpenAI({ apiKey: key });
        const messages = [];
        if (imageBuffer) {
           messages.push({
             role: "user",
             content: [
               { type: "text", text: prompt },
               { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBuffer.toString("base64")}` } }
             ]
           });
        } else {
           messages.push({ role: "user", content: prompt });
        }
        const response = await openai.chat.completions.create({
          model: imageBuffer ? "gpt-4o-mini" : "gpt-3.5-turbo",
          messages,
          response_format: { type: "json_object" }
        });
        return response.choices[0].message.content || "";
      }
    } catch (e) {
      console.warn(`[AI Fallback] Failed using ${type}:`, e.message);
      // continue to next key
    }
  }

  throw new Error("All AI fallbacks failed");
}

router.post("/scan", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image provided." });
  }

  try {
    const prompt = `Analyze this food image and estimate its nutritional content. Return ONLY a valid JSON object (no markdown tags, no extra text) with the following keys:
    "itemName" (string, a short descriptive name of the food),
    "calories" (number, estimated total calories),
    "protein" (number, estimated protein in grams),
    "carbs" (number, estimated carbohydrates in grams),
    "fat" (number, estimated fat in grams).
    Make reasonable estimates for a standard serving size if unsure.`;

    const textResult = await generateWithFallback(prompt, req.file.buffer, req.file.mimetype);

    let data;
    try {
      // Clean up in case the model returns markdown code block
      const cleanJson = textResult.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
      data = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("[aiScanner] JSON Parse Error:", parseErr, "Raw output:", textResult);
      return res.status(500).json({ error: "AI failed to return valid nutritional data format." });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[aiScanner] Error:", err);
    return res.status(500).json({ error: "Failed to process image scan." });
  }
});

router.post("/estimate-food", express.json(), async (req, res) => {
  try {
    const { foodName, quantity } = req.body;
    if (!foodName) return res.status(400).json({ error: "No food name provided." });

    const qtyMultiplier = quantity && !isNaN(quantity) ? parseFloat(quantity) / 100 : 1; // Default to 100g if no qty

    // Use USDA API
    const usdaKey = process.env.USDA_API_KEY;
    if (!usdaKey) {
      console.error("USDA_API_KEY missing");
      return res.status(500).json({ error: "Nutrition API not configured." });
    }

    let usdaData = null;
    try {
      const usdaRes = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${encodeURIComponent(foodName)}&pageSize=1`,
        { signal: AbortSignal.timeout(5000) } // 5 second timeout
      );
      if (usdaRes.ok) {
        usdaData = await usdaRes.json();
      } else {
        console.warn(`USDA API Error: ${usdaRes.statusText}`);
      }
    } catch (e) {
      console.warn("USDA API fetch failed (timeout or network error):", e.message);
    }

    if (!usdaData || !usdaData.foods || usdaData.foods.length === 0) {
      // AI Fallback
      const prompt = `Estimate the nutritional content for ${quantity || 100}g of "${foodName}". Return ONLY a valid JSON object (no markdown, no extra text) with the keys: "calories", "protein", "carbs", "fat" as numbers.`;
      try {
        let text = await generateWithFallback(prompt);
        text = text.trim();
        if (text.startsWith("```json")) text = text.replace(/```json|```/g, "").trim();
        else if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
        const aiData = JSON.parse(text);
        
        return res.json({
          calories: aiData.calories || 0,
          protein: aiData.protein || 0,
          carbs: aiData.carbs || 0,
          fat: aiData.fat || 0,
          category: "grocery",
          unit: "g"
        });
      } catch (aiErr) {
        console.error("AI Fallback Error:", aiErr);
        return res.status(404).json({ error: "Food not found in USDA database and AI fallback failed." });
      }
    }

    const food = usdaData.foods[0];
    
    const getNutrient = (id) => {
      const nutrient = food.foodNutrients.find(n => n.nutrientId === id);
      return nutrient ? nutrient.value * qtyMultiplier : 0;
    };

    // USDA Nutrient IDs:
    // Energy: 1008
    // Protein: 1003
    // Carbohydrate: 1005
    // Total lipid (fat): 1004
    const data = {
      calories: Math.round(getNutrient(1008)),
      protein: Math.round(getNutrient(1003)),
      carbs: Math.round(getNutrient(1005)),
      fat: Math.round(getNutrient(1004)),
      category: "grocery",
      unit: "g"
    };

    return res.status(200).json(data);
  } catch (err) {
    console.error("[estimate-food] Error:", err);
    return res.status(500).json({ error: "Failed to estimate food details." });
  }
});

export default router;
