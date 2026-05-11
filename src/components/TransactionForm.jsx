/**
 * TransactionForm.jsx
 *
 * Modal form for adding and editing transactions.
 * Rendered via a React portal into document.body.
 *
 * Features:
 *   - Type tabs: expense / income / savings
 *   - Smart amount input with locale-aware formatting on blur and
 *     raw number display while focused (prevents formatting interfering with typing)
 *   - Currency symbol overlay that adapts to the active currency
 *   - Category dropdown filtered to match the selected type
 *   - Optional recurring toggle with weekly / monthly / yearly frequency
 *
 * Props:
 *   categories    - full category array (will be filtered by selected type)
 *   onSave(tx)    - called with the validated transaction object on submit
 *   onClose()     - called to dismiss the modal without saving
 *   initial       - optional existing transaction object for edit mode
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { X, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const TYPES = ['expense', 'income', 'savings'];

const TYPE_LABELS = {
  expense: '💸 Expense',
  income:  '💰 Income',
  savings: '🏦 Savings',
};

const RECUR_OPTIONS = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
];

const MAX_AMOUNT = 99999999.99;

/** Returns the next due date string given a starting date and frequency. */
// eslint-disable-next-line react-refresh/only-export-components -- intentional: utility co-located with form that owns the logic
export function nextDueDate(date, freq) {
  const d = dayjs(date);
  if (freq === 'weekly')  return d.add(1, 'week').format('YYYY-MM-DD');
  if (freq === 'monthly') return d.add(1, 'month').format('YYYY-MM-DD');
  if (freq === 'yearly')  return d.add(1, 'year').format('YYYY-MM-DD');
  return null;
}

/**
 * Formats a numeric value with thousand separators for display.
 * e.g. 1234567.8 → "1,234,567.8"
 */
function formatDisplay(val) {
  if (!val && val !== 0) return '';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Strips formatting characters from a user-typed amount string.
 * Enforces a single decimal point and max 2 decimal places.
 */
function parseAmount(str) {
  const cleaned = str.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  if (parts[1] && parts[1].length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return cleaned;
}

export default function TransactionForm({ categories, onSave, onClose, initial }) {
  const [type,                setType]                = useState(initial?.type                ?? 'expense');
  const [rawAmount,           setRawAmount]           = useState(initial?.amount ? String(initial.amount) : '');
  const [displayAmount,       setDisplayAmount]       = useState(initial?.amount ? formatDisplay(initial.amount) : '');
  const [categoryId,          setCategoryId]          = useState(initial?.categoryId          ?? '');
  const [date,                setDate]                = useState(initial?.date                ?? dayjs().format('YYYY-MM-DD'));
  const [notes,               setNotes]               = useState(initial?.notes               ?? '');
  const [isRecurring,         setIsRecurring]         = useState(initial?.isRecurring         ?? false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(initial?.recurrenceFrequency ?? 'monthly');
  const [error,               setError]               = useState('');

  const { currency } = useApp();

  // Only show categories that match the selected transaction type.
  const filtered = categories.filter(c => c.type === type);

  // Clear the category selection when the user switches type, since the old
  // category may not belong to the new type.
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === Number(categoryId));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset stale category on type switch
      if (cat && cat.type !== type) setCategoryId('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run when type changes
  }, [type]);

  // ── Amount input handlers ─────────────────────────────────────────────────

  function handleAmountChange(e) {
    const cleaned = parseAmount(e.target.value);
    const num = parseFloat(cleaned);
    if (cleaned === '' || cleaned === '.') {
      setRawAmount(cleaned);
      setDisplayAmount(cleaned);
      return;
    }
    // Reject values that exceed the maximum.
    if (!isNaN(num) && num <= MAX_AMOUNT) {
      setRawAmount(cleaned);
      setDisplayAmount(cleaned); // show raw while typing — no thousands separator mid-input
    }
  }

  function handleAmountFocus() {
    setDisplayAmount(rawAmount); // switch to raw number for easy editing
  }

  function handleAmountBlur() {
    if (rawAmount) {
      const num = parseFloat(rawAmount);
      if (!isNaN(num)) setDisplayAmount(formatDisplay(num)); // pretty-print on exit
    }
  }

  // ── Form submit ───────────────────────────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();
    const num = parseFloat(rawAmount);

    if (!rawAmount || isNaN(num) || num <= 0) {
      setError('Please enter a valid positive amount.'); return;
    }
    if (num > MAX_AMOUNT) {
      setError(`Maximum amount is ${formatDisplay(MAX_AMOUNT)}.`); return;
    }
    if (!categoryId) {
      setError('Please select a category.'); return;
    }

    onSave({
      ...initial,
      type,
      amount:              parseFloat(num.toFixed(2)),
      categoryId:          Number(categoryId),
      date,
      notes:               notes.trim(),
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
      nextDue:             isRecurring ? nextDueDate(date, recurrenceFrequency) : null,
    });
  }

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial?.id ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Type selector ─────────────────────────────────────────────── */}
          <div className="type-tabs">
            {TYPES.map(t => (
              <button key={t} type="button" className={`type-tab ${type === t ? `active-${t}` : ''}`} onClick={() => setType(t)}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* ── Amount ───────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div style={{ position: 'relative' }}>
              {/* Currency symbol overlay — positioned absolute so it doesn't shift the input */}
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none',
              }}>
                {currency.symbol}
              </span>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                style={{ paddingLeft: currency.symbol.length > 1 ? 40 : 30, fontSize: 16, fontWeight: 600 }}
                placeholder="0.00"
                value={displayAmount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                onFocus={handleAmountFocus}
                autoFocus
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max: {formatDisplay(MAX_AMOUNT)}</span>
          </div>

          {/* ── Category ──────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Select category…</option>
              {filtered.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>

          {/* ── Date ─────────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* ── Notes ────────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Notes <span style={{ fontWeight: 400, textTransform: 'none', opacity: .6 }}>(optional)</span></label>
            <textarea className="form-textarea" placeholder="Add a note…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* ── Recurring toggle ─────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="toggle-row" style={{ marginBottom: isRecurring ? 12 : 0 }}>
              <span className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} style={{ color: 'var(--amber)' }} /> Recurring transaction
              </span>
              <div className={`toggle ${isRecurring ? 'on' : ''}`} onClick={() => setIsRecurring(v => !v)} />
            </div>
            {isRecurring && (
              <select className="form-select" value={recurrenceFrequency} onChange={e => setRecurrenceFrequency(e.target.value)}>
                {RECUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>

          {error && <p style={{ color: 'var(--expense)', fontSize: 13 }}>⚠ {error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initial?.id ? 'Save Changes' : 'Add Transaction'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
