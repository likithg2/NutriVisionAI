/**
 * NutriVision AI — Gemini Vision API Service
 * Food image recognition and nutrition analysis
 */

import { GEMINI_FOOD_PROMPT, NUTRIENT_IDS } from '../utils/constants.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

/**
 * Analyze a food image using Gemini Vision API
 * @param {File|Blob} imageFile - The image file to analyze
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<Object>} Parsed nutrition data
 */
export async function analyzeImage(imageFile, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add it in Settings.');
  }

  // Convert image to base64
  const base64Data = await fileToBase64(imageFile);
  const mimeType = imageFile.type || 'image/jpeg';

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: GEMINI_FOOD_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400) {
      throw new Error('Invalid API key or request. Please check your Gemini API key in Settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
}

/**
 * Parse Gemini API response into structured nutrition data
 */
function parseGeminiResponse(data) {
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON
      const braceStart = text.indexOf('{');
      const braceEnd = text.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonStr = text.slice(braceStart, braceEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);
    const foods = parsed.foods || [parsed];

    return foods.map(food => normalizeFoodData(food));
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    throw new Error('Failed to parse AI response. Please try again with a clearer photo.');
  }
}

/**
 * Normalize food data from Gemini into our standard format
 */
function normalizeFoodData(food) {
  return {
    name: food.name || 'Unknown Food',
    source: 'gemini',
    servingSize: food.serving_size || '1 serving',
    servingGrams: food.serving_grams || 100,
    confidence: food.confidence || 0.7,
    calories: round(food.calories),
    protein: round(food.protein),
    carbohydrates: round(food.carbohydrates),
    fat: round(food.fat),
    fiber: round(food.fiber),
    sugar: round(food.sugar),
    sodium: round(food.sodium),
    cholesterol: round(food.cholesterol),
    saturatedFat: round(food.saturated_fat),
    nutrients: {
      [NUTRIENT_IDS.CALORIES]: round(food.calories),
      [NUTRIENT_IDS.PROTEIN]: round(food.protein),
      [NUTRIENT_IDS.TOTAL_FAT]: round(food.fat),
      [NUTRIENT_IDS.CARBOHYDRATES]: round(food.carbohydrates),
      [NUTRIENT_IDS.FIBER]: round(food.fiber),
      [NUTRIENT_IDS.SUGAR]: round(food.sugar),
      [NUTRIENT_IDS.SODIUM]: round(food.sodium),
      [NUTRIENT_IDS.CHOLESTEROL]: round(food.cholesterol),
      [NUTRIENT_IDS.SATURATED_FAT]: round(food.saturated_fat),
      // Vitamins
      [NUTRIENT_IDS.VITAMIN_A]: round(food.vitamins?.vitamin_a_mcg),
      [NUTRIENT_IDS.VITAMIN_C]: round(food.vitamins?.vitamin_c_mg),
      [NUTRIENT_IDS.VITAMIN_D]: round(food.vitamins?.vitamin_d_mcg),
      [NUTRIENT_IDS.VITAMIN_E]: round(food.vitamins?.vitamin_e_mg),
      [NUTRIENT_IDS.VITAMIN_K]: round(food.vitamins?.vitamin_k_mcg),
      [NUTRIENT_IDS.VITAMIN_B1]: round(food.vitamins?.thiamin_mg),
      [NUTRIENT_IDS.VITAMIN_B2]: round(food.vitamins?.riboflavin_mg),
      [NUTRIENT_IDS.VITAMIN_B3]: round(food.vitamins?.niacin_mg),
      [NUTRIENT_IDS.VITAMIN_B6]: round(food.vitamins?.vitamin_b6_mg),
      [NUTRIENT_IDS.VITAMIN_B12]: round(food.vitamins?.vitamin_b12_mcg),
      [NUTRIENT_IDS.FOLATE]: round(food.vitamins?.folate_mcg),
      // Minerals
      [NUTRIENT_IDS.CALCIUM]: round(food.minerals?.calcium_mg),
      [NUTRIENT_IDS.IRON]: round(food.minerals?.iron_mg),
      [NUTRIENT_IDS.MAGNESIUM]: round(food.minerals?.magnesium_mg),
      [NUTRIENT_IDS.PHOSPHORUS]: round(food.minerals?.phosphorus_mg),
      [NUTRIENT_IDS.POTASSIUM]: round(food.minerals?.potassium_mg),
      [NUTRIENT_IDS.ZINC]: round(food.minerals?.zinc_mg),
      [NUTRIENT_IDS.COPPER]: round(food.minerals?.copper_mg),
      [NUTRIENT_IDS.MANGANESE]: round(food.minerals?.manganese_mg),
      [NUTRIENT_IDS.SELENIUM]: round(food.minerals?.selenium_mcg),
    },
  };
}

function round(val) {
  return val ? Math.round(val * 10) / 10 : 0;
}

/**
 * Convert a File/Blob to base64 string (without data URL prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
