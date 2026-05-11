export default function ProfileSection({ editName, setEditName, editAvatar, setEditAvatar, avatars, onSave }) {
  return (
    <div className="settings-section">
      <h3>👤 Your Profile</h3>
      <p>Your name is tagged on every transaction you add — useful for shared households.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="Your name" value={editName} onChange={e => setEditName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Avatar</label>
          <div className="avatar-grid">
            {avatars.map(av => (
              <button key={av} type="button" className={`avatar-btn ${editAvatar === av ? 'selected' : ''}`} onClick={() => setEditAvatar(av)}>{av}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={onSave} disabled={!editName.trim()}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
