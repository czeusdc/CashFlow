/**
 * Settings.jsx
 *
 * App-wide settings page covering six areas:
 *   1. Profile    — display name and avatar
 *   2. Appearance — colour theme, dark/light mode, UI style
 *   3. Currency & Layout — currency selector + card visibility toggles
 *   4. Export     — JSON / CSV / Excel backup downloads
 *   5. Cross-browser share — QR code and shareable link via QRExport modal
 *   6. Import     — restore from a JSON backup file
 *   7. Danger zone — clear all data
 *   8. About      — version info, keyboard shortcuts, credits, Ko-fi
 *
 * Props:
 *   onRefresh()       - reloads all data after import / clear (from App.jsx)
 *   theme / setTheme  - active colour theme id and setter
 *   mode / toggleMode - "dark" | "light" and toggle function
 *   style / setStyle  - UI style id and setter
 *   currency / setCurrency - active currency object and setter
 */

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { exportData, importData, clearAllData } from '../db/idb';
import { useToast } from '../components/Toast';
import { Download, Upload, Trash2, Sun, Moon, X, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AVATARS } from '../hooks/useProfile';
import { CURRENCIES } from '../hooks/useCurrency';
import { STORAGE_KEYS } from '../lib/constants';
import QRExport from '../components/QRExport';
import * as XLSX from 'xlsx';

const THEMES = [
  { id: 'teal', label: 'Teal', bg: '#14B8A6', emoji: '🌊' },
  { id: 'violet', label: 'Violet', bg: '#8B5CF6', emoji: '🔮' },
  { id: 'amber', label: 'Amber', bg: '#F59E0B', emoji: '🌅' },
  { id: 'mint', label: 'Mint', bg: '#10B981', emoji: '🌿' },
  { id: 'crimson', label: 'Crimson', bg: '#E11D48', emoji: '🔴' },
  { id: 'bluesky', label: 'Bluesky', bg: '#0EA5E9', emoji: '🌤️' },
];

const STYLES = [
  { id: 'glass', emoji: '✨', name: 'Glassmorphism', desc: 'Blurred glass, soft glow' },
  { id: 'material', emoji: '🎨', name: 'Material You', desc: 'Google MD3 elevated cards' },
  { id: 'nordic', emoji: '❄️', name: 'Nordic Clean', desc: 'Minimal frost & pastels' },
];

