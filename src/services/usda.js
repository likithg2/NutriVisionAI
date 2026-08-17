/**
 * NutriVision AI — USDA FoodData Central API Service
 * Search 300K+ foods and get full nutrient profiles
 */

import { NUTRIENT_IDS } from '../utils/constants.js';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search for foods by query
 * @param {string} query - Search term
 * @param {string} apiKey - USDA API key
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of food search results
 */
export async function searchFoods(query, apiKey = 'DEMO_KEY', options = {}) {
  const {
    dataType = '',
    pageSize = 15,
    pageNumber = 1,
  } = options;

  const params = new URLSearchParams({
    api_key: apiKey,
    query: query,
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString(),
  });

  if (dataType) {
    params.append('dataType', dataType);
  }

  const response = await fetch(`${BASE_URL}/foods/search?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('USDA API rate limit reached. Try again in a minute or add your own API key in Settings.');
    }
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.foods || []).map(food => formatSearchResult(food));
}

/**
 * Get detailed food data by FDC ID
 * @param {number} fdcId - FoodData Central ID
 * @param {string} apiKey - USDA API key
 * @returns {Promise<Object>} Detailed food data with all nutrients
 */
export async function getFoodDetail(fdcId, apiKey = 'DEMO_KEY') {
  const response = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${apiKey}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch food details: ${response.status}`);
  }

  const data = await response.json();
  return formatFoodDetail(data);
}

/**
 * Format search result into our standard format
 */
function formatSearchResult(food) {
  const nutrients = {};
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

/**
 * Format detailed food data into our standard format with all nutrients
 */
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

  // Build serving info
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
    nutrients,
  };
}

/**
 * Clean up food names from USDA (often ALL CAPS or messy)
 */
function cleanFoodName(name) {
  if (!name) return 'Unknown Food';

  // If all caps, convert to title case
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
