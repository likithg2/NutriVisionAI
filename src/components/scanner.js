/**
 * NutriVision AI — Scanner Component
 * AI-powered food image recognition via Gemini Vision
 */

import { state, addFoodToLog } from '../state.js';
import { $, toast } from '../utils/dom.js';
import { formatCalories, formatGrams } from '../utils/format.js';
import { analyzeImage } from '../services/gemini.js';
import { getMacroBreakdown, getVitaminBreakdown, getMineralBreakdown, getDailyValuePercent } from '../services/nutrition.js';
import { DAILY_VALUES, MEAL_TYPES } from '../utils/constants.js';

let currentResults = null;

export function renderScanner() {
  return `
    <div class="view scanner-view fade-in" id="scanner-view">
      <div class="view__header">
        <h2 class="view__title">
          <span class="view__title-icon">📸</span>
          AI Food Scanner
        </h2>
        <p class="view__desc">Take or upload a photo to instantly analyze nutrition with AI</p>
      </div>

      <div class="scanner" id="scanner-area">
        <div class="scanner__upload" id="scanner-upload">
          <div class="scanner__dropzone" id="scanner-dropzone">
            <div class="scanner__dropzone-content">
              <div class="scanner__camera-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <h3 class="scanner__dropzone-title">Drop food image here</h3>
              <p class="scanner__dropzone-text">or click to browse • supports JPG, PNG, WebP</p>
              <div class="scanner__actions">
                <label class="btn btn--primary btn--glow" for="scanner-file-input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Photo
                </label>
                <button class="btn btn--outline" id="scanner-camera-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Take Photo
                </button>
              </div>
              <input type="file" id="scanner-file-input" class="sr-only" accept="image/*" />
              <input type="file" id="scanner-camera-input" class="sr-only" accept="image/*" capture="environment" />
            </div>
          </div>
        </div>

        <!-- Preview area (hidden initially) -->
        <div class="scanner__preview hidden" id="scanner-preview">
          <div class="scanner__preview-image-wrap">
            <img id="scanner-preview-img" class="scanner__preview-img" alt="Food preview" />
            <button class="scanner__preview-close" id="scanner-preview-close" aria-label="Remove image">✕</button>
          </div>
          <button class="btn btn--primary btn--lg btn--glow" id="scanner-analyze-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Analyze with AI
          </button>
        </div>

        <!-- Loading state -->
        <div class="scanner__loading hidden" id="scanner-loading">
          <div class="scanner__loading-animation">
            <div class="scan-line"></div>
            <div class="scan-pulse"></div>
          </div>
          <p class="scanner__loading-text">🧠 AI is analyzing your food...</p>
          <p class="scanner__loading-subtext">Identifying ingredients and calculating nutrition</p>
        </div>

        <!-- Results area -->
        <div class="scanner__results hidden" id="scanner-results"></div>
      </div>

      ${!state.geminiApiKey ? `
        <div class="card card--warning" id="scanner-api-warning">
          <div class="card__icon">🔑</div>
          <div>
            <h4>API Key Required</h4>
            <p>Add your <strong>Google Gemini API key</strong> in Settings to use AI scanning. Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</p>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function initScannerEvents() {
  const fileInput = $('#scanner-file-input');
  const cameraInput = $('#scanner-camera-input');
  const dropzone = $('#scanner-dropzone');
  const cameraBtn = $('#scanner-camera-btn');

  if (!fileInput) return;

  // File input change
  fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
  cameraInput?.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

  // Camera button
  cameraBtn?.addEventListener('click', () => cameraInput?.click());

  // Drag and drop
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('scanner__dropzone--active');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('scanner__dropzone--active');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('scanner__dropzone--active');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  });

  // Dropzone click
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('.btn')) return;
    fileInput.click();
  });

  // Preview close
  $('#scanner-preview-close')?.addEventListener('click', resetScanner);

  // Analyze button
  $('#scanner-analyze-btn')?.addEventListener('click', runAnalysis);
}

let selectedFile = null;

