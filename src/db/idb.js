/**
 * idb.js — IndexedDB layer for CashFlow
 *
 * This is the single data-access layer for the entire app.
 * All reads and writes to persistent storage happen here.
 * Components and hooks should never call IndexedDB directly.
 *
 * ── Database Schema ──────────────────────────────────────────────────────────
 *
 *  DB: "cashflow-db"  Version: 2
 *
 *  Store: "transactions"   keyPath: id (autoIncrement)
 *    Indexes: date, type, categoryId
 *    Fields: id, type, amount, categoryId, date, notes, addedBy,
 *            isRecurring, recurrenceFrequency, nextDue, createdAt
 *
 *  Store: "categories"     keyPath: id (autoIncrement)
 *    Fields: id, name, emoji, color, type, budgetLimit,
 *            isBank, bankName, apr, isDailyInterest
 *
 *  Store: "settings"       (key-value, simple string key)
 *    Used as a future-proof overflow for settings that don't fit localStorage.
 *    Current app writes preferences directly to localStorage instead.
 *
 * ── Migration Notes ───────────────────────────────────────────────────────────
 *  v1 → v2: Added the "settings" object store.
 *            New transaction/category fields (addedBy, isBank, etc.) are
 *            schemaless in IDB, so no migration needed — they're just written
 *            at save time.
 */

import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORAGE_KEYS } from '../lib/constants';

// Singleton promise — avoids re-opening the DB on every call.
let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // ── v1 stores ─────────────────────────────────────────────────────────
        if (oldVersion < 1) {
          const txStore = db.createObjectStore('transactions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          txStore.createIndex('date',       'date');
          txStore.createIndex('type',       'type');
          txStore.createIndex('categoryId', 'categoryId');

          db.createObjectStore('categories', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // ── v2 stores ─────────────────────────────────────────────────────────
        if (oldVersion < 2) {
          // Key-value store for future settings that outgrow localStorage.
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        }
      },
    });
  }
  return dbPromise;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getAllTransactions() {
  const db = await getDB();
  const all = await db.getAll('transactions');
  
  // Sort newest-first. We use a robust comparison that handles undefined or 
  // invalid dates gracefully.
  return all.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

export async function addTransaction(tx) {
  const db = await getDB();
  const id = await db.add('transactions', { ...tx, createdAt: new Date().toISOString() });
  return { ...tx, id };
}

export async function updateTransaction(tx) {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id) {
  const db = await getDB();
  await db.delete('transactions', id);
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Built-in categories seeded on first launch.
 * These are written to IDB so the user can edit or delete them like any other category.
 */
const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks',   emoji: '🍔', color: '#F59E0B', type: 'expense' },
  { name: 'Transport',       emoji: '🚗', color: '#3B82F6', type: 'expense' },
  { name: 'Shopping',        emoji: '🛍️', color: '#EC4899', type: 'expense' },
  { name: 'Housing',         emoji: '🏠', color: '#8B5CF6', type: 'expense' },
  { name: 'Health',          emoji: '💊', color: '#10B981', type: 'expense' },
  { name: 'Entertainment',   emoji: '🎮', color: '#F97316', type: 'expense' },
  { name: 'Utilities',       emoji: '💡', color: '#EAB308', type: 'expense' },
  { name: 'Salary',          emoji: '💼', color: '#22C55E', type: 'income'  },
  { name: 'Freelance',       emoji: '💻', color: '#06B6D4', type: 'income'  },
  { name: 'Gift',            emoji: '🎁', color: '#A78BFA', type: 'income'  },
  { name: 'Investment',      emoji: '📈', color: '#14B8A6', type: 'income'  },
  { name: 'Emergency Fund',  emoji: '🛡️', color: '#F43F5E', type: 'savings',
             isBank: false, apr: 0, isDailyInterest: false, budgetLimit: null },
  { name: 'Travel Fund',     emoji: '✈️', color: '#0EA5E9', type: 'savings',
             isBank: false, apr: 0, isDailyInterest: false, budgetLimit: null },
  { name: 'Retirement',      emoji: '🏦', color: '#64748B', type: 'savings',
             isBank: false, apr: 0, isDailyInterest: false, budgetLimit: null },
  { name: 'Other',           emoji: '📌', color: '#94A3B8', type: 'expense', budgetLimit: null },
];

export async function getAllCategories() {
  const db = await getDB();
  const all = await db.getAll('categories');

  // First launch: seed the default categories so the user isn't starting from scratch.
  if (all.length === 0) {
    const tx = db.transaction('categories', 'readwrite');
    await Promise.all(DEFAULT_CATEGORIES.map(c => tx.store.put(c)));
    await tx.done;
    return DEFAULT_CATEGORIES;
  }

  return all;
}

export async function addCategory(cat) {
  const db = await getDB();
  const id = await db.add('categories', cat);
  return { ...cat, id };
}

export async function updateCategory(cat) {
  const db = await getDB();
  await db.put('categories', cat);
}

export async function deleteCategory(id) {
  const db = await getDB();
  await db.delete('categories', id);
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────

/**
 * exportData()
 *
 * Collects all transactions, categories, and localStorage preferences into a
 * single serialisable object. This is the source of truth for JSON backups,
 * CSV/Excel exports, and the share-link QR feature.
 */
export async function exportData() {
  const [transactions, categories] = await Promise.all([
    getAllTransactions(),
    getAllCategories(),
  ]);

  // Bundle all user preferences so they restore alongside the data.
  const settings = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) settings[key] = val;
  });

  return { transactions, categories, settings, exportedAt: new Date().toISOString(), version: 2 };
}

