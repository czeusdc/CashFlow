# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with HMR
npm run build    # Production build to dist/
npm run lint     # ESLint (flat config)
npm run preview  # Preview production build
```

## Architecture

CashFlow is a client-only personal budget tracker (React 19 + Vite). All data lives in the browser — no backend.

- **Persistence**: IndexedDB via `idb` (`src/db/idb.js`). Stores transactions, categories (with 15 defaults), and key-value settings. Backup/restore exports a JSON blob.
- **State flow**: Custom hooks (`useTransactions`, `useCategories`, `useTheme`, `useCurrency`, `useProfile`) wrap the DB layer. `AppContext` exposes shared state (currency formatter, theme, profile) to all components.
- **Routing**: `HashRouter` with four pages — `/` (Dashboard), `/transactions`, `/categories`, `/settings`.
- **Theming**: CSS custom properties on `[data-theme]` and `[data-mode]` attributes. 6 color themes × dark/light × 3 UI styles (glassmorphism, material, nordic). The `useTheme` hook persists choices to localStorage.
- **Multi-currency**: 12 currencies supported. Stored in `cf-currency` localStorage key. Formatting via `Intl.NumberFormat`.

## Key patterns

- Modals use `createPortal` to `document.body`. Forms are controlled components with local state, then passed up via `onSave` callbacks.
- Category types are `expense`, `income`, or `savings`. Savings categories support optional APR/compound interest tracking.
- Transactions have an optional `recurring` object (`{ freq, nextDue }`). The `RecurringReminder` component detects overdue recurring transactions.
- QR-based data transfer: `QRExport` compresses the full DB export, splits it across QR codes, and `QRExport` can also scan/import them.
- XLSX export: `Settings.jsx` uses `xlsx` to export transactions as a spreadsheet.
- Toast notifications via `ToastProvider` context — call `useToast()` and use `.success()`, `.error()`, `.info()`.

## File map

```
src/
  main.jsx              # Entry point
  App.jsx               # Context + router wiring
  index.css             # All styles (CSS variables, themes, components)
  db/idb.js             # IndexedDB CRUD layer
  hooks/                # useTransactions, useCategories, useTheme, useCurrency, useProfile
  contexts/AppContext   # Shared app state context
  components/           # Navbar, Toast, TransactionForm, TransactionItem, CategoryForm,
                        #   MonthlyChart, SummaryCard, RecurringReminder, QRExport,
                        #   ProfileSetupModal
  pages/                # Dashboard, Transactions, Categories, Settings
```