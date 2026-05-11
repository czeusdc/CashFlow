/**
 * Dashboard.jsx
 *
 * Main overview page — the home screen of CashFlow.
 *
 * Sections (top to bottom):
 *   1. Header         — greeting, date, spending streak badge, Add Entry button
 *   2. Recurring reminder banner (if any entries are due today)
 *   3. Period selector — This Quarter / Year to Date / All Time
 *   4. Summary cards  — Money on Hand, Income, Expenses, Saved
 *   5. Net Worth card (hidden if cf-hide-networth is set)
 *   6. Chart + This Month insights (two-column grid)
 *   7. Estimated Savings Interest (hidden if cf-hide-interest is set)
 *   8. Recent Transactions list
 *
 * Props:
 *   transactions  - full transaction array
 *   categories    - category array (for top-3 spending and interest projections)
 *   totals        - all-time totals from useTransactions (for Net Worth)
 *   onAdd         - adds a transaction to IDB
 *   onUpdate      - updates a transaction in IDB
 *   onDelete      - deletes a transaction from IDB
 *   themeStyle    - "glass" | "material" | "nordic" (passed to MonthlyChart)
 *   themeColor    - active colour theme id (passed to MonthlyChart)
 */

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import MonthlyChart from '../components/MonthlyChart';
import TransactionItem from '../components/TransactionItem';
import TransactionForm, { nextDueDate } from '../components/TransactionForm';
import RecurringReminder from '../components/RecurringReminder';
import { useToast } from '../components/Toast';
import { useApp } from '../contexts/AppContext';
import { STORAGE_KEYS } from '../lib/constants';
import { computeStreak, computeInterest, filterByPeriod, computeTotals, getGreeting } from '../lib/dashboardUtils';
import NetWorthCard from '../components/Dashboard/NetWorthCard';
import TopSpending from '../components/Dashboard/TopSpending';

const RANGES = ['6M', 'Yearly', 'All Time'];

const PERIODS = [
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'ytd',         label: 'Year to Date' },
  { id: 'allTime',     label: 'All Time' },
];


