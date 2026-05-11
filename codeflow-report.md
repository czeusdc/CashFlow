# CodeFlow Analysis Report

**Repository:** czeusdc/CashFlow
**Analyzed:** 12/05/2026, 02:13:22

## Summary

| Metric | Value |
|--------|-------|
| Health Score | 87/100 (B) |
| Files | 33 |
| Functions | 164 |
| Lines of Code | 7,688 |
| Dependencies | 89 |
| Unused Functions | 0 |
| Security Issues | 1 |

## Security Issues

### HIGH: SQL Injection Risk
- **File:** `src/pages/Categories.jsx`
- **Description:** String concatenation in SQL queries. Use parameterized queries instead.
- **Code:** `if (cat.id) { await onUpdate(cat); toast(`Category '${cat.name}' updated ✓`, 'su`

## Design Patterns

### Factory
Creates objects without specifying exact class. Enables loose coupling and extensibility.

**Files:** `CategoryForm.jsx`, `ProfileSetupModal.jsx`, `QRExport.jsx`, `Toast.jsx`, `TransactionForm.jsx`NaN more)

### Observer/Event
Defines a subscription mechanism for event-driven architecture. Great for decoupling.

**Files:** `App.jsx`

### Custom Hooks
React hooks for reusable stateful logic. Promotes code reuse and separation of concerns.

**Files:** `Toast.jsx`, `AppContext.jsx`, `useCategories.js`, `useCurrency.js`, `useProfile.js`NaN more)

### Context Provider
React Context for global state. Alternative to prop drilling.

**Files:** `App.jsx`, `Toast.jsx`, `AppContext.jsx`

## Anti-Patterns

### God Object
Files with too many responsibilities (15+ functions). Consider splitting into smaller modules.

**Affected files:** `Dashboard.jsx`, `Settings.jsx`

### Long File
Files over 500 lines are harder to maintain. Consider breaking into smaller modules.

**Affected files:** `Settings.jsx`

### VBA God Module
VBA modules with 20+ procedures. Consider splitting into smaller modules.

**Affected files:** `Settings.jsx`

## Architecture Issues

### 2 Large Files
Files with 15+ functions

**Affected:** `Dashboard.jsx (17 fns)`, `Settings.jsx (28 fns)`

### 3 Highly Coupled
Files imported by 8+ others

**Affected:** `App.jsx (14 imports)`, `Dashboard.jsx (11 imports)`, `Settings.jsx (11 imports)`

### 3 Circular Dependencies
Files that import each other

**Affected:** `App.jsx ↔ ProfileSetupModal.jsx`, `App.jsx ↔ TransactionForm.jsx`, `App.jsx ↔ Settings.jsx`

### 1 Similar Code Blocks
Copy-paste code detected

**Affected:** `compress, decompress, handleSave`

### 35 Architecture Violations
Lower layers importing from higher layers

**Affected:** `utils → components`, `utils → components`, `utils → components`, `utils → components`, `utils → components`

### 7 High Complexity Files
Files with complexity score >30

**Affected:** `Settings.jsx (81)`, `Dashboard.jsx (69)`, `TransactionForm.jsx (50)`, `QRExport.jsx (39)`, `MonthlyChart.jsx (37)`

## File Details

| File | Folder | Layer | Lines | Functions |
|------|--------|-------|-------|----------|
| `.gitignore` | root | utils | 52 | 0 |
| `LICENSE` | root | utils | 22 | 0 |
| `README.md` | root | note | 157 | 0 |
| `eslint.config.js` | root | utils | 22 | 0 |
| `index.html` | root | utils | 17 | 0 |
| `package-lock.json` | root | utils | 2710 | 0 |
| `package.json` | root | utils | 42 | 0 |
| `App.jsx` | src | utils | 152 | 6 |
| `CategoryForm.jsx` | src/components | components | 174 | 13 |
| `MonthlyChart.jsx` | src/components | components | 160 | 4 |
| `Navbar.jsx` | src/components | components | 78 | 3 |
| `ProfileSetupModal.jsx` | src/components | components | 90 | 5 |
| `QRExport.jsx` | src/components | components | 198 | 12 |
| `RecurringReminder.jsx` | src/components | components | 56 | 2 |
| `SummaryCard.jsx` | src/components | components | 58 | 3 |
| `Toast.jsx` | src/components | components | 59 | 2 |
| `TransactionForm.jsx` | src/components | components | 258 | 15 |
| `TransactionItem.jsx` | src/components | components | 74 | 3 |
| `AppContext.jsx` | src/contexts | utils | 36 | 4 |
| `idb.js` | src/db | utils | 255 | 15 |
| `useCategories.js` | src/hooks | utils | 85 | 1 |
| `useCurrency.js` | src/hooks | utils | 67 | 2 |
| `useProfile.js` | src/hooks | utils | 49 | 2 |
| `useTheme.js` | src/hooks | utils | 69 | 1 |
| `useTransactions.js` | src/hooks | utils | 128 | 1 |
| `index.css` | src | utils | 1198 | 0 |
| `constants.js` | src/lib | utils | 76 | 3 |
| `main.jsx` | src | utils | 11 | 0 |
| `Categories.jsx` | src/pages | ui | 160 | 11 |
| `Dashboard.jsx` | src/pages | ui | 412 | 17 |
| `Settings.jsx` | src/pages | ui | 538 | 28 |
| `Transactions.jsx` | src/pages | ui | 217 | 11 |
| `vite.config.js` | root | utils | 8 | 0 |
