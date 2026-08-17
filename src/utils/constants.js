/**
 * NutriVision AI — Constants
 * Nutrient IDs, daily recommended values, categories, and color palettes
 */

// USDA FoodData Central nutrient IDs
export const NUTRIENT_IDS = {
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

// Daily Recommended Values (based on 2,000 cal diet, FDA)
export const DAILY_VALUES = {
  [NUTRIENT_IDS.CALORIES]: { value: 2000, unit: 'kcal', label: 'Calories' },
  [NUTRIENT_IDS.PROTEIN]: { value: 50, unit: 'g', label: 'Protein' },
  [NUTRIENT_IDS.TOTAL_FAT]: { value: 78, unit: 'g', label: 'Total Fat' },
  [NUTRIENT_IDS.CARBOHYDRATES]: { value: 275, unit: 'g', label: 'Carbohydrates' },
  [NUTRIENT_IDS.FIBER]: { value: 28, unit: 'g', label: 'Dietary Fiber' },
  [NUTRIENT_IDS.SUGAR]: { value: 50, unit: 'g', label: 'Total Sugars' },
  [NUTRIENT_IDS.SATURATED_FAT]: { value: 20, unit: 'g', label: 'Saturated Fat' },
  [NUTRIENT_IDS.CHOLESTEROL]: { value: 300, unit: 'mg', label: 'Cholesterol' },
  [NUTRIENT_IDS.SODIUM]: { value: 2300, unit: 'mg', label: 'Sodium' },
  [NUTRIENT_IDS.VITAMIN_A]: { value: 900, unit: 'mcg', label: 'Vitamin A' },
  [NUTRIENT_IDS.VITAMIN_C]: { value: 90, unit: 'mg', label: 'Vitamin C' },
  [NUTRIENT_IDS.VITAMIN_D]: { value: 20, unit: 'mcg', label: 'Vitamin D' },
  [NUTRIENT_IDS.VITAMIN_E]: { value: 15, unit: 'mg', label: 'Vitamin E' },
  [NUTRIENT_IDS.VITAMIN_K]: { value: 120, unit: 'mcg', label: 'Vitamin K' },
  [NUTRIENT_IDS.VITAMIN_B1]: { value: 1.2, unit: 'mg', label: 'Thiamin (B1)' },
  [NUTRIENT_IDS.VITAMIN_B2]: { value: 1.3, unit: 'mg', label: 'Riboflavin (B2)' },
  [NUTRIENT_IDS.VITAMIN_B3]: { value: 16, unit: 'mg', label: 'Niacin (B3)' },
  [NUTRIENT_IDS.VITAMIN_B6]: { value: 1.7, unit: 'mg', label: 'Vitamin B6' },
  [NUTRIENT_IDS.VITAMIN_B12]: { value: 2.4, unit: 'mcg', label: 'Vitamin B12' },
  [NUTRIENT_IDS.FOLATE]: { value: 400, unit: 'mcg', label: 'Folate' },
  [NUTRIENT_IDS.CALCIUM]: { value: 1300, unit: 'mg', label: 'Calcium' },
  [NUTRIENT_IDS.IRON]: { value: 18, unit: 'mg', label: 'Iron' },
  [NUTRIENT_IDS.MAGNESIUM]: { value: 420, unit: 'mg', label: 'Magnesium' },
  [NUTRIENT_IDS.PHOSPHORUS]: { value: 1250, unit: 'mg', label: 'Phosphorus' },
  [NUTRIENT_IDS.POTASSIUM]: { value: 4700, unit: 'mg', label: 'Potassium' },
  [NUTRIENT_IDS.ZINC]: { value: 11, unit: 'mg', label: 'Zinc' },
  [NUTRIENT_IDS.COPPER]: { value: 0.9, unit: 'mg', label: 'Copper' },
  [NUTRIENT_IDS.MANGANESE]: { value: 2.3, unit: 'mg', label: 'Manganese' },
  [NUTRIENT_IDS.SELENIUM]: { value: 55, unit: 'mcg', label: 'Selenium' },
};

// Macro nutrient IDs (for quick filtering)
export const MACRO_IDS = [
  NUTRIENT_IDS.PROTEIN,
  NUTRIENT_IDS.TOTAL_FAT,
  NUTRIENT_IDS.CARBOHYDRATES,
  NUTRIENT_IDS.FIBER,
];

// Vitamin IDs
export const VITAMIN_IDS = [
  NUTRIENT_IDS.VITAMIN_A,
  NUTRIENT_IDS.VITAMIN_C,
  NUTRIENT_IDS.VITAMIN_D,
  NUTRIENT_IDS.VITAMIN_E,
  NUTRIENT_IDS.VITAMIN_K,
  NUTRIENT_IDS.VITAMIN_B1,
  NUTRIENT_IDS.VITAMIN_B2,
  NUTRIENT_IDS.VITAMIN_B3,
  NUTRIENT_IDS.VITAMIN_B6,
  NUTRIENT_IDS.VITAMIN_B12,
  NUTRIENT_IDS.FOLATE,
];

// Mineral IDs
export const MINERAL_IDS = [
  NUTRIENT_IDS.CALCIUM,
  NUTRIENT_IDS.IRON,
  NUTRIENT_IDS.MAGNESIUM,
  NUTRIENT_IDS.PHOSPHORUS,
  NUTRIENT_IDS.POTASSIUM,
  NUTRIENT_IDS.ZINC,
  NUTRIENT_IDS.COPPER,
  NUTRIENT_IDS.MANGANESE,
  NUTRIENT_IDS.SELENIUM,
];

// Color palette
export const COLORS = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  accent: '#06b6d4',
  accentLight: '#67e8f9',
  success: '#10b981',
  successLight: '#34d399',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  danger: '#ef4444',
  dangerLight: '#f87171',
  info: '#3b82f6',

  // Macro colors
  protein: '#8b5cf6',
  carbs: '#06b6d4',
  fat: '#f59e0b',
  fiber: '#10b981',

  // Chart colors (gradients)
  chartPurple: ['#7c3aed', '#a78bfa'],
  chartCyan: ['#06b6d4', '#67e8f9'],
  chartGreen: ['#10b981', '#34d399'],
  chartAmber: ['#f59e0b', '#fbbf24'],
  chartRed: ['#ef4444', '#f87171'],
  chartBlue: ['#3b82f6', '#60a5fa'],

  // Background
  bgPrimary: '#0f0b1a',
  bgCard: 'rgba(30, 20, 50, 0.6)',
  bgGlass: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.08)',
};

// Meal categories
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#f59e0b' },
  { id: 'lunch', label: 'Lunch', icon: '☀️', color: '#06b6d4' },
  { id: 'dinner', label: 'Dinner', icon: '🌙', color: '#7c3aed' },
  { id: 'snacks', label: 'Snacks', icon: '🍎', color: '#10b981' },
];

// Food categories for search filter
export const FOOD_CATEGORIES = [
  { id: 'all', label: 'All Foods' },
  { id: 'Branded', label: 'Branded' },
  { id: 'Foundation', label: 'Whole Foods' },
  { id: 'SR Legacy', label: 'Standard' },
  { id: 'Survey (FNDDS)', label: 'Survey' },
];

// Gemini prompt for food analysis
export const GEMINI_FOOD_PROMPT = `You are a professional nutritionist AI. Analyze this food image and provide detailed nutrition information.

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

// Views / Routes
export const VIEWS = {
  SCANNER: 'scanner',
  SEARCH: 'search',
  DASHBOARD: 'dashboard',
  TRACKER: 'tracker',
  SETTINGS: 'settings',
};