export default function Dashboard({ transactions, categories, totals, onAdd, onUpdate, themeStyle, themeColor }) {
  const [showForm, setShowForm] = useState(false);
  const [range, setRange] = useState(() => localStorage.getItem(STORAGE_KEYS.CHART_RANGE) || '6M');
  const [summaryPeriod, setSummaryPeriod] = useState(() => localStorage.getItem(STORAGE_KEYS.SUMMARY_PERIOD) || 'thisQuarter');
  const hideNetWorth = localStorage.getItem(STORAGE_KEYS.HIDE_NETWORTH) === 'true';
  const hideInterest = localStorage.getItem(STORAGE_KEYS.HIDE_INTEREST) === 'true';
  const { fmt, profile } = useApp();
  const toast = useToast();

  function handleRangeChange(r) {
    setRange(r);
    localStorage.setItem(STORAGE_KEYS.CHART_RANGE, r);
  }
  function handlePeriodChange(p) {
    setSummaryPeriod(p);
    localStorage.setItem(STORAGE_KEYS.SUMMARY_PERIOD, p);
  }

  const thisMonth = transactions.filter(t => dayjs(t.date).isSame(dayjs(), 'month'));
  const recent    = transactions.slice(0, 8);

  // Summary totals for selected period
  const periodTotals = useMemo(
    () => computeTotals(filterByPeriod(transactions, summaryPeriod)),
    [transactions, summaryPeriod]
  );
  const periodLabel = PERIODS.find(p => p.id === summaryPeriod)?.label ?? 'Year to Date';

  // Net worth trend
  const netNow  = totals.income - totals.expenses;
  // Net worth at the end of last month (all transactions except those in this month)
  const netBeforeThisMonth = transactions
    .filter(t => dayjs(t.date).isBefore(dayjs().startOf('month')))
    .reduce((acc, t) => {
      if (t.type === 'income') acc += t.amount;
      if (t.type === 'expense') acc -= t.amount;
      return acc;
    }, 0);
  const netTrend = netNow - netBeforeThisMonth;

  // Top 3 spending this month
  const top3 = useMemo(() => {
    const byCategory = {};
    thisMonth.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
    });
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, amount]) => ({
        cat: categories.find(c => c.id === Number(catId)),
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      }));
  }, [thisMonth, categories]);

  // Savings interest projections
  const savingsProjections = useMemo(() => {
    return categories
      .filter(c => c.type === 'savings' && c.isBank && c.apr > 0)
      .map(cat => {
        const catTxs = transactions.filter(t => t.type === 'savings' && t.categoryId === cat.id);
        const principal = catTxs.reduce((s, t) => s + t.amount, 0);
        const firstDate = catTxs.length ? catTxs[catTxs.length - 1].date : null;
        const interest = computeInterest(principal, cat.apr, cat.isDailyInterest, firstDate);
        return { cat, principal, interest };
      })
      .filter(p => p.principal > 0);
  }, [categories, transactions]);

  const streak = useMemo(() => computeStreak(transactions), [transactions]);

  async function handleSave(tx) {
    await onAdd(tx);
    toast('Transaction added ✓', 'success');
    setShowForm(false);
  }

  async function handleLogRecurring(tx) {
    const now = dayjs().format('YYYY-MM-DD');
    await onAdd({ ...tx, id: undefined, date: now, createdAt: undefined });
    const nextDue = nextDueDate(tx.nextDue, tx.recurrenceFrequency || 'monthly');
    await onUpdate({ ...tx, nextDue });
    toast('Recurring entry logged ✓', 'success');
  }

  const greeting = getGreeting();
  const name = profile?.name ? `, ${profile.name}` : '';

  return (
    <div className="page fade-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Good {greeting}{name} 👋</h1>
          <p>{dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak > 1 && <div className="streak-badge">🔥 {streak}-day streak</div>}
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Recurring reminder */}
      <RecurringReminder transactions={transactions} categories={categories} onLog={handleLogRecurring} />

      {/* Summary Period Toggle */}
      <div className="period-tabs">
        {PERIODS.map(p => (
          <button key={p.id} className={`period-tab ${summaryPeriod === p.id ? 'active' : ''}`} onClick={() => handlePeriodChange(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <SummaryCard label="Money on Hand" amount={periodTotals.onHand}   type="onhand"  sub={periodLabel} icon="💳" />
        <SummaryCard label="Income"        amount={periodTotals.income}   type="income"  sub={periodLabel} icon="📈" />
        <SummaryCard label="Expenses"      amount={periodTotals.expenses} type="expense" sub={periodLabel} icon="📉" />
        <SummaryCard label="Saved"         amount={periodTotals.savings}  type="savings" sub={periodLabel} icon="🏦" />
      </div>

      {/* Net Worth */}
      {!hideNetWorth && (
        <NetWorthCard netNow={netNow} netTrend={netTrend} fmt={fmt} />
      )}

      {/* Chart + Insights — stretch both columns to match heights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Chart */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <span className="section-title">Overview</span>
            <div className="range-tabs">
              {RANGES.map(r => (
                <button key={r} className={`range-tab ${range === r ? 'active' : ''}`} onClick={() => handleRangeChange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="card chart-wrapper" style={{ flex: 1, padding: '16px 16px 12px', minHeight: 220 }}>
            <MonthlyChart transactions={transactions} range={range} themeStyle={themeStyle} themeColor={themeColor} />
          </div>
        </div>

        {/* Insights */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <span className="section-title">This Month</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{thisMonth.length} entries</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {/* Top 3 spending */}
            <TopSpending top3={top3} fmt={fmt} />

            <InsightRow icon="💰" label="Income"   value={fmt(thisMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0))}  color="var(--income)" />
            <InsightRow icon="💸" label="Expenses"  value={fmt(thisMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0))} color="var(--expense)" />
            <InsightRow icon="🏦" label="Saved"     value={fmt(thisMonth.filter(t=>t.type==='savings').reduce((s,t)=>s+t.amount,0))} color="var(--savings)" />
          </div>
        </div>
      </div>

      {/* Savings Interest Projections */}
      {!hideInterest && savingsProjections.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-header"><span className="section-title">💹 Estimated Savings Interest</span></div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Projected interest based on APR and compounding. Estimates only — not actual bank data.
            </p>
            {savingsProjections.map(({ cat, principal, interest }) => (
              <div key={cat.id} className="interest-row">
                <span>{cat.emoji} {cat.name} {cat.bankName ? `· ${cat.bankName}` : ''} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({cat.apr}% APR)</span></span>
                <div style={{ textAlign: 'right' }}>
                  <div className="interest-amount">+{fmt(interest)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>on {fmt(principal)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="section-header">
        <span className="section-title">Recent Transactions</span>
      </div>
      <div className="card">
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p>No transactions yet. Add your first entry!</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Add Entry</button>
          </div>
        ) : (
          recent.map((tx, i) => (
            <div key={tx.id}>
              <TransactionItem tx={tx} category={categories.find(c => c.id === tx.categoryId)} />
              {i < recent.length - 1 && <div className="divider" />}
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => setShowForm(true)}>＋</button>

      {showForm && (
        <TransactionForm categories={categories} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}


function InsightRow({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: '1.125rem' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