function handleFileSelect(file) {
  if (!file) return;
  selectedFile = file;

  const upload = $('#scanner-upload');
  const preview = $('#scanner-preview');
  const previewImg = $('#scanner-preview-img');

  if (!upload || !preview || !previewImg) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    upload.classList.add('hidden');
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function resetScanner() {
  selectedFile = null;
  currentResults = null;

  const upload = $('#scanner-upload');
  const preview = $('#scanner-preview');
  const loading = $('#scanner-loading');
  const results = $('#scanner-results');

  upload?.classList.remove('hidden');
  preview?.classList.add('hidden');
  loading?.classList.add('hidden');
  results?.classList.add('hidden');

  const fileInput = $('#scanner-file-input');
  if (fileInput) fileInput.value = '';
}

async function runAnalysis() {
  if (!selectedFile) return;

  if (!state.geminiApiKey) {
    toast('Please add your Gemini API key in Settings first', 'error');
    return;
  }

  const preview = $('#scanner-preview');
  const loading = $('#scanner-loading');
  const results = $('#scanner-results');

  preview?.classList.add('hidden');
  loading?.classList.remove('hidden');
  results?.classList.add('hidden');

  try {
    const foods = await analyzeImage(selectedFile, state.geminiApiKey);
    currentResults = foods;
    renderResults(foods);
    loading?.classList.add('hidden');
    results?.classList.remove('hidden');
    toast(`Found ${foods.length} food item${foods.length > 1 ? 's' : ''}!`, 'success');
  } catch (error) {
    loading?.classList.add('hidden');
    preview?.classList.remove('hidden');
    toast(error.message, 'error');
  }
}

function renderResults(foods) {
  const container = $('#scanner-results');
  if (!container) return;

  container.innerHTML = `
    <div class="results-header">
      <h3 class="results-header__title">
        <span class="results-header__icon">✨</span>
        AI Analysis Results
      </h3>
      <button class="btn btn--outline btn--sm" id="scanner-new-scan">New Scan</button>
    </div>
    <div class="results-grid">
      ${foods.map((food, index) => renderFoodCard(food, index)).join('')}
    </div>
  `;

  // New scan button
  container.querySelector('#scanner-new-scan')?.addEventListener('click', resetScanner);

  // Add to log buttons
  container.querySelectorAll('.food-card__add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      showMealPicker(foods[idx]);
    });
  });

  // Expand details
  container.querySelectorAll('.food-card__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.food-card');
      card?.classList.toggle('food-card--expanded');
      btn.textContent = card?.classList.contains('food-card--expanded') ? 'Less' : 'More';
    });
  });
}

function renderFoodCard(food, index) {
  const macros = getMacroBreakdown(food);
  const vitamins = getVitaminBreakdown(food);
  const minerals = getMineralBreakdown(food);
  const confidence = Math.round((food.confidence || 0.7) * 100);

  return `
    <div class="food-card card slide-up" style="--delay: ${index * 0.1}s">
      <div class="food-card__header">
        <div class="food-card__info">
          <h4 class="food-card__name">${food.name}</h4>
          <span class="food-card__serving">${food.servingSize} (${food.servingGrams}g)</span>
        </div>
        <div class="food-card__badges">
          <span class="badge badge--accent">${confidence}% match</span>
          <span class="badge badge--primary">${formatCalories(food.calories)} cal</span>
        </div>
      </div>

      <div class="food-card__macros">
        <div class="macro-bar">
          <div class="macro-bar__fill macro-bar__fill--protein" style="width: ${macros.protein}%"></div>
          <div class="macro-bar__fill macro-bar__fill--carbs" style="width: ${macros.carbs}%"></div>
          <div class="macro-bar__fill macro-bar__fill--fat" style="width: ${macros.fat}%"></div>
        </div>
        <div class="macro-pills">
          <span class="macro-pill macro-pill--protein">
            <span class="macro-pill__dot"></span>
            Protein ${formatGrams(food.protein)}
          </span>
          <span class="macro-pill macro-pill--carbs">
            <span class="macro-pill__dot"></span>
            Carbs ${formatGrams(food.carbohydrates)}
          </span>
          <span class="macro-pill macro-pill--fat">
            <span class="macro-pill__dot"></span>
            Fat ${formatGrams(food.fat)}
          </span>
          ${food.fiber ? `
            <span class="macro-pill macro-pill--fiber">
              <span class="macro-pill__dot"></span>
              Fiber ${formatGrams(food.fiber)}
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Expandable details -->
      <div class="food-card__details">
        ${vitamins.length > 0 ? `
          <div class="nutrient-section">
            <h5 class="nutrient-section__title">💊 Vitamins</h5>
            <div class="nutrient-bars">
              ${vitamins.slice(0, 6).map(v => `
                <div class="nutrient-bar-item">
                  <div class="nutrient-bar-item__header">
                    <span>${v.label}</span>
                    <span>${v.amount}${v.unit} (${v.percent}%)</span>
                  </div>
                  <div class="nutrient-bar">
                    <div class="nutrient-bar__fill" style="width: ${Math.min(v.percent, 100)}%; background: var(--color-accent)"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${minerals.length > 0 ? `
          <div class="nutrient-section">
            <h5 class="nutrient-section__title">⚡ Minerals</h5>
            <div class="nutrient-bars">
              ${minerals.slice(0, 6).map(m => `
                <div class="nutrient-bar-item">
                  <div class="nutrient-bar-item__header">
                    <span>${m.label}</span>
                    <span>${m.amount}${m.unit} (${m.percent}%)</span>
                  </div>
                  <div class="nutrient-bar">
                    <div class="nutrient-bar__fill" style="width: ${Math.min(m.percent, 100)}%; background: var(--color-success)"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="food-card__footer">
        <button class="food-card__toggle btn btn--ghost btn--sm">More</button>
        <button class="food-card__add-btn btn btn--primary btn--sm" data-index="${index}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add to Log
        </button>
      </div>
    </div>
  `;
}

function showMealPicker(food) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay fade-in';
  modal.id = 'meal-picker-modal';
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
      <button class="btn btn--ghost btn--sm modal__close" id="meal-picker-close">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  modal.querySelector('#meal-picker-close')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelectorAll('.modal__option').forEach(btn => {
    btn.addEventListener('click', () => {
      const mealType = btn.dataset.meal;
      addFoodToLog(mealType, food);
      toast(`Added ${food.name} to ${mealType}`, 'success');
      modal.remove();
    });
  });
}
