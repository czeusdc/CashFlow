/**
 * TransactionItem.jsx
 *
 * Renders a single row in a transaction list.
 * Displays the category icon, name, date, optional note, amount, and
 * optional edit/delete action buttons.
 *
 * Props:
 *   tx         - transaction object
 *   category   - matching category object (may be undefined for deleted categories)
 *   onEdit(tx) - optional callback; if omitted the Edit button is hidden
 *   onDelete(id) - optional callback; if omitted the Delete button is hidden
 *
 * The sign prefix (+ / - / →) and amount colour are derived from tx.type.
 */

import dayjs from 'dayjs';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Prefix symbols for each transaction type.
const TYPE_SIGN  = { income: '+', expense: '-', savings: '→' };
// CSS class for the amount colour token.
const TYPE_CLASS = { income: 'amount-income', expense: 'amount-expense', savings: 'amount-savings' };

export default function TransactionItem({ tx, category, onEdit, onDelete }) {
  const { fmt } = useApp();

  const sign  = TYPE_SIGN[tx.type]  ?? '';
  const cls   = TYPE_CLASS[tx.type] ?? '';
  const color = category?.color ?? '#94A3B8'; // fallback grey for deleted categories
  const emoji = category?.emoji ?? '📌';

  return (
    <div className="tx-item">
      {/* Category icon badge */}
      <div className="tx-icon" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        {emoji}
      </div>

      {/* Main info block */}
      <div className="tx-info">
        <div className="tx-name">
          {category?.name ?? 'Unknown'}
          {/* Recurring indicator icon */}
          {tx.isRecurring && <RefreshCw size={11} style={{ marginLeft: 6, color: 'var(--amber)', verticalAlign: 'middle' }} />}
        </div>
        <div className="tx-meta">
          {dayjs(tx.date).format('MMM D, YYYY')}
          {tx.addedBy && <span style={{ marginLeft: 8, opacity: 0.6 }}>· {tx.addedBy}</span>}
        </div>
        {tx.notes && <div className="tx-note">📝 {tx.notes}</div>}
      </div>

      {/* Amount + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className={`tx-amount ${cls}`}>{sign}{fmt(tx.amount)}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onEdit && (
            <button className="btn-icon" onClick={() => onEdit(tx)} title="Edit">
              <Edit2 size={13} />
            </button>
          )}
          {onDelete && (
            <button className="btn-icon" style={{ color: 'var(--expense)' }} onClick={() => onDelete(tx.id)} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