/**
 * importData({ transactions, categories, settings })
 *
 * Replaces ALL current IDB data and localStorage settings with the provided snapshot.
 * This is intentionally destructive — callers must confirm with the user first.
 */
export async function importData({ transactions, categories, settings }) {
  const db = await getDB();

  // Clear and re-populate both stores in a single atomic transaction.
  // We use a serial loop instead of Promise.all to keep memory usage stable.
  const tx = db.transaction(['transactions', 'categories'], 'readwrite');
  
  const txStore = tx.objectStore('transactions');
  await txStore.clear();
  for (const t of transactions) {
    await txStore.put(t);
  }

  const catStore = tx.objectStore('categories');
  await catStore.clear();
  for (const c of (categories || [])) {
    await catStore.put(c);
  }

  await tx.done;

  // Restore user preferences if they were included in the backup.
  // We only restore keys that are explicitly defined in STORAGE_KEYS
  // to prevent potential localStorage pollution/XSS.
  if (settings) {
    const validKeys = Object.values(STORAGE_KEYS);
    Object.entries(settings).forEach(([key, value]) => {
      if (validKeys.includes(key)) {
        localStorage.setItem(key, value);
      }
    });
  }
}

// ─── Clear All Data ───────────────────────────────────────────────────────────

/**
 * clearAllData()
 *
 * Wipes all transactions and categories from IDB.
 * Does NOT clear localStorage settings — the user keeps their theme/currency.
 */
export async function clearAllData() {
  const db = await getDB();
  const tx = db.transaction(['transactions', 'categories'], 'readwrite');
  await tx.objectStore('transactions').clear();
  await tx.objectStore('categories').clear();
  await tx.done;
}

// ─── Settings (key-value) ─────────────────────────────────────────────────────
// Thin wrappers around the IDB "settings" store.
// Currently unused by the app (preferences live in localStorage for simplicity),
// but kept as an upgrade path for future multi-user or cross-tab sync needs.

export async function getSetting(key) {
  const db = await getDB();
  return db.get('settings', key);
}

export async function setSetting(key, value) {
  const db = await getDB();
  return db.put('settings', value, key);
}
