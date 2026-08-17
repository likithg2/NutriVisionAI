/**
 * NutriVision AI — Main Application
 * App initialization, routing, and view management
 */

import './styles/index.css';
import { state, subscribe } from './state.js';
import { $ } from './utils/dom.js';
import { VIEWS } from './utils/constants.js';
import { renderHeader, initHeaderEvents } from './components/header.js';
import { renderScanner, initScannerEvents } from './components/scanner.js';
import { renderSearch, initSearchEvents } from './components/search.js';
import { renderDashboard, initDashboardCharts } from './components/dashboard.js';
import { renderTracker, initTrackerEvents } from './components/tracker.js';
import { renderSettings, initSettingsEvents } from './components/settings.js';

// View renderers map
const viewRenderers = {
  [VIEWS.SCANNER]: { render: renderScanner, init: initScannerEvents },
  [VIEWS.SEARCH]: { render: renderSearch, init: initSearchEvents },
  [VIEWS.DASHBOARD]: { render: renderDashboard, init: initDashboardCharts },
  [VIEWS.TRACKER]: { render: renderTracker, init: initTrackerEvents },
  [VIEWS.SETTINGS]: { render: renderSettings, init: initSettingsEvents },
};

/**
 * Initialize the application
 */
function init() {
  const app = $('#app');
  if (!app) return;

  // Render header + initial view
  app.innerHTML = `
    ${renderHeader()}
    <main class="main" id="main-content">
      ${renderView(state.currentView)}
    </main>
  `;

  // Initialize header navigation
  initHeaderEvents(navigateTo);

  // Initialize current view events
  initView(state.currentView);

  // Listen for state changes that require re-render
  subscribe((path) => {
    if (path === 'dailyLog') {
      // Re-render if on dashboard or tracker
      if (state.currentView === VIEWS.DASHBOARD || state.currentView === VIEWS.TRACKER) {
        renderViewIntoMain(state.currentView);
      }
    }
  });
}

/**
 * Navigate to a view
 */
function navigateTo(viewId) {
  if (!viewRenderers[viewId]) return;
  state.currentView = viewId;
  renderViewIntoMain(viewId);
}

/**
 * Render view HTML
 */
function renderView(viewId) {
  const renderer = viewRenderers[viewId];
  return renderer ? renderer.render() : '<div class="view">Unknown view</div>';
}

/**
 * Initialize view event handlers
 */
function initView(viewId) {
  const renderer = viewRenderers[viewId];
  if (renderer?.init) {
    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => renderer.init());
  }
}

/**
 * Render view into main content area
 */
function renderViewIntoMain(viewId) {
  const main = $('#main-content');
  if (!main) return;

  main.innerHTML = renderView(viewId);
  initView(viewId);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
