/**
 * AppContext.jsx
 *
 * Defines the global AppContext that provides currency formatting and user
 * profile data to every component without prop-drilling.
 *
 * The context is populated by App.jsx and consumed anywhere via `useApp()`.
 *
 * Context shape:
 *   fmt(number)   - formats a number as a localised currency string
 *   currency      - { code, symbol, locale, label } — active currency object
 *   setCurrency   - updates the active currency
 *   profile       - { name, avatar } — current user profile
 *   setProfile    - merges updates into the profile
 *   theme         - active accent color
 *   setTheme      - updates the accent color
 *   mode          - "dark" | "light"
 *   setMode       - updates the UI mode
 *   toggleMode    - toggles between dark and light
 *   style         - active UI style
 *   setStyle      - updates the UI style
 *   isSetup       - true once the user has saved their name
 */

import { createContext, useContext } from 'react';

// Default values are fallbacks for tests or components rendered outside the provider.
export const AppContext = createContext({
  fmt:         (n) => `$${n.toFixed(2)}`,
  currency:    { code: 'USD', symbol: '$' },
  setCurrency: () => {},
  profile:     { name: '', avatar: '👤' },
  setProfile:  () => {},
  theme:       'teal',
  setTheme:    () => {},
  mode:        'dark',
  setMode:     () => {},
  toggleMode:  () => {},
  style:       'glass',
  setStyle:    () => {},
  isSetup:     false,
});

/** Convenience hook — avoids importing AppContext everywhere. */
export function useApp() {
  return useContext(AppContext);
}
