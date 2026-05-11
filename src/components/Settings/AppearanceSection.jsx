import { Sun, Moon } from 'lucide-react';

export default function AppearanceSection({ style, setStyle, styles, theme, setTheme, themes, mode, toggleMode }) {
  return (
    <div className="settings-section">
      <h3>🎨 Appearance</h3>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Design Style</p>
      <div className="style-picker">
        {styles.map(s => (
          <div key={s.id} className={`style-option ${style === s.id ? 'active' : ''}`} onClick={() => setStyle(s.id)}>
            <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
            <div className="style-option-name">{s.name}</div>
            <div className="style-option-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Color Theme</p>
      <div className="theme-swatches">
        {themes.map(t => (
          <button key={t.id} className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
            style={{ background: `${t.bg}22`, border: `2px solid ${theme === t.id ? t.bg : 'transparent'}` }}
            onClick={() => setTheme(t.id)}
            title={t.label}
          >
            {t.emoji} <span style={{ fontSize: 12, fontWeight: 700, color: t.bg }}>{t.label}</span>
          </button>
        ))}
      </div>
      <button className="mode-toggle" onClick={toggleMode}>
        {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
}