export default function Settings({ onRefresh, theme, setTheme, mode, toggleMode, style, setStyle, currency, setCurrency }) {
  const fileRef = useRef();
  const [hideNetWorth, setHideNetWorth] = useState(() => localStorage.getItem(STORAGE_KEYS.HIDE_NETWORTH) === 'true');
  const [hideInterest, setHideInterest] = useState(() => localStorage.getItem(STORAGE_KEYS.HIDE_INTEREST) === 'true');
  const toast = useToast();
  const { profile, setProfile, fmt } = useApp();
  const [showQR, setShowQR] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importDataState, setImportDataState] = useState(null);
  const [editName, setEditName] = useState(profile.name || '');
  const [editAvatar, setEditAvatar] = useState(profile.avatar || '👤');

  // ── Download helper ─────────────────────────────────────────────────────────
  // Tries the File System Access API (native Save As dialog) first,
  // then falls back to a data-URI anchor for unsupported browsers.
  async function downloadFile(blob, filename) {
    // Method 1: Native Save As dialog (Chrome 86+, Edge 86+)
    if (window.showSaveFilePicker) {
      try {
        const ext = filename.split('.').pop();
        const mimeMap = {
          json: { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
          csv: { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
          xlsx: { description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } },
        };
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: mimeMap[ext] ? [mimeMap[ext]] : [],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return false; // user cancelled
        console.warn('showSaveFilePicker failed, trying fallback:', e);
      }
    }

    // Method 2: Fallback — URL.createObjectURL (more reliable than FileReader)
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
      return true;
    } catch (e) {
      console.error('Download failed:', e);
      return false;
    }
  }

  // ── Export ──
  async function handleExportJSON() {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const ok = await downloadFile(blob, `cashflow-backup-${today()}.json`);
      if (ok) toast('JSON exported ✓', 'success');
    } catch (err) {
      console.error('Export JSON failed:', err);
      toast('Export failed — see console for details', 'error');
    }
  }

  async function handleExportCSV() {
    try {
      const { transactions, categories } = await exportData();
      const catMap = Object.fromEntries((categories || []).map(c => [c.id, c.name]));
      const rows = [
        ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Added By', 'Recurring'],
        ...transactions.map(t => [
          t.date,
          t.type,
          catMap[t.categoryId] || t.categoryId,
          t.amount,
          t.notes ?? '',
          t.addedBy ?? '',
          t.isRecurring ? 'Yes' : 'No',
        ]),
      ];
      const csv = rows.map(r =>
        r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel compat
      const ok = await downloadFile(blob, `cashflow-${today()}.csv`);
      if (ok) toast('CSV exported ✓', 'success');
    } catch (err) {
      console.error('Export CSV failed:', err);
      toast('Export failed — see console for details', 'error');
    }
  }

  async function handleExportExcel() {
    try {
      const { transactions, categories } = await exportData();
      const catMap = Object.fromEntries((categories || []).map(c => [c.id, c]));

      // Transactions sheet
      const txRows = transactions.map(t => {
        const cat = catMap[t.categoryId];
        return {
          Date: t.date,
          Type: t.type?.charAt(0).toUpperCase() + t.type?.slice(1),
          Category: cat?.name || 'Unknown',
          Amount: t.amount,
          Notes: t.notes || '',
          'Added By': t.addedBy || '',
          Recurring: t.isRecurring ? 'Yes' : 'No',
          'Created At': t.createdAt || '',
        };
      });

      // Categories sheet
      const catRows = categories.map(c => ({
        Name: c.name,
        Emoji: c.emoji,
        Type: c.type?.charAt(0).toUpperCase() + c.type?.slice(1),
        Color: c.color,
        'Budget Limit': c.budgetLimit || '',
        'Is Bank': c.isBank ? 'Yes' : 'No',
        'Bank Name': c.bankName || '',
        'APR (%)': c.apr || '',
        'Daily Interest': c.isDailyInterest ? 'Yes' : 'No',
      }));

      // Summary sheet
      const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        if (t.type === 'expense') acc.expenses += t.amount;
        if (t.type === 'savings') acc.savings += t.amount;
        return acc;
      }, { income: 0, expenses: 0, savings: 0 });

      const summaryRows = [
        { Metric: 'Total Income', Value: totals.income },
        { Metric: 'Total Expenses', Value: totals.expenses },
        { Metric: 'Total Savings', Value: totals.savings },
        { Metric: 'Money on Hand', Value: totals.income - totals.expenses - totals.savings },
        { Metric: 'Net Worth', Value: totals.income - totals.expenses },
        { Metric: 'Total Transactions', Value: transactions.length },
        { Metric: 'Total Categories', Value: categories.length },
        { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
      ];

      const wb = XLSX.utils.book_new();
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      const wsCat = XLSX.utils.json_to_sheet(catRows);
      const wsSum = XLSX.utils.json_to_sheet(summaryRows);

      // Set column widths
      wsTx['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 20 }];
      wsCat['!cols'] = [{ wch: 20 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 14 }];
      wsSum['!cols'] = [{ wch: 20 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');
      XLSX.utils.book_append_sheet(wb, wsCat, 'Categories');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const ok = await downloadFile(blob, `cashflow-${today()}.xlsx`);
      if (ok) toast('Excel exported ✓', 'success');
    } catch (err) {
      console.error('Export Excel failed:', err);
      toast('Export failed — see console for details', 'error');
    }
  }

  function validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) return false;

    // Basic structure check for transactions
    const hasInvalidTx = data.transactions.some(t =>
      typeof t.amount !== 'number' || !t.date || !t.type || !t.categoryId
    );
    if (hasInvalidTx) return false;

    // Basic structure check for categories
    const hasInvalidCat = data.categories.some(c =>
      !c.id || !c.name || !c.type
    );
    if (hasInvalidCat) return false;

    return true;
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!validateImportData(data)) throw new Error('invalid');
      setImportDataState(data);
    } catch { toast('Import failed — invalid or corrupted file format', 'error'); }
    e.target.value = '';
  }

  async function confirmImport() {
    if (!importDataState) return;
    try {
      await importData(importDataState);
      toast('Data imported successfully ✓', 'success');

      // Hard reload to ensure all contexts and states re-initialize from the restored localStorage
      // Single reload call is sufficient
      setTimeout(() => window.location.reload(), 1000);

    } catch (e) {
      console.error(e);
      toast('Import failed', 'error');
    }
    setImportDataState(null);
  }

  function handleSaveProfile() {
    if (!editName.trim()) return;
    setProfile({ name: editName.trim(), avatar: editAvatar });
    toast('Profile saved ✓', 'success');
  }

  return (
    <div className="page fade-up">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Preferences, themes, data management</p>
      </div>

      {/* Privacy */}
      <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 20, display: 'flex', gap: 14 }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Your data stays private</div>
          <p style={{ fontSize: 13 }}>CashFlow stores everything in your browser's IndexedDB. No data is sent to any server, no account required.</p>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <h3>👤 Your Profile</h3>
        <p>Your name is tagged on every transaction you add — useful for shared households.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="Your name" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map(av => (
                <button key={av} type="button" className={`avatar-btn ${editAvatar === av ? 'selected' : ''}`} onClick={() => setEditAvatar(av)}>{av}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleSaveProfile} disabled={!editName.trim()}>
            Save Profile
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="settings-section">
        <h3>🎨 Appearance</h3>

        {/* Design style picker */}
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Design Style</p>
        <div className="style-picker">
          {STYLES.map(s => (
            <div key={s.id} className={`style-option ${style === s.id ? 'active' : ''}`} onClick={() => setStyle(s.id)}>
              <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
              <div className="style-option-name">{s.name}</div>
              <div className="style-option-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Color theme picker */}
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Color Theme</p>
        <div className="theme-swatches">
          {THEMES.map(t => (
            <button key={t.id} className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
              style={{ background: `${t.bg}22`, border: `2px solid ${theme === t.id ? t.bg : 'transparent'}` }}
              onClick={() => setTheme(t.id)}
              title={t.label}
            >
              {t.emoji} <span style={{ fontSize: 12, fontWeight: 700, color: t.bg }}>{t.label}</span>
            </button>
          ))}
        </div>
        <button className="mode-toggle" onClick={toggleMode}>
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Currency & Layout */}
      <div className="settings-section">
        <h3>💱 Currency & Layout</h3>
        <p>All amounts will display in the selected currency format.</p>
        <select className="form-select" style={{ maxWidth: 280, marginBottom: 16 }} value={currency.code} onChange={e => setCurrency(e.target.value)}>
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Preview: {fmt(1234.56)}</p>

        <div className="toggle-row" style={{ maxWidth: 280, marginBottom: 12 }}>
          <span className="toggle-label" style={{ fontWeight: 500 }}>Hide Net Worth Card</span>
          <div
            className={`toggle ${hideNetWorth ? 'on' : ''}`}
            onClick={() => {
              const val = !hideNetWorth;
              setHideNetWorth(val);
              localStorage.setItem(STORAGE_KEYS.HIDE_NETWORTH, String(val));
            }}
          />
        </div>

        <div className="toggle-row" style={{ maxWidth: 280 }}>
          <span className="toggle-label" style={{ fontWeight: 500 }}>Hide Savings Interest</span>
          <div
            className={`toggle ${hideInterest ? 'on' : ''}`}
            onClick={() => {
              const val = !hideInterest;
              setHideInterest(val);
              localStorage.setItem(STORAGE_KEYS.HIDE_INTEREST, String(val));
            }}
          />
        </div>
      </div>

      {/* Export */}
      <div className="settings-section">
        <h3>📤 Export Data</h3>
        <p>Download a backup of all your transactions and categories.</p>
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleExportJSON}><Download size={15} /> JSON Backup</button>
          <button className="btn btn-ghost" onClick={handleExportCSV}><Download size={15} /> CSV</button>
          <button className="btn btn-ghost" onClick={handleExportExcel}><FileSpreadsheet size={15} /> Excel (.xlsx)</button>
        </div>
      </div>

      {/* Cross-browser share */}
      <div className="settings-section">
        <h3>📱 Share to Another Browser</h3>
        <p>Generate a QR code or share link to transfer your data to another device — no account needed.</p>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => setShowQR(true)}>📲 Generate QR / Share Link</button>
        </div>
      </div>

      {/* Import */}
      <div className="settings-section">
        <h3>📥 Import Data</h3>
        <p>Restore from a previously exported JSON backup. This will <strong>replace</strong> all current data.</p>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => fileRef.current.click()}><Upload size={15} /> Import JSON Backup</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings-section" style={{ border: '1px solid rgba(244,63,94,0.2)' }}>
        <h3 style={{ color: 'var(--expense)' }}>⚠ Danger Zone</h3>
        <p>Permanently delete all your CashFlow data. This cannot be undone.</p>
        <div className="settings-actions">
          <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}><Trash2 size={15} /> Clear All Data</button>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3>ℹ️ About CashFlow</h3>
        <p style={{ fontSize: 13 }}>Version 1 · Personal budget tracker. No bank sync. No subscriptions. Your money, your privacy.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginBottom: 16 }}>Press <kbd style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4, fontSize: 11, border: '1px solid var(--border)' }}>N</kbd> anywhere to quickly add a transaction.</p>

        <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 12, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Credits:</strong><br />
          <a href="https://github.com/czeusdc/CashFlow" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>CashFlow</a><br />
          <a href="https://react.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>React</a> · UI Library<br />
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Vite</a> · Build Tool<br />
          <a href="https://reactrouter.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>React Router</a> · Client-side Routing<br />
          <a href="https://github.com/jakearchibald/idb" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>idb</a> · Typed IndexedDB Storage<br />
          <a href="https://www.chartjs.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Chart.js</a> + <a href="https://react-chartjs-2.js.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>react-chartjs-2</a> · Data Visualisation<br />
          <a href="https://lucide.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Lucide React</a> · Icons<br />
          <a href="https://day.js.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Day.js</a> · Date Handling<br />
          <a href="https://sheetjs.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>SheetJS</a> · Excel Export<br />
          <a href="https://github.com/missive/emoji-mart" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Emoji Mart</a> · Emoji Picker<br />
          <a href="https://github.com/zpao/qrcode.react" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>QR Code React</a> · QR Generation
        </div>

        <div style={{ padding: 16, marginTop: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            If CashFlow has helped you take control of your finances, consider supporting its development! Your donation helps keep this project alive and ad-free.
          </p>
          <a href='https://ko-fi.com/K3K71ZAC47' target='_blank' rel="noreferrer">
            <img height='36' style={{ border: 0, height: 36 }} src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
          </a>
        </div>
      </div>

      {showQR && <QRExport onClose={() => setShowQR(false)} onImported={onRefresh} />}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <ClearConfirmModal
          onConfirm={async () => {
            await clearAllData();
            onRefresh();
            setShowClearConfirm(false);
            toast('All data cleared', 'info');
          }}
          onClose={() => setShowClearConfirm(false)}
        />
      )}

      {/* Import Confirmation Modal */}
      {importDataState && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setImportDataState(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent)' }}>Import Data?</h3>
            </div>
            <p style={{ marginBottom: 20 }}>
              Replace ALL current data with <strong>{importDataState.transactions.length} transactions</strong> and <strong>{importDataState.categories.length} categories</strong>?
              {importDataState.settings && " Settings will also be restored."}
              <br /><br />This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setImportDataState(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmImport}>
                <Upload size={14} /> Import Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ClearConfirmModal({ onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const isMatch = typed.trim().toUpperCase() === 'DELETE';

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ color: 'var(--expense)' }}>⚠ Delete All Data</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 14, marginBottom: 20 }}>
          This will <strong>permanently delete</strong> all your transactions, categories, and settings. This action cannot be undone.
        </p>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
          <input
            className="form-input confirm-input"
            placeholder="DELETE"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={!isMatch}>
            <Trash2 size={14} /> Delete Everything
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
