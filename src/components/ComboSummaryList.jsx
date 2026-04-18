import React, { forwardRef } from 'react';
import { BEYBLADE_DB } from '../constants';

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
          const spinType = BEYBLADE_DB[blade]?.spinType || 'right';
          const bitType = BEYBLADE_DB[beyblades[index]?.bit]?.type;
          const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
          const lockChip = beyblades[index]?.lockChip;
          const comboName = [
            isCXLine && lockChip ? lockChip : null,
            blade,
            BEYBLADE_DB[beyblades[index]?.assistBlade]?.alias,
            BEYBLADE_DB[beyblades[index]?.ratchet]?.altname,
            BEYBLADE_DB[beyblades[index]?.bit]?.alias,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li
              key={index}
              className="flex flex-col items-center gap-2 p-3 rounded-lg"
              style={{
                flex: '1 1 0',
                minWidth: 0,
                background: 'var(--color-surface-2)',
                border: '1px solid rgba(0,212,255,0.1)',
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

              {blade ? (
                <img
                  className="rounded-full object-contain"
                  style={{
                    width: '100%',
                    maxWidth: '80px',
                    aspectRatio: '1',
                    background: '#fff',
                  }}
                  src={`/images/${BEYBLADE_DB[blade]?.image}`}
                  alt={blade}
                />
              ) : (
                <div
                  className="rounded-full"
                  style={{ width: '80px', height: '80px', background: 'var(--color-surface)' }}
                />
              )}

              <div className="flex flex-row items-center justify-center gap-2">
                {bitType && (
                  <img
                    className="object-contain"
                    style={{ width: 28, height: 28 }}
                    src={`/images/${bitType}.png`}
                    alt={bitType}
                  />
                )}
                {blade && (
                  <img
                    className="spin-icon object-contain"
                    style={{ width: 28, height: 28 }}
                    src={`/images/${spinType}-spin.png`}
                    alt={spinType}
                  />
                )}
              </div>
            </li>
          );
        })}
    </ul>
  );
});

export default ComboSummaryList;
