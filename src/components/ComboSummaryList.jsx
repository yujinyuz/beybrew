import React, { forwardRef } from 'react';
import { BEYBLADE_DB, getStats, getLineColor } from '../constants';
import { getComboName } from '../lib/comboUtils';
import ComboTypeBadges from './ComboTypeBadges';

const ComboSummaryList = forwardRef(function ComboSummaryList({ beyblades, beybladeCount, className }, ref) {
  return (
    <ul
      ref={ref}
      role="list"
      className={`flex w-full ${className || ''}`}
      style={{ gap: '12px' }}
    >
      {Array(beybladeCount)
        .fill(null)
        .map((_, index) => {
          const blade = beyblades[index]?.blade;
          const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
          const lockChip = beyblades[index]?.lockChip;
          const overBlade = beyblades[index]?.overBlade;
          const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
          const comboName = getComboName(beyblades[index]);
          const lineColor = getLineColor(blade);

          return (
            <li
              key={index}
              className="flex flex-col items-center gap-2 p-3 rounded-lg"
              style={{
                flex: '1 1 0',
                minWidth: 0,
                background: 'var(--color-surface-2)',
                border: `1.5px solid ${lineColor}`,
              }}
            >
              <p
                className="text-xs font-semibold text-center leading-tight w-full"
                style={{
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-body)',
                  wordBreak: 'break-word',
                  minHeight: '2.5em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {comboName || '—'}
              </p>

              <ComboTypeBadges blade={blade} bit={beyblades[index]?.bit} size={16} />

              {blade ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: '80px' }}>
                  <img
                    className="rounded-full object-contain"
                    style={{ display: 'block', width: '100%', aspectRatio: '1', background: 'var(--color-surface)' }}
                    src={`/images/${getStats(blade, beyblades[index]?.bladeMode ?? 0)?.image}`}
                    alt={blade}
                  />
                  {isCXLine && overBladeImage && (
                    <img
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '60%',
                        height: '60%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                      src={`/images/${overBladeImage}`}
                      alt={overBlade}
                    />
                  )}
                  {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
                    <img
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '32%',
                        height: '32%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                      src={`/images/${BEYBLADE_DB[lockChip].image}`}
                      alt={lockChip}
                    />
                  )}
                </div>
              ) : (
                <div
                  className="rounded-full"
                  style={{ width: '80px', height: '80px', background: 'var(--color-surface)' }}
                />
              )}

              <div className="flex justify-center">
                <ComboTypeBadges blade={blade} bit={beyblades[index]?.bit} size={28} />
              </div>

            </li>
          );
        })}
    </ul>
  );
});

export default ComboSummaryList;
