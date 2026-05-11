export default function TopSpending({ top3, fmt }) {
  return (
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
  );
}
