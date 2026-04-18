import React, { forwardRef } from 'react';
import { BEYBLADE_DB } from '../constants';

const ComboSummaryList = forwardRef(function ComboSummaryList({ beyblades, beybladeCount, className }, ref) {
  return (
    <ul ref={ref} role="list" className={`flex flex-row divide-y divide-gray-100 ${className || ''}`}>
      {Array(beybladeCount).fill(null).map((_, index) => {
        const spinType = BEYBLADE_DB[beyblades[index]?.blade]?.spinType || 'right';
        const bitType = BEYBLADE_DB[beyblades[index]?.bit]?.type;

        return (
          <li key={index} className="flex flex-col justify-center mx-4 mb-4">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm font-semibold text-gray-900">
                {BEYBLADE_DB[beyblades[index]?.blade]?.line === 'CX' && beyblades[index]?.lockChip
                  ? `${beyblades[index].lockChip} `
                  : ''}
                {beyblades[index]?.blade}{' '}
                {BEYBLADE_DB[beyblades[index]?.assistBlade]?.alias}{' '}
                {BEYBLADE_DB[beyblades[index]?.ratchet]?.altname}
                {BEYBLADE_DB[beyblades[index]?.bit]?.alias}
              </p>
              {beyblades[index]?.blade && (
                <img
                  className="h-24 w-24 rounded-full bg-gray-50"
                  src={`/images/${BEYBLADE_DB[beyblades[index].blade]?.image}`}
                  alt=""
                />
              )}
            </div>
            <div className="flex flex-row justify-center content-center gap-x-4">
              {bitType && (
                <img className="h-8 w-8 flex-none bg-gray-50" src={`/images/${bitType}.png`} alt={bitType} />
              )}
              {beyblades[index]?.blade && (
                <img className="h-8 w-8 flex-none bg-gray-50" src={`/images/${spinType}-spin.png`} alt="" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export default ComboSummaryList;
