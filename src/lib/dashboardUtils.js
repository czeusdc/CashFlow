import dayjs from 'dayjs';

/**
 * getGreeting()
 * Returns morning, afternoon, or evening based on local time.
 */
export function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

/**
 * computeStreak(transactions)
 * Counts the current under-average spend streak backward from today.
 */
export function computeStreak(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (!expenses.length) return 0;

  const byDay = {};
  let earliest = expenses[0].date;
  expenses.forEach(t => {
    byDay[t.date] = (byDay[t.date] || 0) + t.amount;
    if (t.date < earliest) earliest = t.date;
  });

  const spendDays = Object.values(byDay);
  const avgExpense = spendDays.reduce((sum, val) => sum + val, 0) / spendDays.length;

  let streak = 0;
  let current = dayjs();
  const earliestDay = dayjs(earliest);

  while (current.isAfter(earliestDay) || current.isSame(earliestDay, 'day')) {
    const key = current.format('YYYY-MM-DD');
    const spent = byDay[key] || 0;

    if (spent > 0 && spent <= avgExpense) {
      streak++;
    } else if (spent === 0) {
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
      break;
    }

    current = current.subtract(1, 'day');
    if (streak > 365) break;
  }

  return streak;
}

/**
 * computeInterest(principal, apr, isDailyInterest, firstDate)
 * Estimates compound interest earned since the account's first transaction.
 */
export function computeInterest(principal, apr, isDailyInterest, firstDate) {
  if (!apr || !principal || !firstDate) return 0;
  const r = apr / 100;
  const days = dayjs().diff(dayjs(firstDate), 'day');
  if (days <= 0) return 0;
  if (isDailyInterest) return principal * (Math.pow(1 + r / 365, days) - 1);
  const months = dayjs().diff(dayjs(firstDate), 'month');
  return principal * (Math.pow(1 + r / 12, months) - 1);
}

/**
 * filterByPeriod(transactions, period)
 * Slices transactions based on a label like 'thisQuarter', 'ytd', or 'allTime'.
 */
export function filterByPeriod(transactions, period) {
  if (period === 'allTime') return transactions;
  if (period === 'thisQuarter') {
    const currentMonth = dayjs().month();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const quarterStart = dayjs().month(quarterStartMonth).startOf('month');
    return transactions.filter(t => dayjs(t.date).isAfter(quarterStart.subtract(1, 'day')));
  }
  const yearStart = dayjs().startOf('year');
  return transactions.filter(t => dayjs(t.date).isAfter(yearStart.subtract(1, 'day')));
}

/**
 * computeTotals(txs)
 * Sums income, expenses, and savings for a given transaction array.
 */
export function computeTotals(txs) {
  const result = txs.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else if (tx.type === 'expense') acc.expenses += tx.amount;
      else if (tx.type === 'savings') acc.savings += tx.amount;
      return acc;
    },
    { income: 0, expenses: 0, savings: 0 }
  );
  result.onHand = result.income - result.expenses - result.savings;
  return result;
}
