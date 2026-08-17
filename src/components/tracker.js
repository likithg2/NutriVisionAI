/**
 * NutriVision AI — Tracker Component
 * Daily food log with meal sections and nutrient totals
 */

import { state, getTodayLog, removeFoodFromLog, getDailyTotals } from '../state.js';
import { $, toast } from '../utils/dom.js';
import { formatCalories, formatGrams, formatDate, formatTime, todayString } from '../utils/format.js';
import { MEAL_TYPES, COLORS } from '../utils/constants.js';

export function renderTracker() {
  const log = getTodayLog();
  const totals = getDailyTotals();
  const goal = state.profile.dailyCalorieGoal || 2000;

  return `
    <div class="view tracker-view fade-in" id="tracker-view">
      <div class="view__header">
        <h2 class="view__title">
          <span class="view__title-icon">📅</span>
          Daily Tracker
        </h2>
        <p class="view__desc">${formatDate(new Date())} — Track every bite</p>
      </div>

      <!-- Daily Summary Bar -->
      <div class="tracker-summary card card--glass">
        <div class="tracker-summary__calories">
          <div class="tracker-summary__cal-progress">
            <div class="tracker-summary__cal-bar">
              <div class="tracker-summary__cal-fill" style="width: ${Math.min((totals.calories / goal) * 100, 100)}%"></div>
            </div>
            <div class="tracker-summary__cal-text">
              <span class="tracker-summary__cal-consumed">${formatCalories(totals.calories)}</span>
              <span class="tracker-summary__cal-separator">/</span>
              <span class="tracker-summary__cal-goal">${formatCalories(goal)} kcal</span>
            </div>
          </div>
        </div>
        <div class="tracker-summary__macros">
          <div class="tracker-summary__macro">
            <span class="tracker-summary__macro-dot" style="background: ${COLORS.protein}"></span>
            <span class="tracker-summary__macro-label">Protein</span>
            <span class="tracker-summary__macro-value">${formatGrams(totals.protein)}</span>
          </div>
          <div class="tracker-summary__macro">
            <span class="tracker-summary__macro-dot" style="background: ${COLORS.carbs}"></span>
            <span class="tracker-summary__macro-label">Carbs</span>
            <span class="tracker-summary__macro-value">${formatGrams(totals.carbs)}</span>
          </div>
          <div class="tracker-summary__macro">
            <span class="tracker-summary__macro-dot" style="background: ${COLORS.fat}"></span>
            <span class="tracker-summary__macro-label">Fat</span>
            <span class="tracker-summary__macro-value">${formatGrams(totals.fat)}</span>
          </div>
          <div class="tracker-summary__macro">
            <span class="tracker-summary__macro-dot" style="background: ${COLORS.fiber}"></span>
            <span class="tracker-summary__macro-label">Fiber</span>
            <span class="tracker-summary__macro-value">${formatGrams(totals.fiber)}</span>
          </div>
        </div>
      </div>

      <!-- Meal Sections -->
      <div class="meal-sections" id="meal-sections">
        ${MEAL_TYPES.map(meal => {
          const foods = log.meals[meal.id] || [];
          const mealCals = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          return `
            <div class="meal-section card card--glass slide-up">
              <div class="meal-section__header">
                <div class="meal-section__title-row">
                  <span class="meal-section__icon">${meal.icon}</span>
                  <h3 class="meal-section__title">${meal.label}</h3>
                  <span class="meal-section__count">${foods.length} item${foods.length !== 1 ? 's' : ''}</span>
                </div>
                <span class="meal-section__cal" style="color: ${meal.color}">${formatCalories(mealCals)} kcal</span>
              </div>

              ${foods.length > 0 ? `
                <div class="meal-section__foods">
                  ${foods.map(food => `
                    <div class="meal-food-item" data-meal="${meal.id}" data-food-id="${food.id}">
                      <div class="meal-food-item__info">
                        <span class="meal-food-item__name">${food.name}</span>
                        <span class="meal-food-item__meta">
                          ${food.servingSize || food.servingGrams + 'g'}
                          ${food.source === 'gemini' ? ' • 🤖 AI' : ' • 📊 USDA'}
                        </span>
                      </div>
                      <div class="meal-food-item__nutrition">
                        <span class="meal-food-item__cal">${formatCalories(food.calories)} cal</span>
                        <div class="meal-food-item__macros">
                          <span style="color: ${COLORS.protein}">P ${formatGrams(food.protein, 0)}</span>
                          <span style="color: ${COLORS.carbs}">C ${formatGrams(food.carbohydrates, 0)}</span>
                          <span style="color: ${COLORS.fat}">F ${formatGrams(food.fat, 0)}</span>
                        </div>
                      </div>
                      <button class="meal-food-item__remove" aria-label="Remove food" data-meal="${meal.id}" data-food-id="${food.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="meal-section__empty">
                  <p>No foods logged yet</p>
                  <span class="meal-section__empty-hint">Use AI Scan or Search to add foods</span>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function initTrackerEvents() {
  const sections = $('#meal-sections');
  if (!sections) return;

  // Remove food buttons
  sections.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.meal-food-item__remove');
    if (!removeBtn) return;

    const mealType = removeBtn.dataset.meal;
    const foodId = removeBtn.dataset.foodId;

    removeFoodFromLog(mealType, foodId);
    toast('Food removed from log', 'info');

    // Re-render
    const view = $('#tracker-view');
    if (view) {
      view.outerHTML = renderTracker();
      initTrackerEvents();
    }
  });
}
