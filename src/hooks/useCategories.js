/**
 * useCategories.js
 *
 * Manages the list of transaction categories with persistence and auto-refresh.
 *
 * Returns:
 *   categories  - array of category objects
 *   loading     - boolean for initial load
 *   add, update, remove - CRUD operations
 *   getById     - lookup a category by id
 *   reload      - manual refresh (called after import/clear in Settings)
 *
 * Design note:
 *   The 5-second polling interval is used to detect changes made in other tabs,
 *   such as after a user imports a backup on the Settings page.
 *   Performance: the poll only runs when the browser tab is active (visible).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../db/idb';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const countRef = useRef(0);

  const reload = useCallback(async () => {
    const data = await getAllCategories();
    setCategories(data);
    countRef.current = data.length;
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: async IDB load then setState is not a cascade
  useEffect(() => { reload(); }, [reload]);

  // Auto-refresh: poll IndexedDB every 5s. 
  // Performance optimization: only poll when the tab is visible.
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const data = await getAllCategories();
        if (data.length !== countRef.current) {
          setCategories(data);
          countRef.current = data.length;
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const add = useCallback(async (cat) => {
    const saved = await addCategory(cat);
    setCategories(prev => {
      const next = [...prev, saved];
      countRef.current = next.length;
      return next;
    });
    return saved;
  }, []);

  const update = useCallback(async (cat) => {
    await updateCategory(cat);
    setCategories(prev => prev.map(c => (c.id === cat.id ? cat : c)));
  }, []);

  const remove = useCallback(async (id) => {
    await deleteCategory(id);
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      countRef.current = next.length;
      return next;
    });
  }, []);

  const getById = useCallback(
    (id) => categories.find(c => c.id === id) || null,
    [categories]
  );

  return { categories, loading, add, update, remove, getById, reload };
}
