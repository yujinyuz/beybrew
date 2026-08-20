import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { parseSourceCombos, getReleaseGroups, LINE_BADGE } from './constants';

const TYPE_COLORS = {
  attack: '#42a5f5',
  defense: '#2e7d32',
  stamina: '#e65100',
  balance: '#7b1fa2',
};

function ComboRow({ combo }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 8px',
        borderRadius: '6px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {combo.type && (
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: TYPE_COLORS[combo.type] ?? '#888',
            flexShrink: 0,
          }}
          title={combo.type}
        />
      )}
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>
        {combo.blade}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {combo.ratchet} {combo.bit}
      </span>
    </div>
  );
}

ComboRow.propTypes = {
  combo: PropTypes.shape({
    blade: PropTypes.string.isRequired,
    ratchet: PropTypes.string.isRequired,
    bit: PropTypes.string.isRequired,
    type: PropTypes.string,
  }).isRequired,
};

function SetGroup({ group }) {
  const lineInfo = LINE_BADGE[group.line] ?? LINE_BADGE.BX;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '6px',
            background: `color-mix(in srgb, ${lineInfo.color} 20%, transparent)`,
            color: lineInfo.color,
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '10px',
            letterSpacing: '0.08em',
          }}
        >
          {lineInfo.label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '15px',
            color: 'var(--color-text)',
            letterSpacing: '0.02em',
          }}
        >
          {group.set}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {group.combos.length} {group.combos.length === 1 ? 'combo' : 'combos'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {group.combos.map((combo, i) => (
          <ComboRow key={`${combo.blade}-${combo.ratchet}-${combo.bit}-${i}`} combo={combo} />
        ))}
      </div>
    </div>
  );
}

SetGroup.propTypes = {
  group: PropTypes.shape({
    set: PropTypes.string.isRequired,
    line: PropTypes.string.isRequired,
    combos: PropTypes.array.isRequired,
  }).isRequired,
};

export default function ReleasesView() {
  const allCombos = useMemo(() => parseSourceCombos(), []);
  const allGroups = useMemo(() => getReleaseGroups(allCombos), [allCombos]);

  const [activeLines, setActiveLines] = useState({ BX: true, UX: true, CX: true });
  const [showEvergreen, setShowEvergreen] = useState(false);

  const toggleLine = (line) => {
    setActiveLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const numberedGroups = useMemo(
    () => allGroups.filter(g => !g.set.endsWith('-00') && activeLines[g.line]),
    [allGroups, activeLines]
  );

  const evergreenGroups = useMemo(
    () => allGroups.filter(g => g.set.endsWith('-00') && activeLines[g.line]),
    [allGroups, activeLines]
  );

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Line filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(LINE_BADGE).map(([line, info]) => (
          <button
            key={line}
            onClick={() => toggleLine(line)}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: `1px solid ${activeLines[line] ? info.color : 'var(--color-border)'}`,
              background: activeLines[line]
                ? `color-mix(in srgb, ${info.color} 15%, transparent)`
                : 'transparent',
              color: activeLines[line] ? info.color : 'var(--color-text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {info.label}
          </button>
        ))}
        <span style={{ alignSelf: 'center', marginLeft: '4px', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {numberedGroups.reduce((sum, g) => sum + g.combos.length, 0)} combos across {numberedGroups.length} sets
        </span>
      </div>

      {/* Numbered sets */}
      {numberedGroups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
          No releases match the current filter.
        </div>
      )}
      {numberedGroups.map(group => (
        <SetGroup key={group.set} group={group} />
      ))}

      {/* Evergreen section */}
      {evergreenGroups.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setShowEvergreen(!showEvergreen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '12px',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{ transform: showEvergreen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: '10px' }}>▶</span>
            Evergreen Releases
            <span style={{ fontWeight: 400, fontSize: '11px', opacity: 0.6 }}>
              ({evergreenGroups.reduce((sum, g) => sum + g.combos.length, 0)} combos)
            </span>
          </button>
          {showEvergreen && (
            <div style={{ marginTop: '12px' }}>
              {evergreenGroups.map(group => (
                <SetGroup key={group.set} group={group} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
