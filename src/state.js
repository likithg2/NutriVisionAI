/**
 * NutriVision AI — Reactive State Management
 * Central store with localStorage persistence
 */

import { todayString } from './utils/format.js';

const STORAGE_KEY = 'nutrivision_state';

// Default state
const defaultState = {
  // Current view
  currentView: 'scanner',

  // API keys
  geminiApiKey: '',
  usdaApiKey: 'DEMO_KEY',

  // User profile
  profile: {
    age: 25,
    weight: 70, // kg
    height: 170, // cm
    gender: 'male',
    activityLevel: 'moderate', // sedentary, light, moderate, active, veryActive
    dailyCalorieGoal: 2000,
  },

  // Daily food log: { [date]: { meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } } }
  dailyLog: {},

  // Scan results (temporary)
  scanResults: null,

  // Search results (temporary)
  searchResults: [],

  // Selected food detail
  selectedFood: null,

  // Loading states
  loading: {
    scan: false,
    search: false,
    foodDetail: false,
  },
};

// Load persisted state
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return deepMerge(defaultState, parsed);
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return { ...defaultState };
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Listeners
const listeners = new Set();

// Create reactive state
const rawState = loadState();

// Persist non-transient state
function persistState() {
  try {
    const toPersist = {
      geminiApiKey: rawState.geminiApiKey,
      usdaApiKey: rawState.usdaApiKey,
      profile: rawState.profile,
      dailyLog: rawState.dailyLog,
      currentView: rawState.currentView,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

// Proxy handler for nested reactivity
function createProxy(obj, path = '') {
  return new Proxy(obj, {
    set(target, prop, value) {
      target[prop] = value;
      const fullPath = path ? `${path}.${prop}` : prop;
      notifyListeners(fullPath, value);
      persistState();
      return true;
    },
    get(target, prop) {
      const value = target[prop];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return createProxy(value, path ? `${path}.${prop}` : prop);
      }
      return value;
    },
  });
}

export const state = createProxy(rawState);

// Subscribe to state changes
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Notify all listeners
function notifyListeners(path, value) {
  for (const listener of listeners) {
    try {
      listener(path, value);
    } catch (e) {
      console.error('State listener error:', e);
    }
  }
}

// Convenience: Get today's daily log
export function getTodayLog() {
  const today = todayString();
  if (!rawState.dailyLog[today]) {
    rawState.dailyLog[today] = {
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      },
    };
    persistState();
  }
  return rawState.dailyLog[today];
}

// Add food to today's log
export function addFoodToLog(mealType, foodEntry) {
  const log = getTodayLog();
  log.meals[mealType].push({
    ...foodEntry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    addedAt: new Date().toISOString(),
  });
  persistState();
  notifyListeners('dailyLog', rawState.dailyLog);
}

// Remove food from today's log
export function removeFoodFromLog(mealType, foodId) {
  const log = getTodayLog();
  log.meals[mealType] = log.meals[mealType].filter(f => f.id !== foodId);
  persistState();
  notifyListeners('dailyLog', rawState.dailyLog);
}

// Get daily totals
export function getDailyTotals(dateStr = todayString()) {
  const log = rawState.dailyLog[dateStr];
  if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, nutrients: {} };

  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, saturatedFat: 0, nutrients: {} };
  const allFoods = Object.values(log.meals).flat();

  for (const food of allFoods) {
    totals.calories += food.calories || 0;
    totals.protein += food.protein || 0;
    totals.carbs += food.carbohydrates || 0;
    totals.fat += food.fat || 0;
    totals.fiber += food.fiber || 0;
    totals.sugar += food.sugar || 0;
    totals.sodium += food.sodium || 0;
    totals.cholesterol += food.cholesterol || 0;
    totals.saturatedFat += food.saturatedFat || food.saturated_fat || 0;

    // Aggregate all nutrients
    if (food.nutrients) {
      for (const [key, val] of Object.entries(food.nutrients)) {
        totals.nutrients[key] = (totals.nutrients[key] || 0) + (val || 0);
      }
    }
  }

  return totals;
}

// Get 7-day history
export function getWeekHistory() {
  const history = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    history.push({
      date: ds,
      ...getDailyTotals(ds),
    });
  }
  return history;
}

// Calculate BMR (Mifflin-St Jeor)
export function calculateBMR() {
  const { weight, height, age, gender } = rawState.profile;
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

// Calculate TDEE
export function calculateTDEE() {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(calculateBMR() * (multipliers[rawState.profile.activityLevel] || 1.55));
}
