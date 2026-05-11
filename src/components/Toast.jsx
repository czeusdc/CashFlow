/**
 * Toast.jsx
 *
 * A lightweight in-app notification system.
 *
 * Usage:
 *   1. Wrap your app tree with <ToastProvider>.
 *   2. In any child component: const toast = useToast();
 *   3. Call: toast('Your message', 'success' | 'error' | 'info')
 *
 * Toasts auto-dismiss after 3 seconds and animate in/out via CSS.
 */

import { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

// Monotonically-incrementing ID so React keys are always unique.
let toastId = 0;

// Icon lookup keyed by toast type.
const ICONS = {
  success: <CheckCircle size={16} color="var(--income)"  />,
  error:   <AlertCircle size={16} color="var(--expense)" />,
  info:    <Info        size={16} color="var(--accent)"  />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto-remove after 3 s (matches the CSS fadeOut animation duration).
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {ICONS[t.type]}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns the toast() function from the nearest ToastProvider. */
// eslint-disable-next-line react-refresh/only-export-components -- intentional: companion hook co-located with provider
export function useToast() {
  return useContext(ToastContext);
}
