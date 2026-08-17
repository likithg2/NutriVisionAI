/**
 * NutriVision AI — DOM Utilities
 */

/**
 * Create an element with attributes and children
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) {
        element.dataset[dk] = dv;
      }
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Query selector shorthand
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * Set innerHTML safely and return the container
 */
export function html(container, content) {
  if (typeof container === 'string') {
    container = $(container);
  }
  if (container) {
    container.innerHTML = content;
  }
  return container;
}

/**
 * Add animation class and remove after animation ends
 */
export function animate(element, animationClass) {
  return new Promise((resolve) => {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
      element.classList.remove(animationClass);
      resolve();
    }, { once: true });
  });
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Show toast notification
 */
export function toast(message, type = 'info', duration = 3000) {
  const container = $('#toast-container') || createToastContainer();
  const toastEl = el('div', { className: `toast toast--${type} toast--enter` },
    el('span', { className: 'toast__icon' }, type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'),
    el('span', { className: 'toast__message' }, message)
  );
  container.appendChild(toastEl);

  requestAnimationFrame(() => {
    toastEl.classList.remove('toast--enter');
    toastEl.classList.add('toast--visible');
  });

  setTimeout(() => {
    toastEl.classList.remove('toast--visible');
    toastEl.classList.add('toast--exit');
    toastEl.addEventListener('animationend', () => toastEl.remove(), { once: true });
  }, duration);
}

function createToastContainer() {
  const container = el('div', { id: 'toast-container', className: 'toast-container' });
  document.body.appendChild(container);
  return container;
}
