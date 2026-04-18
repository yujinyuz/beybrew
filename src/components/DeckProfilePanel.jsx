import React, { useState, useRef, useEffect } from 'react';
import { getDeckProfile, STAT_DEFS } from '../lib/comboUtils';

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));

function StatBar({ statDef, value }) {
  const pct = Math.min(100, ((value || 0) / STAT_LIMITS[statDef.key]) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '1px', textTransform: 'uppercase', width: '44px', flexShrink: 0 }}>
        {statDef.label}
      </span>
      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: statDef.gradient, borderRadius: '3px' }} />
      </div>
      <span style={{ fontSize: '9px', color: statDef.color, width: '30px', textAlign: 'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function BladerNameField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const confirm = () => {
    setEditing(false);
    onChange(draft.trim().slice(0, 32));
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={32}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '4px',
          color: 'var(--color-text)',
          fontSize: '11px',
          fontFamily: 'var(--font-body)',
          padding: '2px 6px',
          outline: 'none',
          width: '100px',
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit blader name"
      style={{
        color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontSize: '11px',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '4px',
        borderBottom: '1px dashed rgba(0,212,255,0.3)',
      }}
    >
      {value || 'your name...'}
    </span>
  );
}

function DeckProfilePanel({ beyblades, bladerName, onBladerNameChange }) {
  const profile = getDeckProfile(beyblades);
  if (!profile) return null;

  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid rgba(0,212,255,0.12)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
          Deck Profile
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Blader:</span>
          <BladerNameField value={bladerName} onChange={onBladerNameChange} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{profile.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: profile.color, letterSpacing: '1px', whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
            {profile.archetype}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '80px', lineHeight: 1.3 }}>
            {profile.flavor}
          </span>
        </div>

        <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {STAT_DEFS.map((def) => (
            <StatBar key={def.key} statDef={def} value={profile.averageStats[def.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeckProfilePanel;
