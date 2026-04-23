import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDeckProfile, STAT_DEFS } from '../lib/comboUtils';

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));
const CIRCUMFERENCE = 2 * Math.PI * 15;

function StatCircle({ statDef, value }) {
  const pct = Math.min(100, (value || 0) / STAT_LIMITS[statDef.key]);
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="15" fill="none" style={{ stroke: 'var(--color-stat-track)' }} strokeWidth="4" />
        <circle
          cx="20" cy="20" r="15"
          fill="none"
          strokeWidth="4"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ stroke: statDef.color }}
        />
        <text
          x="20" y="24"
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
          style={{ fill: statDef.color }}
        >
          {Math.round(pct)}
        </text>
      </svg>
      <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {statDef.abbr}
      </span>
    </div>
  );
}

StatCircle.propTypes = {
  statDef: PropTypes.shape({ key: PropTypes.string, abbr: PropTypes.string, color: PropTypes.string }).isRequired,
  value: PropTypes.number,
};

function BladerNameField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing) {
      cancelledRef.current = false;
      inputRef.current?.focus();
    }
  }, [editing]);

  const confirm = () => {
    if (cancelledRef.current) return;
    setEditing(false);
    onChange(draft.trim().slice(0, 32));
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        aria-label="Blader name"
        value={draft}
        maxLength={32}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') {
            cancelledRef.current = true;
            setDraft(value);
            setEditing(false);
          }
        }}
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

BladerNameField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function DeckProfilePanel({ beyblades, bladerName, onBladerNameChange }) {
  const profile = getDeckProfile(beyblades);
  if (!profile) return null;

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '72px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }}>{profile.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: profile.color, letterSpacing: '1px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
            {profile.archetype}
          </span>
          <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
            {profile.flavor}
          </span>
        </div>

        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {STAT_DEFS.map((def) => (
            <StatCircle key={def.key} statDef={def} value={profile.averageStats[def.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}

DeckProfilePanel.propTypes = {
  beyblades: PropTypes.array.isRequired,
  bladerName: PropTypes.string.isRequired,
  onBladerNameChange: PropTypes.func.isRequired,
};

export default DeckProfilePanel;
