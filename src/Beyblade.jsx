import React from 'react';

import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function StatsBar({ label, amount, color, limit = 1 }) {
  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{label}</h3>
        <span className="text-sm text-gray-800 dark:text-white">{amount || 0}</span>
      </div>
      <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700 mb-2" role="progressbar" aria-valuenow={amount} aria-valuemin="0" aria-valuemax="100">
        <div className={`flex flex-col justify-center rounded-full overflow-hidden ${color} text-xs text-white text-center whitespace-nowrap transition duration-500 dark:bg-blue-500`} style={{ width: `${amount / limit}%` }}></div>
      </div>
    </div>
  )
}

function BeyBladeImage({ blade, ratchet, bit }) {

}

function StatsBarSteps({ label, amount }) {
  return (
    <div className="max-w-40 flex items-center gap-x-1">
      <div className="w-full h-2.5 flex flex-col justify-center overflow-hidden bg-blue-600 text-xs text-white text-center whitespace-nowrap transition duration-500 dark:bg-blue-500" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
      <div className="w-full h-2.5 flex flex-col justify-center overflow-hidden bg-blue-600 text-xs text-white text-center whitespace-nowrap transition duration-500 dark:bg-blue-500" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
      <div className="w-full h-2.5 flex flex-col justify-center overflow-hidden bg-gray-300 text-xs text-white text-center whitespace-nowrap transition duration-500 dark:bg-neutral-600" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
      <div className="w-full h-2.5 flex flex-col justify-center overflow-hidden bg-gray-300 text-xs text-white text-center whitespace-nowrap transition duration-500 dark:bg-neutral-600" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
      <div>
        <div className="w-10 text-end">
          <span className="text-sm text-gray-800 dark:text-white">{amount}</span>
        </div>
      </div>
    </div>
  )
}


function Beyblade({ blade, assistBlade, ratchet, bit, format }) {

  const comboPoints = (BEYBLADE_DB[blade]?.points || 0) + (BEYBLADE_DB[ratchet]?.points || 0) + (BEYBLADE_DB[bit]?.points || 0);

  const attackTotal = (BEYBLADE_DB[blade]?.attack || 0) + (BEYBLADE_DB[ratchet]?.attack || 0) + (BEYBLADE_DB[bit]?.attack || 0)
  const defenseTotal = (BEYBLADE_DB[blade]?.defense || 0) + (BEYBLADE_DB[ratchet]?.defense || 0) + (BEYBLADE_DB[bit]?.defense || 0);
  const staminaTotal = (BEYBLADE_DB[blade]?.stamina || 0) + (BEYBLADE_DB[ratchet]?.stamina || 0) + (BEYBLADE_DB[bit]?.stamina || 0);
  const xDashTotal = BEYBLADE_DB[bit]?.xDash || 0
  const burtResistanceTotal = BEYBLADE_DB[bit]?.burstResistance || 0

  const isCXLine = BEYBLADE_DB[blade]?.line === "CX"

  return (
    <div className="mt-4">
      <p className="text-md mb-2">
        <strong>Combo:</strong> {blade || '-'} {isCXLine ? (BEYBLADE_DB[assistBlade]?.alias || '-') : ''} {ratchet || '-'}{BEYBLADE_DB[bit]?.alias || ' -'}
      </p>

      <StatsBar label={"Attack"} amount={attackTotal} limit={2} color={"bg-blue-600"} />
      <StatsBar label={"Defense"} amount={defenseTotal} limit={2} color={"bg-green-600"} />
      <StatsBar label={"Stamina"} amount={staminaTotal} limit={2} color={"bg-orange-300"} />
      <StatsBar label={"Xtreme Dash"} amount={xDashTotal} color={"bg-red-500"} />
      <StatsBar label={"Burst Resistance"} amount={burtResistanceTotal} color={"bg-indigo-600"} />

      {format === LIMITED_FORMAT ? (
        <p className="text-sm mt-2">
          Combo Points: {comboPoints}
        </p>) : null
      }
    </div>
  );
}

export default Beyblade;
