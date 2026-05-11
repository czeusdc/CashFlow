/**
 * CategoryForm.jsx
 *
 * Modal form for creating and editing transaction categories.
 * Rendered via a React portal into document.body.
 *
 * Supports three category types with conditional fields:
 *   - expense  → optional monthly budget limit
 *   - income   → no extra fields
 *   - savings  → optional bank account toggle with APR and compounding settings
 *
 * Props:
 *   onSave(category)  - called with the validated category object on submit
 *   onClose()         - called to dismiss the modal without saving
 *   initial           - optional existing category object for edit mode
 *
 * Design note:
 *   Bank-specific fields (bankName, apr, isDailyInterest) are only written
 *   to the saved object when type === 'savings' && isBank === true.
 *   For all other types they are normalised to falsy/zero to keep data clean.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useApp } from '../contexts/AppContext';

/** Available colour swatches shown in the colour picker. */
const COLORS = [
  '#F43F5E','#F97316','#F59E0B','#EAB308','#22C55E','#10B981',
  '#14B8A6','#06B6D4','#0EA5E9','#3B82F6','#8B5CF6','#A855F7',
  '#EC4899','#64748B','#94A3B8',
];

const TYPES = ['expense', 'income', 'savings'];

export default function CategoryForm({ onSave, onClose, initial }) {
  const [name,            setName]            = useState(initial?.name            ?? '');
  const [emoji,           setEmoji]           = useState(initial?.emoji           ?? '📌');
  const [color,           setColor]           = useState(initial?.color           ?? '#14B8A6');
  const [type,            setType]            = useState(initial?.type            ?? 'expense');
  const [isBank,          setIsBank]          = useState(initial?.isBank          ?? false);
  const [bankName,        setBankName]        = useState(initial?.bankName        ?? '');
  const [apr,             setApr]             = useState(initial?.apr             ?? '');
  const [isDailyInterest, setIsDailyInterest] = useState(initial?.isDailyInterest ?? false);
  const [budgetLimit,     setBudgetLimit]     = useState(initial?.budgetLimit     ?? '');
  const [showPicker,      setShowPicker]      = useState(false);
  const [error,           setError]           = useState('');
  const { mode } = useApp();

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }

    onSave({
      ...initial,
      name: name.trim(), emoji, color, type,
      // Normalise bank fields — only meaningful for savings categories with isBank=true
      isBank:          type === 'savings' ? isBank : false,
      bankName:        (type === 'savings' && isBank) ? bankName.trim() : '',
      apr:             (type === 'savings' && isBank && apr !== '') ? Math.max(0, parseFloat(apr)) : 0,
      isDailyInterest: (type === 'savings' && isBank) ? isDailyInterest : false,
      // Budget limit only applies to expense categories; clamped to 0.
      budgetLimit: (type === 'expense' && budgetLimit !== '') ? Math.max(0, parseFloat(budgetLimit)) : null,
    });
  }

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial?.id ? 'Edit Category' : 'New Category'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Emoji picker ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button"
                style={{ width: 52, height: 52, borderRadius: 12, background: `${color}22`, border: `2px solid ${color}66`, fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowPicker(v => !v)}
              >{emoji}</button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to pick an emoji</span>
            </div>
            {showPicker && (
              <div style={{ position: 'relative', zIndex: 10, marginTop: 8 }}>
                <Picker data={data} onEmojiSelect={e => { setEmoji(e.native); setShowPicker(false); }} theme={mode} previewPosition="none" skinTonePosition="none" />
              </div>
            )}
          </div>

          {/* ── Name ─────────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="e.g. Coffee & Snacks" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          {/* ── Type tabs ────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="type-tabs">
              {TYPES.map(t => (
                <button key={t} type="button" className={`type-tab ${type === t ? `active-${t}` : ''}`} onClick={() => setType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Colour swatch picker ─────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2, transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }}
                />
              ))}
            </div>
          </div>

          {/* ── Budget limit (expense only) ───────────────────────────────── */}
          {type === 'expense' && (
            <div className="form-group">
              <label className="form-label">Monthly Budget Limit <span style={{ fontWeight: 400, textTransform: 'none', opacity: .6 }}>(optional)</span></label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="e.g. 500" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} />
            </div>
          )}

          {/* ── Bank account fields (savings only) ───────────────────────── */}
          {type === 'savings' && (
            <>
              <div className="toggle-row">
                <span className="toggle-label">🏦 This is a bank account / fund</span>
                <div className={`toggle ${isBank ? 'on' : ''}`} onClick={() => setIsBank(v => !v)} />
              </div>

              {isBank && (
                <>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-input" placeholder="e.g. Chase, BDO, DBS" value={bankName} onChange={e => setBankName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">APR / Interest Rate (%)</label>
                    <input className="form-input" type="number" min="0" step="0.01" placeholder="e.g. 5.5" value={apr} onChange={e => setApr(e.target.value)} />
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">Daily compounding interest</span>
                    <div className={`toggle ${isDailyInterest ? 'on' : ''}`} onClick={() => setIsDailyInterest(v => !v)} />
                  </div>
                </>
              )}
            </>
          )}

          {error && <p style={{ color: 'var(--expense)', fontSize: 13 }}>⚠ {error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initial?.id ? 'Save Changes' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
