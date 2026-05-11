/**
 * useTheme.js
 *
 * Manages theme (color), mode (dark/light), and UI style (glass/material/nordic).
 * All settings are persisted to localStorage and synced to data attributes on <html>.
 *
 * Returns:
 *   theme, mode, style - current values
 *   setTheme, setMode, setStyle, toggleMode - setters
 *   THEMES, MODES, STYLES - exported arrays for use in UI controls
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, isValidTheme, isValidStyle } from '../lib/constants';

/** Available accent colors for theming. */
export const THEMES = ['teal', 'violet', 'amber', 'mint', 'crimson', 'bluesky'];
/** UI modes (handled by CSS `[data-mode]` attribute). */
export const MODES = ['dark', 'light'];
/** UI styles (handled by CSS `[data-style]` attribute). */
export const STYLES = ['glass', 'material', 'nordic'];

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const t = localStorage.getItem(STORAGE_KEYS.THEME);
    return isValidTheme(t) ? t : 'teal';
  });
  const [mode, setModeState] = useState(() => {
    const m = localStorage.getItem(STORAGE_KEYS.MODE);
    return ['dark', 'light'].includes(m) ? m : 'dark';
  });
  const [style, setStyleState] = useState(() => {
    const s = localStorage.getItem(STORAGE_KEYS.STYLE);
    return isValidStyle(s) ? s : 'glass';
  });

  const apply = useCallback((t, m, s) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-mode', m);
    document.documentElement.setAttribute('data-style', s);
  }, []);

  useEffect(() => { apply(theme, mode, style); }, [theme, mode, style, apply]);

  const setTheme = useCallback((t) => {
    if (!THEMES.includes(t)) return;
    localStorage.setItem(STORAGE_KEYS.THEME, t);
    setThemeState(t);
  }, []);

  const setMode = useCallback((m) => {
    if (!MODES.includes(m)) return;
    localStorage.setItem(STORAGE_KEYS.MODE, m);
    setModeState(m);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const setStyle = useCallback((s) => {
    if (!STYLES.includes(s)) return;
    localStorage.setItem(STORAGE_KEYS.STYLE, s);
    setStyleState(s);
  }, []);

  return { theme, mode, style, setTheme, setMode, toggleMode, setStyle, THEMES, MODES, STYLES };
}
