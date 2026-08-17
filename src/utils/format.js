/**
 * NutriVision AI — Formatting Utilities
 */

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format calories
 */
export function formatCalories(cal) {
  return formatNumber(Math.round(cal));
}

/**
 * Format grams
 */
export function formatGrams(g, decimals = 1) {
  if (g === null || g === undefined) return '0g';
  return `${formatNumber(g, decimals)}g`;
}

/**
 * Format milligrams
 */
export function formatMg(mg, decimals = 1) {
  if (mg === null || mg === undefined) return '0mg';
  if (mg >= 1000) return `${formatNumber(mg / 1000, 1)}g`;
  return `${formatNumber(mg, decimals)}mg`;
}

/**
 * Format micrograms
 */
export function formatMcg(mcg, decimals = 1) {
  if (mcg === null || mcg === undefined) return '0mcg';
  if (mcg >= 1000) return `${formatNumber(mcg / 1000, 1)}mg`;
  return `${formatNumber(mcg, decimals)}mcg`;
}

/**
 * Format nutrient value with appropriate unit
 */
export function formatNutrient(value, unit) {
  if (unit === 'kcal') return formatCalories(value);
  if (unit === 'g') return formatGrams(value);
  if (unit === 'mg') return formatMg(value);
  if (unit === 'mcg') return formatMcg(value);
  return `${formatNumber(value, 1)} ${unit}`;
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
export function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string (YYYY-MM-DD) from a Date
 */
export function dateString(date) {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLen = 40) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
