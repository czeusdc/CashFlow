/**
 * useTransactions.js
 *
 * Provides the full transaction dataset and CRUD operations to the rest of the app.
 *
 * Returns:
 *   transactions  - sorted array of all transactions (newest first)
 *   loading       - true while the initial IDB read is in flight
 *   add(tx)       - writes a new transaction and optimistically updates state
 *   update(tx)    - overwrites an existing transaction by id
 *   remove(id)    - deletes a transaction by id
 *   totals        - { income, expenses, savings, onHand } — all-time sums
 *   reload()      - manually re-fetches from IDB (used after import/clear)
 *
 * Design note:
 *   The 5-second polling interval is intentional. IndexedDB has no native
 *   change-event API across tabs. The poll allows the Settings page (which
 *   clears data or imports a backup) to propagate changes back to the
 *   Dashboard without a full page reload.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../db/idb';
import { getSafeProfile } from '../lib/constants';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);

  // countRef lets the poll skip re-renders when nothing has changed,
  // without needing transactions to be a dependency of the interval effect.
  const countRef = useRef(0);

  // Initial load from IndexedDB.
  const reload = useCallback(async () => {
    const data = await getAllTransactions();
    setTransactions(data);
    countRef.current = data.length;
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: async IDB load then setState is not a cascade
  useEffect(() => { reload(); }, [reload]);

  // Cross-tab / post-import sync: poll every 5s and refresh if count changed.
  // NOTE: This only detects add/delete (count changes), not edits.
  // A future improvement is to use the BroadcastChannel API to push
  // a lightweight invalidation signal on every write, enabling edit sync too.
  // Performance optimization: only poll when the browser tab is active.
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      
      try {
        const data = await getAllTransactions();
        if (active && data.length !== countRef.current) {
          setTransactions(data);
          countRef.current = data.length;
        }
      } catch { /* silently ignore — DB might be busy */ }
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const add = useCallback(async (tx) => {
    // Resolve the "added by" name from localStorage to avoid prop-drilling.
    const profile = getSafeProfile();
    const addedBy = profile.name || 'Me';

    const saved = await addTransaction({ ...tx, addedBy });

    setTransactions(prev => {
      const next = [saved, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
      countRef.current = next.length;
      return next;
    });

    return saved;
  }, []);

  const update = useCallback(async (tx) => {
    await updateTransaction(tx);
    setTransactions(prev =>
      prev
        .map(t => (t.id === tx.id ? tx : t))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    );
  }, []);

  const remove = useCallback(async (id) => {
    await deleteTransaction(id);
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      countRef.current = next.length;
      return next;
    });
  }, []);

  // ── Derived totals ────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const res = transactions.reduce(
      (acc, tx) => {
        if      (tx.type === 'income')  acc.income   += tx.amount;
        else if (tx.type === 'expense') acc.expenses += tx.amount;
        else if (tx.type === 'savings') acc.savings  += tx.amount;
        return acc;
      },
      { income: 0, expenses: 0, savings: 0 }
    );
    res.onHand = res.income - res.expenses - res.savings;
    return res;
  }, [transactions]);

  return { transactions, loading, add, update, remove, totals, reload };
}
