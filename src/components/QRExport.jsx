/**
 * QRExport.jsx
 *
 * Modal for sharing CashFlow data to another device without a server.
 *
 * How it works:
 *   Export side:
 *     1. Calls exportData() to gather all transactions, categories, and settings.
 *     2. JSON-stringifies and base64-encodes the payload (compress()).
 *     3. Builds a URL with the encoded payload in the hash: #import=<encoded>
 *     4. Displays a QR code and a "Copy Link" button.
 *     - If the payload exceeds ~2,500 chars the QR generator is hidden
 *       (most QR scanners cannot decode very long URLs) and only the copy
 *       button is shown.
 *
 *   Import side:
 *     1. User pastes the share link or the raw encoded string.
 *     2. A regex strips the #import= prefix if the full URL was pasted.
 *     3. After user confirmation, importData() replaces all current data.
 *     4. The page hard-reloads so the new settings (theme, currency, etc.) take effect.
 *
 * Props:
 *   onClose()      - called to dismiss the modal
 *   onImported()   - optional callback after a successful import (used to refresh data)
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { exportData, importData } from '../db/idb';
import { X, Share2 } from 'lucide-react';
import { useToast } from './Toast';
import { useApp } from '../contexts/AppContext';
import { useEffect } from 'react';

/** Basic schema validation for imported data snapshots. */
function validateData(data) {
  if (!data || typeof data !== 'object') return false;
  // Transactions are mandatory; categories and settings are optional but must be arrays/objects.
  if (!Array.isArray(data.transactions)) return false;
  if (data.categories && !Array.isArray(data.categories)) return false;
  if (data.settings && typeof data.settings !== 'object') return false;
  return true;
}

/** Encodes a JS object to a URL-safe base64 string. */
function compress(obj) {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

/** Decodes a base64 string back to a JS object. */
function decompress(str) {
  return JSON.parse(decodeURIComponent(atob(str)));
}

export default function QRExport({ onClose, onImported }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importStr, setImportStr] = useState('');
  const toast = useToast();
  const { mode } = useApp();
  // Real hex colors — CSS custom properties don't work inside SVG fill attributes.
  const qrFgColor = mode === 'dark' ? '#F8FAFC' : '#0F172A';

  async function handleGenerate() {
    setLoading(true);
    try {
      const data = await exportData();
      const encoded = compress(data);
      // URL-based share link (can be scanned or pasted)
      const url = `${window.location.origin}${window.location.pathname}#import=${encoded}`;
      setQrData({ url, encoded });
    } catch {
      toast('Failed to generate share link', 'error');
    }
    setLoading(false);
  }

  async function handleImport() {
    try {
      let str = importStr.trim();
      // If user pasted the full URL, extract just the encoded part
      const match = str.match(/#import=(.+)/);
      if (match) {
        str = match[1];
      }
      
      const data = decompress(str);
      if (!validateData(data)) throw new Error('invalid_schema');
      
      const msg = `Import ${data.transactions.length} transactions? This replaces ALL current data and settings.`;
      if (!window.confirm(msg)) return;
      await importData(data);
      onImported?.();
      toast('Data imported from share link ✓', 'success');
      onClose();
      setTimeout(() => window.location.reload(), 1000); // Reload to apply settings
    } catch {
      toast('Invalid share code or URL — check and try again', 'error');
    }
  }

  // Auto-handle import from URL hash on mount.
  useEffect(() => {
    if (qrData || importMode) return;
    
    const hash = window.location.hash;
    const match = hash.match(/#import=(.+)/);
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: parse URL hash once on mount
      setImportStr(match[1]);
      setImportMode(true);
      // Clean up the URL hash so it doesn't re-trigger on accidental re-renders.
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [qrData, importMode]);

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2><Share2 size={18} style={{ marginRight: 8 }} />Share to Another Browser</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className={`filter-chip ${!importMode ? 'active' : ''}`} onClick={() => setImportMode(false)}>📤 Export</button>
          <button className={`filter-chip ${importMode ? 'active' : ''}`} onClick={() => setImportMode(true)}>📥 Import</button>
        </div>

        {!importMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13 }}>
              Generate a QR code or share link. Open it on another browser or device to transfer your data instantly — no account required.
            </p>

            {!qrData ? (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading ? '⏳ Generating…' : '🔗 Generate Share Link'}
              </button>
            ) : (
              <div className="qr-wrapper">
                {qrData.url.length <= 2500 ? (
                  <QRCodeSVG value={qrData.url} size={200} bgColor="transparent" fgColor={qrFgColor} />
                ) : (
                  <div style={{ padding: 16, background: 'var(--expense-soft)', color: 'var(--expense)', borderRadius: 12, textAlign: 'center', fontSize: 13, border: '1px solid var(--expense)', marginBottom: 8 }}>
                    <strong>Data too large for QR Code.</strong><br />
                    Please copy the link below instead.
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
                  {qrData.url.length <= 2500 ? 'Scan this QR code on another device, or copy the link below.' : 'Share this link to transfer your data to another browser.'}
                </p>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <input
                    className="form-input"
                    readOnly
                    value={qrData.url}
                    style={{ fontSize: 11 }}
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { navigator.clipboard.writeText(qrData.url); toast('Link copied!', 'success'); }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13 }}>
              Paste the share code from another CashFlow instance to import that data here.
            </p>
            <div className="form-group">
              <label className="form-label">Paste Share Code</label>
              <textarea
                className="form-textarea"
                placeholder="Paste the share code or URL here…"
                value={importStr}
                onChange={e => setImportStr(e.target.value)}
                rows={4}
              />
            </div>
            <button className="btn btn-primary" onClick={handleImport} disabled={!importStr.trim()}>
              📥 Import Data
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
