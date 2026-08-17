/**
 * NutriVision AI — Settings Component
 * API keys, profile, daily goals, and BMR calculator
 */

import { state, calculateBMR, calculateTDEE } from '../state.js';
import { $, $$, toast } from '../utils/dom.js';
import { formatCalories } from '../utils/format.js';

export function renderSettings() {
  const bmr = Math.round(calculateBMR());
  const tdee = calculateTDEE();

  return `
    <div class="view settings-view fade-in" id="settings-view">
      <div class="view__header">
        <h2 class="view__title">
          <span class="view__title-icon">⚙️</span>
          Settings
        </h2>
        <p class="view__desc">Configure your API keys and personal goals</p>
      </div>

      <div class="settings-grid">
        <!-- API Keys -->
        <div class="card card--glass settings-card">
          <h3 class="card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            API Keys
          </h3>

          <div class="settings-field">
            <label class="settings-field__label" for="gemini-key-input">
              Google Gemini API Key
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="settings-field__link">Get free key →</a>
            </label>
            <div class="settings-field__input-wrap">
              <input type="password" id="gemini-key-input" class="settings-field__input"
                value="${state.geminiApiKey || ''}"
                placeholder="Enter your Gemini API key" />
              <button class="settings-field__toggle" id="gemini-key-toggle" aria-label="Toggle visibility">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <p class="settings-field__hint">Required for AI food image scanning</p>
          </div>

          <div class="settings-field">
            <label class="settings-field__label" for="usda-key-input">
              USDA FoodData Central API Key
              <a href="https://api.data.gov/signup/" target="_blank" rel="noopener" class="settings-field__link">Get free key →</a>
            </label>
            <div class="settings-field__input-wrap">
              <input type="text" id="usda-key-input" class="settings-field__input"
                value="${state.usdaApiKey || 'DEMO_KEY'}"
                placeholder="DEMO_KEY" />
            </div>
            <p class="settings-field__hint">Using DEMO_KEY allows 30 requests/hour. Get your own for 1000/hour.</p>
          </div>
        </div>

        <!-- Personal Profile -->
        <div class="card card--glass settings-card">
          <h3 class="card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Personal Profile
          </h3>

          <div class="settings-row">
            <div class="settings-field settings-field--half">
              <label class="settings-field__label" for="profile-age">Age</label>
              <input type="number" id="profile-age" class="settings-field__input"
                value="${state.profile.age}" min="10" max="120" />
            </div>
            <div class="settings-field settings-field--half">
              <label class="settings-field__label" for="profile-gender">Gender</label>
              <select id="profile-gender" class="settings-field__input">
                <option value="male" ${state.profile.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${state.profile.gender === 'female' ? 'selected' : ''}>Female</option>
              </select>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-field settings-field--half">
              <label class="settings-field__label" for="profile-weight">Weight (kg)</label>
              <input type="number" id="profile-weight" class="settings-field__input"
                value="${state.profile.weight}" min="20" max="300" step="0.5" />
            </div>
            <div class="settings-field settings-field--half">
              <label class="settings-field__label" for="profile-height">Height (cm)</label>
              <input type="number" id="profile-height" class="settings-field__input"
                value="${state.profile.height}" min="100" max="250" />
            </div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label" for="profile-activity">Activity Level</label>
            <select id="profile-activity" class="settings-field__input">
              <option value="sedentary" ${state.profile.activityLevel === 'sedentary' ? 'selected' : ''}>Sedentary (office job, little exercise)</option>
              <option value="light" ${state.profile.activityLevel === 'light' ? 'selected' : ''}>Lightly Active (1-3 days/week)</option>
              <option value="moderate" ${state.profile.activityLevel === 'moderate' ? 'selected' : ''}>Moderately Active (3-5 days/week)</option>
              <option value="active" ${state.profile.activityLevel === 'active' ? 'selected' : ''}>Very Active (6-7 days/week)</option>
              <option value="veryActive" ${state.profile.activityLevel === 'veryActive' ? 'selected' : ''}>Extremely Active (athlete)</option>
            </select>
          </div>
        </div>

        <!-- Calorie Goal & BMR -->
        <div class="card card--glass settings-card">
          <h3 class="card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Daily Calorie Goal
          </h3>

          <div class="bmr-display">
            <div class="bmr-display__item">
              <span class="bmr-display__value" id="bmr-value">${formatCalories(bmr)}</span>
              <span class="bmr-display__label">BMR (kcal)</span>
              <span class="bmr-display__hint">Basal Metabolic Rate</span>
            </div>
            <div class="bmr-display__arrow">→</div>
            <div class="bmr-display__item">
              <span class="bmr-display__value bmr-display__value--accent" id="tdee-value">${formatCalories(tdee)}</span>
              <span class="bmr-display__label">TDEE (kcal)</span>
              <span class="bmr-display__hint">Total Daily Energy Expenditure</span>
            </div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label" for="calorie-goal">Daily Calorie Goal</label>
            <div class="settings-field__input-wrap">
              <input type="number" id="calorie-goal" class="settings-field__input"
                value="${state.profile.dailyCalorieGoal}" min="500" max="10000" step="50" />
              <span class="settings-field__unit">kcal</span>
            </div>
            <div class="settings-field__presets">
              <button class="btn btn--ghost btn--xs" data-goal="${Math.round(tdee * 0.8)}">
                Lose Weight (${formatCalories(Math.round(tdee * 0.8))})
              </button>
              <button class="btn btn--ghost btn--xs" data-goal="${tdee}">
                Maintain (${formatCalories(tdee)})
              </button>
              <button class="btn btn--ghost btn--xs" data-goal="${Math.round(tdee * 1.15)}">
                Gain Weight (${formatCalories(Math.round(tdee * 1.15))})
              </button>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="card card--glass settings-card">
          <h3 class="card__title">About NutriVision AI</h3>
          <p class="settings-about">
            NutriVision AI is an intelligent food nutrition analyzer powered by Google Gemini Vision AI
            and USDA FoodData Central. Scan food photos or search our database of 300K+ foods to get
            complete macro and micronutrient breakdowns.
          </p>
          <div class="settings-badges">
            <span class="badge badge--primary">v1.0.0</span>
            <span class="badge badge--accent">Gemini AI</span>
            <span class="badge badge--success">USDA Database</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSettingsEvents() {
  // Gemini API key
  const geminiInput = $('#gemini-key-input');
  geminiInput?.addEventListener('change', () => {
    state.geminiApiKey = geminiInput.value.trim();
    toast('Gemini API key saved', 'success');
  });

  // Toggle visibility
  $('#gemini-key-toggle')?.addEventListener('click', () => {
    if (geminiInput) {
      geminiInput.type = geminiInput.type === 'password' ? 'text' : 'password';
    }
  });

  // USDA API key
  const usdaInput = $('#usda-key-input');
  usdaInput?.addEventListener('change', () => {
    state.usdaApiKey = usdaInput.value.trim() || 'DEMO_KEY';
    toast('USDA API key saved', 'success');
  });

  // Profile fields
  const profileFields = [
    { id: 'profile-age', key: 'age', type: 'number' },
    { id: 'profile-weight', key: 'weight', type: 'number' },
    { id: 'profile-height', key: 'height', type: 'number' },
    { id: 'profile-gender', key: 'gender', type: 'string' },
    { id: 'profile-activity', key: 'activityLevel', type: 'string' },
  ];

  for (const field of profileFields) {
    const el = $(`#${field.id}`);
    el?.addEventListener('change', () => {
      const value = field.type === 'number' ? parseFloat(el.value) : el.value;
      state.profile[field.key] = value;
      updateBMRDisplay();
    });
  }

  // Calorie goal
  const goalInput = $('#calorie-goal');
  goalInput?.addEventListener('change', () => {
    state.profile.dailyCalorieGoal = parseInt(goalInput.value);
    toast('Daily calorie goal updated', 'success');
  });

  // Goal presets
  $$('[data-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = parseInt(btn.dataset.goal);
      if (goalInput) goalInput.value = goal;
      state.profile.dailyCalorieGoal = goal;
      toast(`Calorie goal set to ${formatCalories(goal)} kcal`, 'success');
    });
  });
}

function updateBMRDisplay() {
  const bmr = Math.round(calculateBMR());
  const tdee = calculateTDEE();
  const bmrEl = $('#bmr-value');
  const tdeeEl = $('#tdee-value');
  if (bmrEl) bmrEl.textContent = formatCalories(bmr);
  if (tdeeEl) tdeeEl.textContent = formatCalories(tdee);
}
