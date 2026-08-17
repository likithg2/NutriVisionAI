/**
 * NutriVision AI — Header Component
 * App branding and navigation
 */

import { state } from '../state.js';
import { $, $$ } from '../utils/dom.js';
import { VIEWS } from '../utils/constants.js';

const NAV_ITEMS = [
  { id: VIEWS.SCANNER, label: 'AI Scan', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
  { id: VIEWS.SEARCH, label: 'Search', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` },
  { id: VIEWS.DASHBOARD, label: 'Dashboard', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { id: VIEWS.TRACKER, label: 'Tracker', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
  { id: VIEWS.SETTINGS, label: 'Settings', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
];

export function renderHeader() {
  return `
    <header class="header" id="app-header">
      <div class="header__inner">
        <div class="header__brand">
          <div class="header__logo">
            <div class="header__logo-icon">
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64">
                    <stop offset="0%" stop-color="#7c3aed"/>
                    <stop offset="100%" stop-color="#06b6d4"/>
                  </linearGradient>
                </defs>
                <path d="M32 8c-14 4-18 18-16 28s10 18 16 18c6 0 14-8 16-18s-2-24-16-28z" fill="url(#logo-grad)" opacity="0.9"/>
                <path d="M32 16v28M32 16c-5 5-9 14-7 20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <h1 class="header__title">NutriVision<span class="header__title-ai">AI</span></h1>
              <p class="header__subtitle">Smart Nutrition Analyzer</p>
            </div>
          </div>
        </div>
        <nav class="header__nav" id="main-nav">
          ${NAV_ITEMS.map(item => `
            <button
              class="nav-btn ${state.currentView === item.id ? 'nav-btn--active' : ''}"
              data-view="${item.id}"
              id="nav-${item.id}"
              aria-label="${item.label}"
            >
              <span class="nav-btn__icon">${item.icon}</span>
              <span class="nav-btn__label">${item.label}</span>
            </button>
          `).join('')}
        </nav>
      </div>
    </header>
  `;
}

export function initHeaderEvents(onNavigate) {
  const nav = $('#main-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;

    const view = btn.dataset.view;
    if (view && view !== state.currentView) {
      // Update active state
      $$('.nav-btn', nav).forEach(b => b.classList.remove('nav-btn--active'));
      btn.classList.add('nav-btn--active');

      state.currentView = view;
      onNavigate(view);
    }
  });
}
