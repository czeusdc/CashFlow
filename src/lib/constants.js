/**
 * constants.js
 *
 * Central registry for every magic string used across CashFlow.
 * Import from here instead of repeating raw strings in multiple files,
 * so a key rename is always a one-file change.
 */

// ─── IndexedDB configuration ─────────────────────────────────────────────────

export const DB_NAME    = 'cashflow-db';
export const DB_VERSION = 2;

// ─── localStorage keys ────────────────────────────────────────────────────────

/**
 * All keys CashFlow writes to localStorage.
 * These are also the keys that get bundled into JSON/share-link backups
 * (see exportData() in db/idb.js).
 */
export const STORAGE_KEYS = {
  /** JSON-encoded user profile ({ name, avatar }) */
  PROFILE:        'cf-profile',

  /** ISO currency code, e.g. "USD", "PHP" */
  CURRENCY:       'cf-currency',

  /** Active colour theme id, e.g. "teal" | "crimson" */
  THEME:          'cf-theme',

  /** Colour mode: "dark" | "light" */
  MODE:           'cf-mode',

  /** UI style: "glass" | "material" | "nordic" */
  STYLE:          'cf-style',

  /** Selected chart range: "6M" | "Yearly" | "All Time" */
  CHART_RANGE:    'cf-chart-range',

  /** Selected summary period: "thisQuarter" | "ytd" | "allTime" */
  SUMMARY_PERIOD: 'cf-summary-period',

  /** Boolean string — hides the Net Worth card on the Dashboard */
  HIDE_NETWORTH:  'cf-hide-networth',

  /** Boolean string — hides the Estimated Savings Interest card */
  HIDE_INTEREST:  'cf-hide-interest',
};

// ─── Sanitization Helpers ───────────────────────────────────────────────────

/** Safely parses the user profile from localStorage. */
export function getSafeProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return { name: '', avatar: '👤' };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 50) : '',
      avatar: typeof parsed.avatar === 'string' ? parsed.avatar : '👤',
    };
  } catch {
    return { name: '', avatar: '👤' };
  }
}

/** Validates if a string is a valid theme. */
export function isValidTheme(t) {
  return ['teal', 'violet', 'amber', 'mint', 'crimson', 'bluesky'].includes(t);
}

/** Validates if a string is a valid UI style. */
export function isValidStyle(s) {
  return ['glass', 'material', 'nordic'].includes(s);
}
