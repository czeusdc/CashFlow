import { Upload, Trash2 } from 'lucide-react';

export default function DataImportSection({ onImportClick, onClearClick }) {
  return (
    <>
      <div className="settings-section">
        <h3>📥 Import Data</h3>
        <p>Restore from a previously exported JSON backup. This will <strong>replace</strong> all current data.</p>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={onImportClick}><Upload size={15} /> Import JSON Backup</button>
        </div>
      </div>

      <div className="settings-section" style={{ border: '1px solid rgba(244,63,94,0.2)' }}>
        <h3 style={{ color: 'var(--expense)' }}>⚠ Danger Zone</h3>
        <p>Permanently delete all your CashFlow data. This cannot be undone.</p>
        <div className="settings-actions">
          <button className="btn btn-danger" onClick={onClearClick}><Trash2 size={15} /> Clear All Data</button>
        </div>
      </div>
    </>
  );
}
