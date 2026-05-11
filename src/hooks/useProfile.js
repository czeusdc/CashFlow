/**
 * useProfile.js
 *
 * Manages the user's profile (name + avatar emoji), persisted to localStorage.
 *
 * Returns:
 *   profile    - { name: string, avatar: string }
 *   setProfile - merges partial updates into profile and persists to storage
 *   isSetup    - true once the user has saved a non-empty name
 *   AVATARS    - exported list of available avatar emojis (used by profile picker UI)
 */

import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

/** Available avatar emojis shown in the profile setup modal. */
export const AVATARS = ['👤','👨','👩','🧑','👦','👧','🧔','👨‍💼','👩‍💼','🧑‍💻','👨‍🍳','👩‍🎨'];

const DEFAULT_PROFILE = { name: '', avatar: '👤' };

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE)) || DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState(readStoredProfile);

  /**
   * Merges `updates` into the current profile and persists to localStorage.
   * Accepts partial objects, e.g. setProfile({ name: 'Alice' }).
   */
  const setProfile = useCallback((updates) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      return next;
    });
  }, []);

  // The app shows the profile-setup modal until the user saves their name.
  const isSetup = Boolean(profile.name?.trim());

  return { profile, setProfile, isSetup, AVATARS };
}
