/**
 * NutriVision AI — Search Component
 * USDA food database search with autocomplete and detailed nutrition view
 */

import { state, addFoodToLog } from '../state.js';
import { $, $$, debounce, toast } from '../utils/dom.js';
import { formatCalories, formatGrams, truncate } from '../utils/format.js';
import { searchFoods, getFoodDetail } from '../services/usda.js';
import { getMacroBreakdown, getVitaminBreakdown, getMineralBreakdown, adjustServing, getDailyValuePercent } from '../services/nutrition.js';
import { FOOD_CATEGORIES, MEAL_TYPES, DAILY_VALUES } from '../utils/constants.js';

let searchResultsData = [];
let selectedFoodDetail = null;

export function renderSearch() {
  return `
    <div class="view search-view fade-in" id="search-view">
      <div class="view__header">
        <h2 class="view__title">
          <span class="view__title-icon">🔍</span>
          Food Database
        </h2>
        <p class="view__desc">Search 300K+ foods from USDA FoodData Central</p>
      </div>

      <div class="search-bar" id="search-bar">
        <div class="search-bar__input-wrap">
          <svg class="search-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            id="food-search-input"
            class="search-bar__input"
            placeholder="Search foods... (e.g., chicken breast, avocado, rice)"
            autocomplete="off"
          />
          <div class="search-bar__spinner hidden" id="search-spinner">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="search-bar__filters">
          ${FOOD_CATEGORIES.map(cat => `
            <button class="filter-pill ${cat.id === 'all' ? 'filter-pill--active' : ''}" data-category="${cat.id}">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Search Results -->
      <div class="search-results" id="search-results">
        <div class="search-results__empty" id="search-empty">
          <div class="search-results__empty-icon">🍽️</div>
          <h3>Start typing to search</h3>
          <p>Find any food and get instant nutrition data</p>
          <div class="search-suggestions">
            <span class="search-suggestion" data-query="chicken breast">chicken breast</span>
            <span class="search-suggestion" data-query="avocado">avocado</span>
            <span class="search-suggestion" data-query="brown rice">brown rice</span>
            <span class="search-suggestion" data-query="salmon">salmon</span>
            <span class="search-suggestion" data-query="banana">banana</span>
            <span class="search-suggestion" data-query="egg">egg</span>
            <span class="search-suggestion" data-query="greek yogurt">greek yogurt</span>
            <span class="search-suggestion" data-query="broccoli">broccoli</span>
          </div>
        </div>
        <div class="search-results__list hidden" id="search-list"></div>
      </div>

      <!-- Food Detail Modal -->
      <div class="food-detail hidden" id="food-detail"></div>
    </div>
  `;
}

export function initSearchEvents() {
  const input = $('#food-search-input');
  if (!input) return;

  let activeCategory = 'all';

  // Debounced search
  const doSearch = debounce(async (query) => {
    if (query.length < 2) {
      showEmpty();
      return;
    }

    showSpinner(true);
    try {
      const options = {};
      if (activeCategory !== 'all') {
        options.dataType = activeCategory;
      }
      searchResultsData = await searchFoods(query, state.usdaApiKey, options);
      renderSearchResults(searchResultsData);
    } catch (error) {
      toast(error.message, 'error');
      showEmpty();
    }
    showSpinner(false);
  }, 400);

  input.addEventListener('input', () => doSearch(input.value.trim()));

  // Category filters
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('filter-pill--active'));
      pill.classList.add('filter-pill--active');
      activeCategory = pill.dataset.category;
      if (input.value.trim().length >= 2) {
        doSearch(input.value.trim());
      }
    });
  });

  // Suggestion chips
  $$('.search-suggestion').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.query;
      doSearch(chip.dataset.query);
    });
  });
}

function showSpinner(show) {
  const spinner = $('#search-spinner');
  spinner?.classList.toggle('hidden', !show);
}

function showEmpty() {
  $('#search-empty')?.classList.remove('hidden');
  $('#search-list')?.classList.add('hidden');
}

function renderSearchResults(foods) {
  const empty = $('#search-empty');
  const list = $('#search-list');
  if (!list) return;

  empty?.classList.add('hidden');
  list.classList.remove('hidden');

  if (foods.length === 0) {
    list.innerHTML = `
      <div class="search-results__none">
        <div class="search-results__none-icon">😕</div>
        <h4>No results found</h4>
        <p>Try a different search term or category</p>
      </div>
    `;
    return;
  }

  list.innerHTML = foods.map((food, i) => `
    <div class="search-result-item slide-up" style="--delay: ${i * 0.04}s" data-fdc-id="${food.fdcId}">
      <div class="search-result-item__info">
        <h4 class="search-result-item__name">${truncate(food.name, 50)}</h4>
        <div class="search-result-item__meta">
          ${food.brand ? `<span class="search-result-item__brand">${truncate(food.brand, 30)}</span>` : ''}
          <span class="search-result-item__category">${food.category || food.dataType}</span>
          <span class="search-result-item__serving">${food.servingSize}</span>
        </div>
      </div>
      <div class="search-result-item__nutrition">
        <span class="search-result-item__cal">${formatCalories(food.calories)}<small>cal</small></span>
        <div class="search-result-item__macros">
          <span class="macro-mini macro-mini--protein">P ${formatGrams(food.protein, 0)}</span>
          <span class="macro-mini macro-mini--carbs">C ${formatGrams(food.carbohydrates, 0)}</span>
          <span class="macro-mini macro-mini--fat">F ${formatGrams(food.fat, 0)}</span>
        </div>
      </div>
      <button class="search-result-item__arrow" aria-label="View details">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `).join('');

  // Click to view details
  list.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const fdcId = parseInt(item.dataset.fdcId);
      loadFoodDetail(fdcId);
    });
  });
}

async function loadFoodDetail(fdcId) {
  const detailPanel = $('#food-detail');
  if (!detailPanel) return;

  detailPanel.classList.remove('hidden');
  detailPanel.innerHTML = `
    <div class="food-detail__loading">
      <div class="spinner spinner--lg"></div>
      <p>Loading nutrition data...</p>
    </div>
  `;

  try {
    selectedFoodDetail = await getFoodDetail(fdcId, state.usdaApiKey);
    renderFoodDetail(selectedFoodDetail);
  } catch (error) {
    toast(error.message, 'error');
    detailPanel.classList.add('hidden');
  }
}

function renderFoodDetail(food) {
  const container = $('#food-detail');
  if (!container) return;

  const macros = getMacroBreakdown(food);
  const vitamins = getVitaminBreakdown(food);
  const minerals = getMineralBreakdown(food);

  container.innerHTML = `
    <div class="food-detail__panel slide-up">
      <div class="food-detail__header">
        <button class="food-detail__back" id="food-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <button class="btn btn--primary btn--sm" id="food-detail-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add to Log
        </button>
      </div>

      <div class="food-detail__title-row">
        <div>
          <h3 class="food-detail__name">${food.name}</h3>
          ${food.brand ? `<p class="food-detail__brand">${food.brand}</p>` : ''}
        </div>
        <div class="food-detail__cal-badge">
          <span class="food-detail__cal-number">${formatCalories(food.calories)}</span>
          <span class="food-detail__cal-unit">kcal</span>
        </div>
      </div>

      <!-- Serving size adjuster -->
      <div class="serving-adjuster">
        <label class="serving-adjuster__label">Serving Size</label>
        <div class="serving-adjuster__controls">
          <input type="range" id="serving-slider" class="serving-adjuster__slider"
            min="10" max="500" value="${food.servingGrams}" step="5" />
          <div class="serving-adjuster__input-wrap">
            <input type="number" id="serving-input" class="serving-adjuster__input"
              value="${food.servingGrams}" min="1" max="1000" />
            <span class="serving-adjuster__unit">g</span>
          </div>
        </div>
        <p class="serving-adjuster__hint">Original: ${food.servingSize}</p>
      </div>

      <!-- Macro donut -->
      <div class="food-detail__macros">
        <div class="macro-donut-wrap">
          <canvas id="food-detail-donut" width="160" height="160"></canvas>
        </div>
        <div class="macro-stats">
          <div class="macro-stat macro-stat--protein">
            <span class="macro-stat__value">${formatGrams(food.protein)}</span>
            <span class="macro-stat__label">Protein</span>
            <span class="macro-stat__percent">${macros.protein}%</span>
          </div>
          <div class="macro-stat macro-stat--carbs">
            <span class="macro-stat__value">${formatGrams(food.carbohydrates)}</span>
            <span class="macro-stat__label">Carbs</span>
            <span class="macro-stat__percent">${macros.carbs}%</span>
          </div>
          <div class="macro-stat macro-stat--fat">
            <span class="macro-stat__value">${formatGrams(food.fat)}</span>
            <span class="macro-stat__label">Fat</span>
            <span class="macro-stat__percent">${macros.fat}%</span>
          </div>
          <div class="macro-stat macro-stat--fiber">
            <span class="macro-stat__value">${formatGrams(food.fiber)}</span>
            <span class="macro-stat__label">Fiber</span>
          </div>
        </div>
      </div>

      <!-- Vitamins -->
      ${vitamins.length > 0 ? `
        <div class="nutrient-section">
          <h5 class="nutrient-section__title">💊 Vitamins</h5>
          <div class="nutrient-bars">
            ${vitamins.map(v => `
              <div class="nutrient-bar-item">
                <div class="nutrient-bar-item__header">
                  <span>${v.label}</span>
                  <span>${v.amount} ${v.unit} <small>(${v.percent}% DV)</small></span>
                </div>
                <div class="nutrient-bar">
                  <div class="nutrient-bar__fill nutrient-bar__fill--vitamin" style="width: ${Math.min(v.percent, 100)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Minerals -->
      ${minerals.length > 0 ? `
        <div class="nutrient-section">
          <h5 class="nutrient-section__title">⚡ Minerals</h5>
          <div class="nutrient-bars">
            ${minerals.map(m => `
              <div class="nutrient-bar-item">
                <div class="nutrient-bar-item__header">
                  <span>${m.label}</span>
                  <span>${m.amount} ${m.unit} <small>(${m.percent}% DV)</small></span>
                </div>
                <div class="nutrient-bar">
                  <div class="nutrient-bar__fill nutrient-bar__fill--mineral" style="width: ${Math.min(m.percent, 100)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${food.ingredients ? `
        <div class="nutrient-section">
          <h5 class="nutrient-section__title">📋 Ingredients</h5>
          <p class="food-detail__ingredients">${food.ingredients}</p>
        </div>
      ` : ''}
    </div>
  `;

  // Draw donut chart
  drawMiniDonut(food);

  // Back button
  container.querySelector('#food-detail-back')?.addEventListener('click', () => {
    container.classList.add('hidden');
  });

  // Add to log button
  container.querySelector('#food-detail-add')?.addEventListener('click', () => {
    showSearchMealPicker(food);
  });

  // Serving size adjuster
  const slider = container.querySelector('#serving-slider');
  const inputEl = container.querySelector('#serving-input');

  const updateServing = debounce((grams) => {
    const adjusted = adjustServing(selectedFoodDetail, grams);
    renderFoodDetail(adjusted);
  }, 200);

  slider?.addEventListener('input', () => {
    const val = parseInt(slider.value);
    if (inputEl) inputEl.value = val;
    updateServing(val);
  });

  inputEl?.addEventListener('change', () => {
    const val = parseInt(inputEl.value);
    if (slider) slider.value = val;
    updateServing(val);
  });
}

function drawMiniDonut(food) {
  const canvas = document.getElementById('food-detail-donut');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const cx = 80, cy = 80, radius = 60, lineWidth = 16;
  const macros = getMacroBreakdown(food);

  ctx.clearRect(0, 0, 160, 160);

  const segments = [
    { percent: macros.protein, color: '#8b5cf6' },
    { percent: macros.carbs, color: '#06b6d4' },
    { percent: macros.fat, color: '#f59e0b' },
  ];

  let startAngle = -Math.PI / 2;
  for (const seg of segments) {
    const sweep = (seg.percent / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    startAngle += sweep + 0.04;
  }

  // Center text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatCalories(food.calories), cx, cy - 8);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('kcal', cx, cy + 12);
}

function showSearchMealPicker(food) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay fade-in';
  modal.innerHTML = `
    <div class="modal slide-up">
      <h3 class="modal__title">Add to which meal?</h3>
      <p class="modal__subtitle">${food.name} • ${formatCalories(food.calories)} cal</p>
      <div class="modal__options">
        ${MEAL_TYPES.map(meal => `
          <button class="modal__option" data-meal="${meal.id}">
            <span class="modal__option-icon">${meal.icon}</span>
            <span class="modal__option-label">${meal.label}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn btn--ghost btn--sm modal__close">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.modal__close')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('.modal__option').forEach(btn => {
    btn.addEventListener('click', () => {
      addFoodToLog(btn.dataset.meal, food);
      toast(`Added ${food.name} to ${btn.dataset.meal}`, 'success');
      modal.remove();
    });
  });
}
