/**
 * MonthlyChart.jsx
 *
 * Renders an income / expenses / savings chart using Chart.js.
 *
 *  Canvas & CSS variables:
 *   HTML <canvas> cannot read CSS custom properties (e.g. var(--income)).
 *   All colors used inside Chart.js options must be raw hex or rgba values.
 *   Detected the current mode via the `data-mode` attribute on <html> and
 *   selected appropriate hex palette at render time.
 *
 *   The `themeStyle` prop drives chart appearance:
 *    - "glass": smooth filled line chart with soft gradients
 *    - "material": modern rounded bar chart
 *    - "nordic": clean straight-line chart with distinct data points
 */

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler,
  Tooltip, Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { useApp } from '../contexts/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

export default function MonthlyChart({ transactions, range = '6M', themeStyle = 'glass' }) {
  const { fmt } = useApp();

  // Determine periods based on range
  let periods;
  let isYearly = false;

  if (range === 'Yearly' || range === 'All Time') {
    isYearly = true;
    const firstTx = transactions.length > 0
      ? transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date)
      : dayjs().format('YYYY-MM-DD');

    const startYear = dayjs(firstTx).year();
    const currentYear = dayjs().year();
    const totalYears = Math.max(1, currentYear - startYear + 1);

    if (range === 'Yearly') {
      // Just show last 5 years if "Yearly" is selected, or all if less
      const displayYears = Math.min(5, totalYears);
      periods = Array.from({ length: displayYears }, (_, i) => dayjs().subtract(displayYears - 1 - i, 'year'));
    } else {
      // All Time (Yearly buckets)
      periods = Array.from({ length: totalYears }, (_, i) => dayjs(`${startYear + i}-01-01`));
    }
  } else {
    // 6M or 12M
    const n = range === '12M' ? 12 : 6;
    periods = Array.from({ length: n }, (_, i) => dayjs().subtract(n - 1 - i, 'month'));
  }

  const labels = periods.map(p => isYearly ? p.format('YYYY') : p.format('MMM YY'));

  function sum(type, p) {
    return transactions
      .filter(t => {
        if (t.type !== type) return false;
        return isYearly ? dayjs(t.date).isSame(p, 'year') : dayjs(t.date).isSame(p, 'month');
      })
      .reduce((s, t) => s + t.amount, 0);
  }

  // Canvas cannot read var(--income) directly. We must provide raw hex codes.
  const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-mode') === 'light';

  const incomeColor = isLight ? '#16A34A' : '#22C55E';
  const expenseColor = isLight ? '#E11D48' : '#F43F5E';
  const savingsColor = isLight ? '#0284C7' : '#38BDF8';

  // Add transparency for backgrounds
  const incomeBg = isLight ? 'rgba(22,163,74,0.15)' : 'rgba(34,197,94,0.15)';
  const expenseBg = isLight ? 'rgba(225,29,72,0.15)' : 'rgba(244,63,94,0.15)';
  const savingsBg = isLight ? 'rgba(2,132,199,0.15)' : 'rgba(56,189,248,0.15)';

  const datasets = [
    { label: 'Income', data: periods.map(p => sum('income', p)), borderColor: incomeColor, backgroundColor: themeStyle === 'material' ? incomeColor : incomeBg },
    { label: 'Expenses', data: periods.map(p => sum('expense', p)), borderColor: expenseColor, backgroundColor: themeStyle === 'material' ? expenseColor : expenseBg },
    { label: 'Savings', data: periods.map(p => sum('savings', p)), borderColor: savingsColor, backgroundColor: themeStyle === 'material' ? savingsColor : savingsBg },
  ];

  // Configure dataset properties based on style
  datasets.forEach(ds => {
    ds.borderWidth = themeStyle === 'material' ? 0 : 2;
    ds.borderRadius = themeStyle === 'material' ? 4 : 0;

    if (themeStyle === 'glass') {
      ds.fill = true;
      ds.tension = 0.4; // Smooth curves
      ds.pointRadius = 0;
      ds.pointHoverRadius = 6;
    } else if (themeStyle === 'nordic') {
      ds.fill = false;
      ds.tension = 0; // Straight lines
      ds.pointRadius = 4;
      ds.pointBackgroundColor = ds.borderColor;
    }
  });

  const chartData = { labels, datasets };

  const textColor = isLight ? '#334155' : '#CBD5E1';
  const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const tooltipBg = isLight ? '#FFFFFF' : '#1A2438';
  const tooltipTitle = isLight ? '#0F172A' : '#F8FAFC';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: { 
          color: textColor, 
          font: { family: 'inherit', size: 12 }, 
          usePointStyle: true, 
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 15
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: gridColor,
        borderWidth: 1,
        titleColor: tooltipTitle,
        bodyColor: textColor,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { family: 'inherit', size: 11 } }
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { family: 'inherit', size: 11 }, callback: v => fmt(v) },
        beginAtZero: true
      },
    },
  };

  return (
    <div style={{ height: '100%', minHeight: 220 }}>
      {themeStyle === 'material' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
