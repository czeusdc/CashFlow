/**
 * RecurringReminder.jsx
 *
 * Shows a dismissible banner at the top of the Dashboard when the user has
 * recurring transactions whose `nextDue` date is today or earlier.
 *
 * The banner lists each overdue entry with a "Log it" button. Clicking the
 * button calls `onLog(tx)`, which duplicates the transaction for today and
 * advances `nextDue` by one recurrence period.
 *
 * Returns null when there are no overdue entries (renders nothing).
 *
 * Props:
 *   transactions  - full transaction array from useTransactions
 *   categories    - category array, used to look up emoji + name
 *   onLog(tx)     - callback to log the recurring entry and advance nextDue
 */

import dayjs from 'dayjs';
import { useApp } from '../contexts/AppContext';

export default function RecurringReminder({ transactions, categories, onLog }) {
  const { fmt } = useApp();

  // Find all recurring transactions that are due today or overdue.
  const due = transactions.filter(t =>
    t.isRecurring && t.nextDue && dayjs(t.nextDue).isSameOrBefore(dayjs(), 'day')
  );

  // Nothing to show — don't render anything.
  if (!due.length) return null;

  return (
    <div className="recurring-banner">
      <span style={{ fontSize: '1.5rem' }}>🔔</span>
      <div className="recurring-banner-items">
        <div className="recurring-banner-title">Recurring entries due today</div>
        {due.map(tx => {
          const cat = categories.find(c => c.id === tx.categoryId);
          return (
            <div key={tx.id} className="recurring-banner-item">
              <span>{cat?.emoji} {cat?.name} · {fmt(tx.amount)}</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onLog(tx)}
              >
                + Log it
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
