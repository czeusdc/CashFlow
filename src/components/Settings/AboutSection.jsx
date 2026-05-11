export default function AboutSection() {
  return (
    <div className="settings-section">
      <h3>ℹ️ About CashFlow</h3>
      <p style={{ fontSize: 13 }}>Version 1 · Personal budget tracker. No bank sync. No subscriptions. Your money, your privacy.</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginBottom: 16 }}>
        Press <kbd style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4, fontSize: 11, border: '1px solid var(--border)' }}>N</kbd> anywhere to quickly add a transaction.
      </p>

      <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Credits:</strong><br />
        <a href="https://github.com/czeusdc/CashFlow" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>CashFlow</a><br />
        <a href="https://react.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>React</a> · UI Library<br />
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Vite</a> · Build Tool<br />
        <a href="https://reactrouter.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>React Router</a> · Client-side Routing<br />
        <a href="https://github.com/jakearchibald/idb" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>idb</a> · Typed IndexedDB Storage<br />
        <a href="https://www.chartjs.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Chart.js</a> + <a href="https://react-chartjs-2.js.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>react-chartjs-2</a> · Data Visualisation<br />
        <a href="https://lucide.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Lucide React</a> · Icons<br />
        <a href="https://day.js.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Day.js</a> · Date Handling<br />
        <a href="https://sheetjs.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>SheetJS</a> · Excel Export<br />
        <a href="https://github.com/missive/emoji-mart" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Emoji Mart</a> · Emoji Picker<br />
        <a href="https://github.com/zpao/qrcode.react" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>QR Code React</a> · QR Generation
      </div>

      <div style={{ padding: 16, marginTop: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          If CashFlow has helped you take control of your finances, consider supporting its development! Your donation helps keep this project alive and ad-free.
        </p>
        <a href='https://ko-fi.com/K3K71ZAC47' target='_blank' rel="noreferrer">
          <img height='36' style={{ border: 0, height: 36 }} src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
        </a>
      </div>
    </div>
  );
}
