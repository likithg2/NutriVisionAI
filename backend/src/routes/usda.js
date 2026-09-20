// routes/usda.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_IDS = {
  // Macronutrients
  CALORIES: 1008,
  PROTEIN: 1003,
  TOTAL_FAT: 1004,
  CARBOHYDRATES: 1005,
  FIBER: 1079,
  SUGAR: 2000,
  SATURATED_FAT: 1258,
  CHOLESTEROL: 1253,
  SODIUM: 1093,

  // Vitamins
  VITAMIN_A: 1106,
  VITAMIN_C: 1162,
  VITAMIN_D: 1114,
  VITAMIN_E: 1109,
  VITAMIN_K: 1185,
  VITAMIN_B1: 1165, // Thiamin
  VITAMIN_B2: 1166, // Riboflavin
  VITAMIN_B3: 1167, // Niacin
  VITAMIN_B6: 1175,
  VITAMIN_B12: 1178,
  FOLATE: 1177,

  // Minerals
  CALCIUM: 1087,
  IRON: 1089,
  MAGNESIUM: 1090,
  PHOSPHORUS: 1091,
  POTASSIUM: 1092,
  ZINC: 1095,
  COPPER: 1098,
  MANGANESE: 1101,
  SELENIUM: 1103,
};

function cleanFoodName(name) {
  if (!name) return 'Unknown Food';
  if (name === name.toUpperCase() && name.length > 3) {
    return name
      .toLowerCase()
      .split(/[\s,]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return name.trim();
}

function formatSearchResult(food) {
  const nutrientMap = {};
  if (food.foodNutrients) {
    for (const n of food.foodNutrients) {
      nutrientMap[n.nutrientId] = n.value || 0;
    }
  }

  return {
    fdcId: food.fdcId,
    name: cleanFoodName(food.description || food.lowercaseDescription || 'Unknown'),
    brand: food.brandOwner || food.brandName || '',
    category: food.foodCategory || food.dataType || '',
    dataType: food.dataType,
    calories: nutrientMap[NUTRIENT_IDS.CALORIES] || 0,
    protein: nutrientMap[NUTRIENT_IDS.PROTEIN] || 0,
    carbohydrates: nutrientMap[NUTRIENT_IDS.CARBOHYDRATES] || 0,
    fat: nutrientMap[NUTRIENT_IDS.TOTAL_FAT] || 0,
    servingSize: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit || 'g'}`
      : '100g',
    servingGrams: food.servingSize || 100,
  };
}

function formatFoodDetail(food) {
  const nutrients = {};
  const allNutrientIds = Object.values(NUTRIENT_IDS);

  if (food.foodNutrients) {
    for (const n of food.foodNutrients) {
      const id = n.nutrient?.id || n.nutrientId;
      if (id && allNutrientIds.includes(id)) {
        nutrients[id] = n.amount || n.value || 0;
      }
    }
  }

  let servingSize = '100g';
  let servingGrams = 100;

  if (food.foodPortions && food.foodPortions.length > 0) {
    const portion = food.foodPortions[0];
    servingSize = portion.portionDescription || portion.modifier || `${portion.gramWeight}g`;
    servingGrams = portion.gramWeight || 100;
  } else if (food.servingSize) {
    servingSize = `${food.servingSize}${food.servingSizeUnit || 'g'}`;
    servingGrams = food.servingSize;
  }

  return {
    fdcId: food.fdcId,
    name: cleanFoodName(food.description || 'Unknown'),
    brand: food.brandOwner || food.brandName || '',
    category: food.foodCategory?.description || food.dataType || '',
    dataType: food.dataType,
    source: 'usda',
    servingSize,
    servingGrams,
    ingredients: food.ingredients || '',
    calories: nutrients[NUTRIENT_IDS.CALORIES] || 0,
    protein: nutrients[NUTRIENT_IDS.PROTEIN] || 0,
    carbohydrates: nutrients[NUTRIENT_IDS.CARBOHYDRATES] || 0,
    fat: nutrients[NUTRIENT_IDS.TOTAL_FAT] || 0,
    fiber: nutrients[NUTRIENT_IDS.FIBER] || 0,
    sugar: nutrients[NUTRIENT_IDS.SUGAR] || 0,
    sodium: nutrients[NUTRIENT_IDS.SODIUM] || 0,
    cholesterol: nutrients[NUTRIENT_IDS.CHOLESTEROL] || 0,
    saturatedFat: nutrients[NUTRIENT_IDS.SATURATED_FAT] || 0,
    nutrients, // raw dict
  };
}


// GET /api/usda/search
router.get("/search", async (req, res) => {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const { query, dataType = "", pageSize = 15, pageNumber = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: "query parameter is required." });
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query: query,
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString(),
  });

  if (dataType && dataType !== "all") {
    params.append('dataType', dataType);
  }

  try {
    const response = await fetch(`${BASE_URL}/foods/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: "USDA API rate limit reached." });
      }
      return res.status(response.status).json({ error: `USDA API error: ${response.status}` });
    }

    const data = await response.json();
    const foods = (data.foods || []).map(food => formatSearchResult(food));
    return res.status(200).json({ foods });
  } catch (err) {
    console.error("[USDA Search] Exception:", err);
    return res.status(500).json({ error: "Failed to fetch USDA search API." });
  }
});

// GET /api/usda/food/:id
router.get("/food/:id", async (req, res) => {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const { id } = req.params;

  try {
    const response = await fetch(`${BASE_URL}/food/${id}?api_key=${apiKey}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: "USDA API rate limit reached." });
      }
      return res.status(response.status).json({ error: `Failed to fetch food details: ${response.status}` });
    }

    const data = await response.json();
    const food = formatFoodDetail(data);
    return res.status(200).json({ food });
  } catch (err) {
    console.error("[USDA Food Detail] Exception:", err);
    return res.status(500).json({ error: "Failed to fetch USDA food details." });
  }
});

export default router;
