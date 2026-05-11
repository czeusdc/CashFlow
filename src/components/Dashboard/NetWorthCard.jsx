import { TrendingUp, TrendingDown } from 'lucide-react';

export default function NetWorthCard({ netNow, netTrend, fmt }) {
  return (
    <div className="networth-card" style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>
        Net Worth
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
        {fmt(netNow)}
      </div>
      <div className={`networth-trend ${netTrend >= 0 ? 'up' : 'down'}`}>
        {netTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {netTrend >= 0 ? '+' : ''}{fmt(netTrend)} change this month
      </div>
    </div>
  );
}
