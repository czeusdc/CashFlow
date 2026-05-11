import { Download, FileSpreadsheet } from 'lucide-react';

export default function DataExportSection({ onExportJSON, onExportCSV, onExportExcel, onShowQR }) {
  return (
    <>
      <div className="settings-section">
        <h3>📤 Export Data</h3>
        <p>Download a backup of all your transactions and categories.</p>
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={onExportJSON}><Download size={15} /> JSON Backup</button>
          <button className="btn btn-ghost" onClick={onExportCSV}><Download size={15} /> CSV</button>
          <button className="btn btn-ghost" onClick={onExportExcel}><FileSpreadsheet size={15} /> Excel (.xlsx)</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>📱 Share to Another Browser</h3>
        <p>Generate a QR code or share link to transfer your data to another device — no account needed.</p>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={onShowQR}>📲 Generate QR / Share Link</button>
        </div>
      </div>
    </>
  );
}
