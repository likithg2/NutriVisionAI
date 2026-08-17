/**
 * NutriVision AI — Dashboard Component
 * Visual nutrition overview with charts and gauges
 */

import { state, getDailyTotals, getWeekHistory } from '../state.js';
import { $ } from '../utils/dom.js';
import { formatCalories, formatGrams, formatPercent, formatDate } from '../utils/format.js';
import { getDailyValuePercent, getNutrientStatus, getMacroBreakdown, getHealthInsights } from '../services/nutrition.js';
import { NUTRIENT_IDS, DAILY_VALUES, VITAMIN_IDS, MINERAL_IDS, COLORS } from '../utils/constants.js';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler);

let macroChart = null;
let weekChart = null;

export function renderDashboard() {
  const totals = getDailyTotals();
  const goal = state.profile.dailyCalorieGoal || 2000;
  const calPercent = Math.min(Math.round((totals.calories / goal) * 100), 100);
  const insights = getHealthInsights(totals, goal);

  const macros = {
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
    fiber: totals.fiber,
  };

  const macroBreakdown = getMacroBreakdown({
    protein: totals.protein,
    carbohydrates: totals.carbs,
    fat: totals.fat,
  });

  return `
    <div class="view dashboard-view fade-in" id="dashboard-view">
      <div class="view__header">
        <h2 class="view__title">
          <span class="view__title-icon">📊</span>
          Nutrition Dashboard
        </h2>
        <p class="view__desc">Today's nutrition overview at a glance</p>
      </div>

      <div class="dashboard-grid">
        <!-- Calorie Gauge -->
        <div class="card card--glass dashboard-card calorie-gauge-card">
          <h3 class="card__title">Daily Calories</h3>
          <div class="calorie-gauge" id="calorie-gauge">
            <svg viewBox="0 0 200 200" class="calorie-gauge__svg">
              <defs>
                <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#7c3aed"/>
                  <stop offset="100%" stop-color="#06b6d4"/>
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14"/>
              <circle cx="100" cy="100" r="85" fill="none" stroke="url(#gauge-grad)" stroke-width="14"
                stroke-linecap="round"
                stroke-dasharray="${2 * Math.PI * 85}"
                stroke-dashoffset="${2 * Math.PI * 85 * (1 - calPercent / 100)}"
                transform="rotate(-90 100 100)"
                class="calorie-gauge__progress"
              />
            </svg>
            <div class="calorie-gauge__center">
              <span class="calorie-gauge__value">${formatCalories(totals.calories)}</span>
              <span class="calorie-gauge__label">of ${formatCalories(goal)} kcal</span>
              <span class="calorie-gauge__percent">${calPercent}%</span>
            </div>
          </div>
          <div class="calorie-gauge__remaining">
            <span class="${totals.calories > goal ? 'text-danger' : 'text-success'}">
              ${totals.calories > goal
                ? `${formatCalories(totals.calories - goal)} over`
                : `${formatCalories(goal - totals.calories)} remaining`
              }
            </span>
          </div>
        </div>

        <!-- Macro Breakdown -->
        <div class="card card--glass dashboard-card macro-chart-card">
          <h3 class="card__title">Macronutrients</h3>
          <div class="macro-chart-wrap">
            <canvas id="macro-donut-chart" width="200" height="200"></canvas>
          </div>
          <div class="macro-legend">
            <div class="macro-legend__item">
              <span class="macro-legend__dot" style="background: ${COLORS.protein}"></span>
              <span class="macro-legend__label">Protein</span>
              <span class="macro-legend__value">${formatGrams(macros.protein)} <small>(${macroBreakdown.protein}%)</small></span>
            </div>
            <div class="macro-legend__item">
              <span class="macro-legend__dot" style="background: ${COLORS.carbs}"></span>
              <span class="macro-legend__label">Carbs</span>
              <span class="macro-legend__value">${formatGrams(macros.carbs)} <small>(${macroBreakdown.carbs}%)</small></span>
            </div>
            <div class="macro-legend__item">
              <span class="macro-legend__dot" style="background: ${COLORS.fat}"></span>
              <span class="macro-legend__label">Fat</span>
              <span class="macro-legend__value">${formatGrams(macros.fat)} <small>(${macroBreakdown.fat}%)</small></span>
            </div>
            <div class="macro-legend__item">
              <span class="macro-legend__dot" style="background: ${COLORS.fiber}"></span>
              <span class="macro-legend__label">Fiber</span>
              <span class="macro-legend__value">${formatGrams(macros.fiber)}</span>
            </div>
          </div>
        </div>

        <!-- Health Insights -->
        <div class="card card--glass dashboard-card insights-card">
          <h3 class="card__title">💡 Health Insights</h3>
          <div class="insights-list">
            ${insights.length > 0 ? insights.map(i => `
              <div class="insight insight--${i.type}">
                <span class="insight__icon">${i.icon}</span>
                <span class="insight__message">${i.message}</span>
              </div>
            `).join('') : `
              <div class="insight insight--info">
                <span class="insight__icon">🍽️</span>
                <span class="insight__message">Start logging your meals to get personalized insights</span>
              </div>
            `}
          </div>
        </div>

        <!-- Vitamin Progress -->
        <div class="card card--glass dashboard-card vitamins-card">
          <h3 class="card__title">💊 Vitamins</h3>
          <div class="nutrient-progress-grid">
            ${VITAMIN_IDS.slice(0, 8).map(id => {
              const dv = DAILY_VALUES[id];
              const amount = totals.nutrients?.[id] || 0;
              const percent = getDailyValuePercent(id, amount);
              const status = getNutrientStatus(percent);
              return `
                <div class="nutrient-progress-item">
                  <div class="nutrient-progress-item__header">
                    <span class="nutrient-progress-item__name">${dv.label}</span>
                    <span class="nutrient-progress-item__percent" style="color: ${status.color}">${percent}%</span>
                  </div>
                  <div class="nutrient-bar">
                    <div class="nutrient-bar__fill" style="width: ${Math.min(percent, 100)}%; background: ${status.color}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Mineral Progress -->
        <div class="card card--glass dashboard-card minerals-card">
          <h3 class="card__title">⚡ Minerals</h3>
          <div class="nutrient-progress-grid">
            ${MINERAL_IDS.slice(0, 8).map(id => {
              const dv = DAILY_VALUES[id];
              const amount = totals.nutrients?.[id] || 0;
              const percent = getDailyValuePercent(id, amount);
              const status = getNutrientStatus(percent);
              return `
                <div class="nutrient-progress-item">
                  <div class="nutrient-progress-item__header">
                    <span class="nutrient-progress-item__name">${dv.label}</span>
                    <span class="nutrient-progress-item__percent" style="color: ${status.color}">${percent}%</span>
                  </div>
                  <div class="nutrient-bar">
                    <div class="nutrient-bar__fill" style="width: ${Math.min(percent, 100)}%; background: ${status.color}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 7-Day Trend -->
        <div class="card card--glass dashboard-card week-chart-card">
          <h3 class="card__title">📈 7-Day Calorie Trend</h3>
          <div class="week-chart-wrap">
            <canvas id="week-trend-chart" height="180"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initDashboardCharts() {
  drawMacroChart();
  drawWeekChart();
}

function drawMacroChart() {
  const canvas = document.getElementById('macro-donut-chart');
  if (!canvas) return;

  const totals = getDailyTotals();
  const data = [totals.protein || 0, totals.carbs || 0, totals.fat || 0, totals.fiber || 0];
  const hasData = data.some(v => v > 0);

  if (macroChart) macroChart.destroy();

  macroChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fat', 'Fiber'],
      datasets: [{
        data: hasData ? data : [1, 1, 1, 1],
        backgroundColor: hasData
          ? [COLORS.protein, COLORS.carbs, COLORS.fat, COLORS.fiber]
          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
          backgroundColor: 'rgba(15, 11, 26, 0.9)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatGrams(ctx.raw)}`,
          },
        },
      },
    },
  });
}

function drawWeekChart() {
  const canvas = document.getElementById('week-trend-chart');
  if (!canvas) return;

  const history = getWeekHistory();
  const goal = state.profile.dailyCalorieGoal || 2000;

  if (weekChart) weekChart.destroy();

  weekChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: history.map(h => formatDate(h.date)),
      datasets: [
        {
          label: 'Calories',
          data: history.map(h => h.calories),
          backgroundColor: history.map(h =>
            h.calories > goal ? 'rgba(239, 68, 68, 0.6)' : 'rgba(124, 58, 237, 0.6)'
          ),
          borderColor: history.map(h =>
            h.calories > goal ? '#ef4444' : '#7c3aed'
          ),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Goal',
          data: history.map(() => goal),
          type: 'line',
          borderColor: 'rgba(6, 182, 212, 0.5)',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 11, 26, 0.9)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
        },
      },
    },
  });
}
