/**
 * NutriVision AI — Nutrition Calculation Engine
 * Nutrient math, daily value percentages, and serving adjustments
 */

import { DAILY_VALUES, NUTRIENT_IDS, MACRO_IDS, VITAMIN_IDS, MINERAL_IDS } from '../utils/constants.js';

/**
 * Calculate percentage of Daily Value for a nutrient
 * @param {number} nutrientId - USDA nutrient ID
 * @param {number} amount - Amount consumed
 * @returns {number} Percentage of daily value (0-100+)
 */
export function getDailyValuePercent(nutrientId, amount) {
  const dv = DAILY_VALUES[nutrientId];
  if (!dv || !amount) return 0;
  return Math.round((amount / dv.value) * 100);
}

/**
 * Get nutrient label and unit
 */
export function getNutrientInfo(nutrientId) {
  return DAILY_VALUES[nutrientId] || { value: 0, unit: '', label: 'Unknown' };
}

/**
 * Adjust nutrient values based on serving size
 * @param {Object} food - Food data with nutrients per servingGrams
 * @param {number} newServingGrams - New serving size in grams
 * @returns {Object} Adjusted food data
 */
export function adjustServing(food, newServingGrams) {
  if (!food || !food.servingGrams || food.servingGrams === 0) return food;

  const ratio = newServingGrams / food.servingGrams;

  const adjusted = {
    ...food,
    servingGrams: newServingGrams,
    servingSize: `${newServingGrams}g`,
    calories: round(food.calories * ratio),
    protein: round(food.protein * ratio),
    carbohydrates: round(food.carbohydrates * ratio),
    fat: round(food.fat * ratio),
    fiber: round((food.fiber || 0) * ratio),
    sugar: round((food.sugar || 0) * ratio),
    sodium: round((food.sodium || 0) * ratio),
    cholesterol: round((food.cholesterol || 0) * ratio),
    saturatedFat: round((food.saturatedFat || 0) * ratio),
  };

  // Adjust all nutrients in the nutrients map
  if (food.nutrients) {
    adjusted.nutrients = {};
    for (const [id, value] of Object.entries(food.nutrients)) {
      adjusted.nutrients[id] = round(value * ratio);
    }
  }

  return adjusted;
}

/**
 * Get macro breakdown as percentages of total calories
 */
export function getMacroBreakdown(food) {
  const proteinCal = (food.protein || 0) * 4;
  const carbsCal = (food.carbohydrates || 0) * 4;
  const fatCal = (food.fat || 0) * 9;
  const total = proteinCal + carbsCal + fatCal;

  if (total === 0) return { protein: 33, carbs: 34, fat: 33 };

  return {
    protein: Math.round((proteinCal / total) * 100),
    carbs: Math.round((carbsCal / total) * 100),
    fat: Math.round((fatCal / total) * 100),
  };
}

/**
 * Get vitamin breakdown for a food item
 */
export function getVitaminBreakdown(food) {
  if (!food.nutrients) return [];

  return VITAMIN_IDS.map(id => {
    const info = getNutrientInfo(id);
    const amount = food.nutrients[id] || 0;
    return {
      id,
      label: info.label,
      amount,
      unit: info.unit,
      percent: getDailyValuePercent(id, amount),
    };
  }).filter(v => v.amount > 0);
}

/**
 * Get mineral breakdown for a food item
 */
export function getMineralBreakdown(food) {
  if (!food.nutrients) return [];

  return MINERAL_IDS.map(id => {
    const info = getNutrientInfo(id);
    const amount = food.nutrients[id] || 0;
    return {
      id,
      label: info.label,
      amount,
      unit: info.unit,
      percent: getDailyValuePercent(id, amount),
    };
  }).filter(m => m.amount > 0);
}

/**
 * Get nutrient status color based on % DV
 */
export function getNutrientStatus(percent) {
  if (percent >= 100) return { color: '#10b981', label: 'Excellent', class: 'status--excellent' };
  if (percent >= 75) return { color: '#06b6d4', label: 'Good', class: 'status--good' };
  if (percent >= 50) return { color: '#3b82f6', label: 'Fair', class: 'status--fair' };
  if (percent >= 25) return { color: '#f59e0b', label: 'Low', class: 'status--low' };
  return { color: '#ef4444', label: 'Deficient', class: 'status--deficient' };
}

/**
 * Generate health insights based on daily totals
 */
export function getHealthInsights(dailyTotals, dailyGoal = 2000) {
  const insights = [];
  const calPercent = (dailyTotals.calories / dailyGoal) * 100;

  // Calorie insight
  if (calPercent > 110) {
    insights.push({ type: 'warning', icon: '⚠️', message: `You've exceeded your daily calorie goal by ${Math.round(calPercent - 100)}%` });
  } else if (calPercent >= 90) {
    insights.push({ type: 'success', icon: '✅', message: 'Great job! You\'re on track with your calorie goal' });
  } else if (calPercent >= 50) {
    insights.push({ type: 'info', icon: '📊', message: `${Math.round(dailyGoal - dailyTotals.calories)} calories remaining for today` });
  }

  // Protein insight
  const proteinPercent = getDailyValuePercent(NUTRIENT_IDS.PROTEIN, dailyTotals.protein);
  if (proteinPercent < 50) {
    insights.push({ type: 'tip', icon: '💪', message: 'Consider adding more protein-rich foods like chicken, fish, or legumes' });
  }

  // Fiber insight
  const fiberPercent = getDailyValuePercent(NUTRIENT_IDS.FIBER, dailyTotals.fiber);
  if (fiberPercent < 40) {
    insights.push({ type: 'tip', icon: '🥦', message: 'Try adding more fiber through fruits, vegetables, or whole grains' });
  }

  // Sodium warning
  const sodiumPercent = getDailyValuePercent(NUTRIENT_IDS.SODIUM, dailyTotals.sodium);
  if (sodiumPercent > 80) {
    insights.push({ type: 'warning', icon: '🧂', message: 'Sodium intake is getting high. Watch out for processed foods' });
  }

  return insights;
}

function round(val) {
  return val ? Math.round(val * 10) / 10 : 0;
}
