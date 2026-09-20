// routes/scanner.js
import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const GEMINI_FOOD_PROMPT = `You are a professional nutritionist AI. Analyze this food image and provide detailed nutrition information.

Return a JSON array of food items detected. For each item, provide:
{
  "foods": [
    {
      "name": "Food name",
      "serving_size": "estimated serving (e.g., '1 cup', '200g')",
      "serving_grams": estimated_grams_number,
      "confidence": 0.0-1.0,
      "calories": number,
      "protein": number_in_grams,
      "carbohydrates": number_in_grams,
      "fat": number_in_grams,
      "fiber": number_in_grams,
      "sugar": number_in_grams,
      "sodium": number_in_mg,
      "cholesterol": number_in_mg,
      "saturated_fat": number_in_grams,
      "vitamins": {
        "vitamin_a_mcg": number,
        "vitamin_c_mg": number,
        "vitamin_d_mcg": number,
        "vitamin_e_mg": number,
        "vitamin_k_mcg": number,
        "thiamin_mg": number,
        "riboflavin_mg": number,
        "niacin_mg": number,
        "vitamin_b6_mg": number,
        "vitamin_b12_mcg": number,
        "folate_mcg": number
      },
      "minerals": {
        "calcium_mg": number,
        "iron_mg": number,
        "magnesium_mg": number,
        "phosphorus_mg": number,
        "potassium_mg": number,
        "zinc_mg": number,
        "copper_mg": number,
        "manganese_mg": number,
        "selenium_mcg": number
      }
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- Estimate realistic nutritional values based on typical serving sizes
- If multiple food items are visible, list them separately
- Set confidence between 0 and 1 based on how clearly you can identify the food`;

router.post("/", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key is required in backend environment." });
  }
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required in the request body." });
  }

  const aiClient = new GoogleGenAI({ apiKey });

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        { inlineData: { data: imageBase64, mimeType: mimeType } },
        GEMINI_FOOD_PROMPT
      ],
      config: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "Empty response from Gemini" });
    }

    // Extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const braceStart = text.indexOf('{');
      const braceEnd = text.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonStr = text.slice(braceStart, braceEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);
    const foods = parsed.foods || [parsed];

    return res.status(200).json({ foods });
  } catch (err) {
    console.error("[Scanner] Exception:", err);
    return res.status(500).json({ error: "Failed to parse AI response or contact API." });
  }
});

export default router;
