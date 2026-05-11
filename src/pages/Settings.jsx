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
import { Upload, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AVATARS } from '../hooks/useProfile';
import { CURRENCIES } from '../hooks/useCurrency';
import { STORAGE_KEYS } from '../lib/constants';
import QRExport from '../components/QRExport';
import * as XLSX from 'xlsx';
import { downloadFile, today, formatCSV, mapExcelData } from '../lib/exportUtils';
import ProfileSection from '../components/Settings/ProfileSection';
import AppearanceSection from '../components/Settings/AppearanceSection';
import DataExportSection from '../components/Settings/DataExportSection';
import DataImportSection from '../components/Settings/DataImportSection';
import AboutSection from '../components/Settings/AboutSection';

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


  // ── Export helpers ──
  async function handleExportJSON() {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const ok = await downloadFile(blob, `cashflow-backup-${today()}.json`);
      if (ok) toast('JSON exported ✓', 'success');
    } catch (err) {
      console.error('Export JSON failed:', err);
      toast('Export failed', 'error');
    }
  }

  async function handleExportCSV() {
    try {
      const { transactions, categories } = await exportData();
      const csv = formatCSV(transactions, categories);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const ok = await downloadFile(blob, `cashflow-${today()}.csv`);
      if (ok) toast('CSV exported ✓', 'success');
    } catch (err) {
      console.error('Export CSV failed:', err);
      toast('Export failed', 'error');
    }
  }

  async function handleExportExcel() {
    try {
      const { transactions, categories } = await exportData();
      const { txRows, catRows, summaryRows } = mapExcelData(transactions, categories);

      const wb = XLSX.utils.book_new();
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      const wsCat = XLSX.utils.json_to_sheet(catRows);
      const wsSum = XLSX.utils.json_to_sheet(summaryRows);

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
      toast('Export failed', 'error');
    }
  }

  function validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) return false;
    const hasInvalidTx = data.transactions.some(t => typeof t.amount !== 'number' || !t.date || !t.type || !t.categoryId);
    if (hasInvalidTx) return false;
    const hasInvalidCat = data.categories.some(c => !c.id || !c.name || !c.type);
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
      <ProfileSection
        editName={editName} setEditName={setEditName}
        editAvatar={editAvatar} setEditAvatar={setEditAvatar}
        avatars={AVATARS}
        onSave={handleSaveProfile}
      />

      {/* Appearance */}
      <AppearanceSection
        style={style} setStyle={setStyle} styles={STYLES}
        theme={theme} setTheme={setTheme} themes={THEMES}
        mode={mode} toggleMode={toggleMode}
      />

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

      {/* Export & Share */}
      <DataExportSection
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onShowQR={() => setShowQR(true)}
      />

      {/* Import & Danger Zone */}
      <DataImportSection
        onImportClick={() => fileRef.current.click()}
        onClearClick={() => setShowClearConfirm(true)}
      />
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* About */}
      <AboutSection />

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

