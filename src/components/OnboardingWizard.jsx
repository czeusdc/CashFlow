/**
 * OnboardingWizard.jsx
 *
 * Now a full-page onboarding experience (v1.2).
 * 
 * Features:
 *  - Split-screen layout (Branding/Preview vs Form)
 *  - Live App Preview in the Appearance step
 *  - No more portals or overlays
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Check, Plus, Loader2, Sun, Moon, ShieldCheck, Zap, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CURRENCIES } from '../hooks/useCurrency';
import { AVATARS } from '../hooks/useProfile';
import { THEMES, STYLES } from '../hooks/useTheme';
import { useToast } from './Toast';
import { getAllCategories, deleteCategories, addCategory } from '../db/idb';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function OnboardingWizard() {
  const { 
    setProfile, setCurrency, profile, 
    theme, setTheme, mode, setMode, toggleMode, style, setStyle 
  } = useApp();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // ── Step 3: Currency State ────────────────────────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const browserLocale = navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Timezone hints
    if (timeZone.includes('Manila') || timeZone.includes('Taipei')) return 'PHP';
    if (timeZone.includes('Singapore')) return 'SGD';

    const matched = CURRENCIES.find(c => c.locale === browserLocale) || 
                    CURRENCIES.find(c => browserLocale.startsWith(c.locale.split('-')[0])) ||
                    CURRENCIES[0];
    return matched.code;
  });

  // ── Step 4: Categories State ──────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [toggles, setToggles] = useState({}); 
  const [customCats, setCustomCats] = useState([]); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💰');
  const [customType, setCustomType] = useState('expense');

  useEffect(() => {
    async function load() {
      try {
        const all = await getAllCategories();
        setCategories(all);
        const initialToggles = {};
        all.forEach(c => { initialToggles[c.id] = true; });
        setToggles(initialToggles);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCats(false);
      }
    }
    load();
  }, []);

  // ── Step 5: Profile State ─────────────────────────────────────────────────
  const [name, setName] = useState(profile.name || '');
  const [avatar, setAvatar] = useState(profile.avatar || '👤');

  // ── Navigation ────────────────────────────────────────────────────────────
  const next = () => setStep(s => Math.min(s + 1, totalSteps));
  const back = () => setStep(s => Math.max(s - 1, 1));

  useEffect(() => {
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        const target = e.target;
        if (target.tagName === 'INPUT' && step === 4) return;
        if (step === 5) {
          if (name.trim()) handleFinish();
        } else {
          next();
        }
      }
    };
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [step, name]);

  // ── Final Submission ──────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    try {
      setCurrency(selectedCurrency);
      setProfile({ name: name.trim(), avatar });

      const toDelete = categories.filter(c => !toggles[c.id]).map(c => c.id);
      if (toDelete.length > 0) {
        await deleteCategories(toDelete);
      }

      for (const cat of customCats) {
        await addCategory(cat);
      }

      toast("🎉 Welcome aboard! Your dashboard is ready.", "success");
      // App.jsx WelcomeGate will handle redirect to / when isSetup becomes true
    } catch (err) {
      console.error("Onboarding failed:", err);
      toast("Something went wrong during setup.", "error");
    }
  }, [selectedCurrency, name, avatar, categories, toggles, customCats, setCurrency, setProfile, toast]);

  // ── Skip Setup ────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    setCurrency(selectedCurrency);
    setProfile({ name: 'User', avatar: '👤' });
    toast("Welcome! You can finish setting up in Settings anytime.", "info");
  }, [selectedCurrency, setCurrency, setProfile, toast]);

  // ── Custom Category Logic ─────────────────────────────────────────────────
  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase()) ||
                   customCats.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast("Category already exists.", "info");
      return;
    }
    setCustomCats([...customCats, { 
      name: trimmed, emoji: customEmoji, type: customType, 
      color: customType === 'income' ? '#22C55E' : (customType === 'savings' ? '#38BDF8' : '#64748B')
    }]);
    setCustomName('');
  };

  // ── Render Helpers ────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="onboard-step active">
          <div className="onboard-hero-icon" style={{ fontSize: 64, marginBottom: 16 }}>💸</div>
          <h1 className="onboard-title">Welcome to CashFlow</h1>
          <p className="onboard-subtitle">
            Take control of your finances with our privacy-first tracker. 
            All your data stays safely on your device.
          </p>
          
          <div className="welcome-features">
            <div className="welcome-feature">
              <div className="feature-icon"><ShieldCheck size={20} /></div>
              <div>
                <strong>Privacy First</strong>
                <p>No cloud, no trackers, no accounts needed.</p>
              </div>
            </div>
            <div className="welcome-feature">
              <div className="feature-icon"><Zap size={20} /></div>
              <div>
                <strong>Lightning Fast</strong>
                <p>Built for speed and offline reliability.</p>
              </div>
            </div>
          </div>

          <div className="onboard-footer">
            <button className="btn btn-ghost" onClick={handleSkip}>
              Skip setup for now
            </button>
            <button className="btn btn-primary btn-lg" onClick={next}>
              Let's Go <ChevronRight size={18} />
            </button>
          </div>
        </div>
      );

      case 2: return (
        <div className="onboard-step active">
          <h2 className="onboard-title">Personalize</h2>
          <p className="onboard-subtitle">Choose a theme that fits your personality.</p>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Accent Color</label>
            <div className="theme-swatches">
              {THEMES.map(t => (
                <div 
                  key={t}
                  className={`theme-swatch ${theme === t ? 'active' : ''}`}
                  onClick={() => setTheme(t)}
                  style={{ background: `var(--accent)`, '--accent': t === 'teal' ? '#14B8A6' : (t === 'violet' ? '#8B5CF6' : (t === 'amber' ? '#F59E0B' : (t === 'mint' ? '#10B981' : (t === 'crimson' ? '#E11D48' : '#0EA5E9')))) }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Light/Dark</label>
              <button className="mode-toggle" onClick={toggleMode} style={{ width: '100%' }}>
                {mode === 'dark' ? <><Moon size={16} /> Dark</> : <><Sun size={16} /> Light</>}
              </button>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">UI Style</label>
              <div className="range-tabs">
                {STYLES.map(s => (
                  <button 
                    key={s}
                    className={`range-tab ${style === s ? 'active' : ''}`}
                    onClick={() => setStyle(s)}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="onboard-footer">
            <button className="btn btn-ghost" onClick={back}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={next}>
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        </div>
      );

      case 3: return (
        <div className="onboard-step active">
          <h2 className="onboard-title">Local Currency</h2>
          <p className="onboard-subtitle">We've auto-detected your region. Is this correct?</p>
          
          <div className="onboard-currency-grid">
            {CURRENCIES.map(c => (
              <div 
                key={c.code} 
                className={`currency-card ${selectedCurrency === c.code ? 'selected' : ''}`}
                onClick={() => setSelectedCurrency(c.code)}
              >
                <span className="currency-symbol">{c.symbol}</span>
                <span className="currency-code">{c.code}</span>
                <span className="currency-label">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="onboard-footer">
            <button className="btn btn-ghost" onClick={back}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={next}>
              Continue <ChevronRight size={18} />
            </button>
          </div>
        </div>
      );

      case 4: return (
        <div className="onboard-step active">
          <h2 className="onboard-title">Categories</h2>
          <p className="onboard-subtitle">Choose the default spending categories you want to keep.</p>

          <div className="onboard-category-list" style={{ maxHeight: '35vh' }}>
            {loadingCats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 className="spinner" />
              </div>
            ) : (
              categories.map(c => (
                <div key={c.id} className="onboard-category-item">
                  <div className="onboard-category-info">
                    <span className="onboard-category-emoji">{c.emoji}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <span>{c.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: `var(--${c.type})`, opacity: 0.8 }}>
                        {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={!!toggles[c.id]} onChange={e => setToggles(prev => ({ ...prev, [c.id]: e.target.checked }))}/>
                    <span className="slider"></span>
                  </label>
                </div>
              ))
            )}
            {customCats.map((c, idx) => (
              <div key={`custom-${idx}`} className="onboard-category-item">
                <div className="onboard-category-info">
                  <span className="onboard-category-emoji">{c.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: `var(--${c.type})`, opacity: 0.8 }}>
                      {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>NEW</div>
              </div>
            ))}
          </div>

          <div className="onboard-add-custom">
            <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>{customEmoji}</button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="form-input" placeholder="Add your own..." value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()}/>
              <div className="type-tabs" style={{ height: 32 }}>
                {['expense', 'income', 'savings'].map(t => (
                  <button key={t} className={`type-tab btn-sm ${customType === t ? 'active-' + t : ''}`} onClick={() => setCustomType(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-icon" disabled={!customName.trim()} onClick={addCustom}><Plus size={18} /></button>
          </div>

          {showEmojiPicker && (
            <div className="emoji-popover">
              <Picker data={data} onEmojiSelect={(e) => { setCustomEmoji(e.native); setShowEmojiPicker(false); }} theme={mode === 'light' ? 'light' : 'dark'} />
            </div>
          )}

          <div className="onboard-footer" style={{ marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={back}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={next}>
              Continue <ChevronRight size={18} />
            </button>
          </div>
        </div>
      );

      case 5: return (
        <div className="onboard-step active">
          <h2 className="onboard-title">Final Step</h2>
          <p className="onboard-subtitle">Choose your avatar and display name.</p>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">How should we call you?</label>
            <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Pick an Avatar</label>
            <div className="avatar-grid" style={{ marginTop: 10 }}>
              {AVATARS.map(av => (
                <button key={av} type="button" className={`avatar-btn ${avatar === av ? 'selected' : ''}`} onClick={() => setAvatar(av)}>{av}</button>
              ))}
            </div>
          </div>

          <div className="onboard-footer" style={{ marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={back}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleFinish} disabled={!name.trim()}>
              Finish Setup <Check size={18} />
            </button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-preview-side">
        <div className="welcome-branding">
          <div className="navbar-logo" style={{ marginBottom: 40 }}>
            <div className="navbar-logo-icon" style={{ fontSize: 48 }}>💸</div>
            <span className="navbar-logo-text" style={{ fontSize: 32 }}>Cash<span>Flow</span></span>
          </div>
          
          {/* Live App Preview - Only shown in Step 2, or generic branding elsewhere */}
          <div className="app-preview-container">
            <div className="preview-card" data-theme={theme} data-mode={mode} data-style={style}>
              <div className="preview-header">
                <div className="dot red" /> <div className="dot yellow" /> <div className="dot green" />
                <div className="preview-title">Live Preview</div>
              </div>
              <div className="preview-body">
                <div className="preview-stats">
                  <div className="p-stat">
                    <span className="p-label">Total Balance</span>
                    <span className="p-value">
                      {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'} 
                      12,450.00
                    </span>
                  </div>
                  <div className="p-chart" />
                </div>
                <div className="preview-tx-list">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-tx">
                      <div className="p-tx-icon" />
                      <div className="p-tx-info">
                        <div className="p-tx-name" />
                        <div className="p-tx-cat" />
                      </div>
                      <div className="p-tx-amt" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="preview-fab">
                <Plus size={20} />
              </div>
            </div>
            <div className="preview-glow" />
          </div>

          <div className="welcome-quote">
            <Heart size={20} className="heart-icon" />
            <p>Beautifully simple. Powerfully private.</p>
          </div>
        </div>
      </div>

      <div className="welcome-form-side">
        <div className="onboard-indicators top-indicators">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`onboard-dot ${step === i ? 'active' : (step > i ? 'done' : '')}`}>
              {step > i && <Check size={10} />}
            </div>
          ))}
        </div>

        <div className="welcome-card">
          {renderStep()}
        </div>

        <div className="welcome-footer-links">
          <button className="btn-link-muted" onClick={handleSkip}>Skip setup</button>
          <span>&bull;</span>
          <span>Version 1.2.0</span>
          <span>&bull;</span>
          <a href="https://github.com/czeusdc/CashFlow" target="_blank" rel="noreferrer">Open Source</a>
        </div>
      </div>
    </div>
  );
}
