import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.use(requireAuth);

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const textResult = response.text || "";
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

    const usdaRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${encodeURIComponent(foodName)}&pageSize=1`);
    if (!usdaRes.ok) {
      throw new Error(`USDA API Error: ${usdaRes.statusText}`);
    }

    const usdaData = await usdaRes.json();
    if (!usdaData.foods || usdaData.foods.length === 0) {
      // AI Fallback
      const prompt = `Estimate the nutritional content for ${quantity || 100}g of "${foodName}". Return ONLY a valid JSON object (no markdown, no extra text) with the keys: "calories", "protein", "carbs", "fat" as numbers.`;
      try {
        const response = await ai.models.generateContent({ model: "gemini-3.7-flash", contents: prompt });
        let text = response.text().trim();
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
