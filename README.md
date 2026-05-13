# CashFlow 💸

> A beautiful, privacy-first personal finance tracker that lives entirely in your browser.  
> No account required. No bank sync. No subscriptions. **Your money, your data.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

### 🔗 [Try the Live Demo](https://czeusdc.github.io/CashFlow/)

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📊 | **Dashboard** | Net worth card, income vs expenses chart, spending streak, and top category breakdown |
| 💳 | **Transactions** | Add, edit, search, and filter by month, type, or category |
| 🏷️ | **Categories** | Custom categories with emoji, color, budget limits, and savings APR tracking |
| 🔁 | **Recurring Transactions** | Weekly, monthly, or yearly reminders with automatic next-due tracking |
| 💹 | **Savings Projections** | Compound interest estimates for savings accounts |
| 📤 | **Export** | JSON backup, CSV, and Excel (`.xlsx`) |
| 📱 | **Share / QR Code** | Transfer data to another device instantly — no server, no account |
| 🎨 | **Themes** | 6 accent colors × 3 UI styles (Glassmorphism, Material You, Nordic Clean) × Light/Dark mode |
| ⌨️ | **Keyboard Shortcut** | Press `N` anywhere to quickly open the Add Transaction form |
| 🔒 | **100% Local** | All data lives in IndexedDB in your browser. Nothing ever leaves your device. |
| 🌐 | **Offline-Ready** | Fully functional without an internet connection after first load |

---

## 🖥️ Tech Stack

| Package | Version | Role |
|---|---|---|
| [React](https://react.dev) | 19 | UI library |
| [Vite](https://vitejs.dev) | 8 | Build tool & dev server |
| [react-router-dom](https://reactrouter.com) | 7 | Client-side routing |
| [idb](https://github.com/jakearchibald/idb) | latest | Typed IndexedDB wrapper |
| [Chart.js](https://www.chartjs.org) + [react-chartjs-2](https://react-chartjs-2.js.org) | — | Data visualisation |
| [Lucide React](https://lucide.dev) | — | Icons |
| [dayjs](https://day.js.org) | — | Lightweight date handling |
| [SheetJS (xlsx)](https://sheetjs.com) | — | Excel export |
| [emoji-mart](https://github.com/missive/emoji-mart) | — | Emoji picker |
| [qrcode.react](https://github.com/zpao/qrcode.react) | — | QR code generation |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/czeusdc/cashflow.git
cd cashflow

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `/dist`. Deploy anywhere that supports static hosting — [GitHub Pages](https://pages.github.com/), [Vercel](https://vercel.com/), [Netlify](https://netlify.com/), etc.

This project is automatically deployed to **GitHub Pages** on every push to `main`.
Check it out here: **[czeusdc.github.io/CashFlow](https://czeusdc.github.io/CashFlow/)**

### Lint

```bash
npm run lint
```

---

## 📁 Project Structure

```
cashflow/
├── public/
│   └── fonts/              # Self-hosted WOFF2 fonts (Inter, Roboto, Space Grotesk)
├── src/
│   ├── components/         # Reusable UI: forms, charts, modals, navbar, toasts
│   │   ├── CategoryForm.jsx
│   │   ├── MonthlyChart.jsx
│   │   ├── Navbar.jsx
│   │   ├── QRExport.jsx
│   │   ├── RecurringReminder.jsx
│   │   ├── Toast.jsx
│   │   └── TransactionForm.jsx
│   ├── contexts/
│   │   └── AppContext.jsx   # Global state: currency, profile, theme mode
│   ├── db/
│   │   └── idb.js           # All IndexedDB read/write — single source of truth for data
│   ├── hooks/
│   │   ├── useCategories.js
│   │   ├── useCurrency.js
│   │   ├── useProfile.js
│   │   ├── useTheme.js
│   │   └── useTransactions.js
│   ├── lib/
│   │   └── constants.js     # Storage keys, validation & sanitization helpers
│   ├── pages/
│   │   ├── Categories.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Settings.jsx
│   │   └── Transactions.jsx
│   ├── App.jsx              # Root component — routing and global hook wiring
│   └── index.css            # CSS variables, themes, and global styles
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔒 Privacy & Security

CashFlow is designed with privacy as a first principle:

- **No telemetry** — zero analytics, trackers, or beacons
- **No CDN fonts** — typefaces are bundled locally; no requests to Google Fonts
- **Content Security Policy** — a strict CSP is set in `index.html` to prevent unauthorized resource loading
- **No server** — there is no backend; your data never leaves your browser
- **Portable data** — export a full JSON backup anytime and import it on any device

---

## 🙏 Support

If CashFlow has helped you take control of your finances, consider supporting its development!

[![ko-fi](https://storage.ko-fi.com/cdn/kofi2.png?v=6)](https://ko-fi.com/K3K71ZAC47)

---

## 🤝 Contributing

Bug reports and pull requests are welcome. 

---

## 📄 License

MIT © [czeusdc](https://github.com/czeusdc)
