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
 * Key internal helpers:
 *   computeStreak(transactions) — counts the current under-average spend streak
 *   computeInterest(...)        — calculates compound interest projection
 *   filterByPeriod(...)         — slices transactions to the selected period
 *   computeTotals(txs)          — sums income/expenses/savings for any slice
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
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import MonthlyChart from '../components/MonthlyChart';
import TransactionItem from '../components/TransactionItem';
import TransactionForm, { nextDueDate } from '../components/TransactionForm';
import RecurringReminder from '../components/RecurringReminder';
import { useToast } from '../components/Toast';
import { useApp } from '../contexts/AppContext';
import { STORAGE_KEYS } from '../lib/constants';

const RANGES = ['6M', 'Yearly', 'All Time'];

const PERIODS = [
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'ytd',         label: 'Year to Date' },
  { id: 'allTime',     label: 'All Time' },
];

function computeStreak(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (!expenses.length) return 0;

  // 1. Build a map of YYYY-MM-DD -> total spend for that day.
  const byDay = {};
  let earliest = expenses[0].date;
  expenses.forEach(t => {
    byDay[t.date] = (byDay[t.date] || 0) + t.amount;
    if (t.date < earliest) earliest = t.date;
  });

  // 2. Compute the average daily spend (among days with spending).
  const spendDays = Object.values(byDay);
  const avgExpense = spendDays.reduce((sum, val) => sum + val, 0) / spendDays.length;

  // 3. Count backward from today.
  let streak = 0;
  let current = dayjs();
  const earliestDay = dayjs(earliest);

  while (current.isAfter(earliestDay) || current.isSame(earliestDay, 'day')) {
    const key = current.format('YYYY-MM-DD');
    const spent = byDay[key] || 0;

    // A "streak day" is either:
    if (spent > 0 && spent <= avgExpense) {
      streak++;
    } else if (spent === 0) {
      // dayjs is mutable by default — wrap in dayjs() to create a fresh clone
      // before calling subtract, so the outer 'current' is never shifted.
      let foundNear = false;
      for (let i = 1; i <= 7; i++) {
        if (byDay[dayjs(current).subtract(i, 'day').format('YYYY-MM-DD')]) {
          foundNear = true;
          break;
        }
      }
      if (foundNear) streak++;
      else break;
    } else {
      break; // Exceeded average — streak ends.
    }

    current = current.subtract(1, 'day');
    if (streak > 365) break; // sanity limit
  }

  return streak;
}

/**
 * computeInterest(principal, apr, isDailyInterest, firstDate)
 *
 * Estimates compound interest earned since the account's first transaction.
 *
 * NOTE: This is a simplified projection that assumes the current principal
 * was the starting balance. It does not account for intermediate deposits
 * or withdrawals (which would require a complex daily-balance ledger).
 * It serves as a "best-case" estimate for the user.
 */
function computeInterest(principal, apr, isDailyInterest, firstDate) {
  if (!apr || !principal || !firstDate) return 0;
  const r = apr / 100;
  const days = dayjs().diff(dayjs(firstDate), 'day');
  if (days <= 0) return 0;
  if (isDailyInterest) return principal * (Math.pow(1 + r / 365, days) - 1);
  const months = dayjs().diff(dayjs(firstDate), 'month');
  return principal * (Math.pow(1 + r / 12, months) - 1);
}

function filterByPeriod(transactions, period) {
  if (period === 'allTime') return transactions;
  if (period === 'thisQuarter') {
    const currentMonth = dayjs().month();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const quarterStart = dayjs().month(quarterStartMonth).startOf('month');
    return transactions.filter(t => dayjs(t.date).isAfter(quarterStart.subtract(1, 'day')));
  }
  // YTD
  const yearStart = dayjs().startOf('year');
  return transactions.filter(t => dayjs(t.date).isAfter(yearStart.subtract(1, 'day')));
}

function computeTotals(txs) {
  const result = txs.reduce(
    (acc, tx) => {
      if (tx.type === 'income')   acc.income   += tx.amount;
      else if (tx.type === 'expense') acc.expenses += tx.amount;
      else if (tx.type === 'savings') acc.savings  += tx.amount;
      return acc;
    },
    { income: 0, expenses: 0, savings: 0 }
  );
  result.onHand = result.income - result.expenses - result.savings;
  return result;
}

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
        <div className="networth-card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>Net Worth</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{fmt(netNow)}</div>
          <div className={`networth-trend ${netTrend >= 0 ? 'up' : 'down'}`}>
            {netTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {netTrend >= 0 ? '+' : ''}{fmt(netTrend)} change this month
          </div>
        </div>
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
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                🏆 Top Spending
              </div>
              {top3.length === 0 ? (
                <p style={{ fontSize: 13 }}>No expenses this month</p>
              ) : (
                <div className="top-spending-list">
                  {top3.map(({ cat, amount, pct }, i) => (
                    <div key={i} className="top-spending-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`top-spending-rank rank-${i + 1}`}>{i + 1}</div>
                        <span style={{ fontSize: '1rem' }}>{cat?.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{cat?.name ?? 'Unknown'}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--expense)' }}>{fmt(amount)}</span>
                        <span className="top-spending-pct">{pct}%</span>
                      </div>
                      <div className="top-spending-bar">
                        <div className="top-spending-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
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
