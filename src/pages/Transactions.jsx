/**
 * Transactions.jsx
 *
 * Full-page transaction ledger with search, filtering, and CRUD support.
 *
 * Features:
 *   - Filter by type: All / Income / Expense / Savings
 *   - Filter by month via a dropdown built from actual transaction dates
 *   - Free-text search across category name and transaction notes
 *   - Edit transactions inline via TransactionForm modal
 *   - Delete with a browser confirmation dialog
 *   - Grouped display by month (most recent month first)
 *
 * Props:
 *   transactions  - full transaction array from useTransactions
 *   categories    - category array for name/emoji lookup
 *   onAdd(tx)     - creates a new transaction
 *   onUpdate(tx)  - updates an existing transaction by id
 *   onDelete(id)  - deletes a transaction by id
 */

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Plus, Search } from 'lucide-react';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import { useToast } from '../components/Toast';
import { useApp } from '../contexts/AppContext';

const TYPE_FILTERS = ['all', 'income', 'expense', 'savings'];

function formatMonth(m) { return dayjs(m, 'YYYY-MM').format('MMMM YYYY'); }

export default function Transactions({ transactions, categories, onAdd, onUpdate, onDelete }) {
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [monthFilter, setMonthFilter] = useState(dayjs().format('YYYY-MM'));
  const [search,      setSearch]      = useState('');
  const toast = useToast();
  const { fmt } = useApp();

  // Build available months from data
  const months = useMemo(() => {
    const set = new Set(transactions.map(t => dayjs(t.date).format('YYYY-MM')));
    const now = dayjs().format('YYYY-MM');
    set.add(now);
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Build a filtered + searched view of transactions reactively.
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (monthFilter && !dayjs(tx.date).isSame(dayjs(monthFilter, 'YYYY-MM'), 'month')) return false;
      if (q) {
        const inNotes = tx.notes?.toLowerCase().includes(q);
        const inCat   = (cat?.name ?? '').toLowerCase().includes(q);
        if (!inNotes && !inCat) return false;
      }
      return true;
    });
  }, [transactions, categories, typeFilter, monthFilter, search]);

  async function handleSave(tx) {
    if (tx.id) {
      await onUpdate(tx);
      toast('Transaction updated ✓', 'success');
    } else {
      await onAdd(tx);
      toast('Transaction added ✓', 'success');
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this transaction?')) return;
    await onDelete(id);
    toast('Transaction deleted', 'info');
  }

  function handleEdit(tx) {
    setEditing(tx);
    setShowForm(true);
  }

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(tx => {
      const d = tx.date;
      if (!map[d]) map[d] = [];
      map[d].push(tx);
    });
    return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filtered]);

  const monthTotal = filtered.reduce((acc, tx) => {
    if (tx.type === 'income')   acc.income   += tx.amount;
    if (tx.type === 'expense')  acc.expenses += tx.amount;
    if (tx.type === 'savings')  acc.savings  += tx.amount;
    return acc;
  }, { income: 0, expenses: 0, savings: 0 });

  return (
    <div className="page fade-up">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Transactions</h1>
          <p>Track and manage all your entries</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Monthly mini summary */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Income',   val: monthTotal.income,   cls: 'amount-income'  },
          { label: 'Expenses', val: monthTotal.expenses, cls: 'amount-expense' },
          { label: 'Savings',  val: monthTotal.savings,  cls: 'amount-savings' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
            <div className={cls} style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>
              {fmt(val)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {/* Month select */}
        <select
          className="form-select"
          style={{ width: 'auto', borderRadius: 'var(--radius-full)', padding: '6px 36px 6px 14px' }}
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
        >
          {months.map(m => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>

        {/* Type filters */}
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip ${typeFilter === f ? 'active' : ''}`}
            onClick={() => setTypeFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 14, color: 'var(--text-muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search category or notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🔍</div>
          <p>No transactions found. Try adjusting filters.</p>
        </div>
      ) : (
        grouped.map(([date, txs]) => (
          <div key={date} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, paddingLeft: 4 }}>
              {dayjs(date).format('ddd, MMM D')}
            </div>
            <div className="card">
              {txs.map((tx, i) => (
                <div key={tx.id}>
                  <TransactionItem
                    tx={tx}
                    category={categories.find(c => c.id === tx.categoryId)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  {i < txs.length - 1 && <div className="divider" />}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { setEditing(null); setShowForm(true); }}>＋</button>

      {showForm && (
        <TransactionForm
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          initial={editing}
        />
      )}
    </div>
  );
}
