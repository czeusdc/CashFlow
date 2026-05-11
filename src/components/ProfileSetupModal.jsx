/**
 * ProfileSetupModal.jsx
 *
 * First-run welcome modal that prompts the user to enter a display name
 * and choose an avatar emoji. The "Skip" button closes without saving —
 * the modal will reappear the next time the app loads until a name is set.
 *
 * Profile data is written to localStorage via AppContext's setProfile(),
 * which cascades the update to every consumer of useApp().
 *
 * The modal is rendered via a React portal into document.body so it sits
 * above all other content regardless of stacking context.
 *
 * Props:
 *   onClose - called when the modal should be dismissed (save or skip)
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AVATARS } from '../hooks/useProfile';

export default function ProfileSetupModal({ onClose }) {
  const { profile, setProfile } = useApp();
  const [name,   setName]   = useState(profile.name   || '');
  const [avatar, setAvatar] = useState(profile.avatar || '👤');

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return; // disabled state handles this, but guard anyway
    setProfile({ name: name.trim(), avatar });
    onClose();
  }

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>👋 Welcome to CashFlow</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          Set up your profile so transactions are tagged with your name.
          Perfect for shared households later.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Name input */}
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Avatar picker */}
          <div className="form-group">
            <label className="form-label">Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map(av => (
                <button
                  key={av} type="button"
                  className={`avatar-btn ${avatar === av ? 'selected' : ''}`}
                  onClick={() => setAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Skip</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {avatar} Let's go!
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
