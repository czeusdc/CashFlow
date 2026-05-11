/**
 * App.jsx — Root component
 *
 * Responsibilities:
 *  - Bootstraps all data hooks (transactions, categories, theme, currency, profile)
 *  - Builds the AppContext value shared with every page
 *  - Renders the router, sidebar, and global overlays (profile setup, quick-add)
 *  - Registers the "N" keyboard shortcut to open a quick-add transaction modal
 */

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar            from './components/Navbar';
import { ToastProvider } from './components/Toast';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useTransactions } from './hooks/useTransactions';
import { useCategories }   from './hooks/useCategories';
import { useTheme }        from './hooks/useTheme';
import { useCurrency }     from './hooks/useCurrency';
import { useProfile }      from './hooks/useProfile';
import { AppContext }       from './contexts/AppContext';
import Dashboard     from './pages/Dashboard';
import Transactions  from './pages/Transactions';
import Categories    from './pages/Categories';
import Settings      from './pages/Settings';
import TransactionForm from './components/TransactionForm';

export default function App() {
  // ── Data hooks ────────────────────────────────────────────────────────────
  const tx       = useTransactions();
  const cat      = useCategories();
  const themeCtx = useTheme();
  const currCtx  = useCurrency();
  const { profile, setProfile, isSetup } = useProfile();

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuickAdd,     setShowQuickAdd]     = useState(false);

  // Show the profile setup modal on first launch (delayed to avoid flash).
  useEffect(() => {
    if (!isSetup) {
      const timer = setTimeout(() => setShowProfileModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isSetup]);

  // Global keyboard shortcut: press "N" to open a quick-add transaction modal.
  // Skipped when focus is inside any text input so typing is not intercepted.
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'n' || e.key === 'N') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        setShowQuickAdd(true);
      }
      if (e.key === 'Escape') {
        setShowQuickAdd(false);
        setShowProfileModal(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (tx.loading || cat.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading CashFlow…</p>
      </div>
    );
  }

  // Refresh all data from IDB — called by Settings after import/clear.
  async function refresh() {
    await tx.reload();
    await cat.reload();
  }

  // ── Context value ─────────────────────────────────────────────────────────
  // Single source of truth for currency formatting and user profile.
  // Pages read this via useApp() instead of receiving props.
  const appCtx = {
    fmt:         currCtx.fmt,
    currency:    currCtx.currency,
    setCurrency: currCtx.setCurrency,
    profile,
    setProfile,
    mode:        themeCtx.mode,
    isSetup,
  };

  return (
    <AppContext.Provider value={appCtx}>
      <HashRouter>
        <ToastProvider>
          <div className="app-layout">
            <Navbar />

            <Routes>
              <Route path="/" element={
                <Dashboard
                  transactions={tx.transactions} categories={cat.categories}
                  totals={tx.totals} onAdd={tx.add} onUpdate={tx.update} onDelete={tx.remove}
                  themeStyle={themeCtx.style}
                  themeColor={themeCtx.theme}
                />
              } />
              <Route path="/transactions" element={
                <Transactions
                  transactions={tx.transactions} categories={cat.categories}
                  onAdd={tx.add} onUpdate={tx.update} onDelete={tx.remove}
                />
              } />
              <Route path="/categories" element={
                <Categories
                  categories={cat.categories} transactions={tx.transactions}
                  onAdd={cat.add} onUpdate={cat.update} onDelete={cat.remove}
                />
              } />
              <Route path="/settings" element={
                <Settings
                  onRefresh={refresh}
                  theme={themeCtx.theme} mode={themeCtx.mode} style={themeCtx.style}
                  setTheme={themeCtx.setTheme} toggleMode={themeCtx.toggleMode} setStyle={themeCtx.setStyle}
                  currency={currCtx.currency} setCurrency={currCtx.setCurrency}
                />
              } />
            </Routes>
          </div>

          {/* First-run profile setup modal */}
          {showProfileModal && (
            <ProfileSetupModal onClose={() => setShowProfileModal(false)} />
          )}

          {/* Quick-add modal triggered by the "N" keyboard shortcut */}
          {showQuickAdd && (
            <TransactionForm
              categories={cat.categories}
              onSave={async (t) => { await tx.add(t); setShowQuickAdd(false); }}
              onClose={() => setShowQuickAdd(false)}
            />
          )}
        </ToastProvider>
      </HashRouter>
    </AppContext.Provider>
  );
}
