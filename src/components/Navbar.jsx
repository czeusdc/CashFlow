/**
 * Navbar.jsx
 *
 * Renders the main navigation for the app in two forms:
 *   - Sidebar (desktop): a fixed left column with the CashFlow logo, nav links,
 *     and a privacy footer note.
 *   - Bottom nav (mobile): a bottom tab bar with icons and labels.
 *
 * Active route highlighting is driven by react-router's `useLocation()`.
 * Navigation uses `useNavigate()` so the router handles all transitions.
 *
 * To add a new page to the nav, simply add an entry to NAV_ITEMS.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Tag, Settings,
} from 'lucide-react';

/** All top-level pages shown in the navigation. */
const NAV_ITEMS = [
  { path: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight   },
  { path: '/categories',   label: 'Categories',   icon: Tag              },
  { path: '/settings',     label: 'Settings',     icon: Settings         },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* ─── Sidebar (desktop) ──────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="navbar-logo-icon">💸</div>
          <span className="navbar-logo-text">Cash<span>Flow</span></span>
        </div>

        <span className="nav-section-label">Menu</span>

        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-link ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={20} className="nav-icon" />
            {label}
          </button>
        ))}

        <div className="navbar-footer">
          <p>
            <span className="privacy-dot" />
            Your data is stored locally in this browser and never leaves your device.
          </p>
        </div>
      </nav>

      {/* ─── Bottom nav (mobile) ────────────────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`bottom-nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
