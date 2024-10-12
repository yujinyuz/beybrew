import React, { useState } from 'react';
import PartSelector from './PartSelector';
import Beyblade from './Beyblade';

import { BLADES, RATCHETS, BITS, LIMITED_FORMAT, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS, BEYBLADE_DB } from './constants';

import bbxBanner from './assets/banner.png'

function LimitedFormat({ format, totalPoints, maximumPointsLimited }) {
  if (format !== LIMITED_FORMAT)
    return null;

  let textColor = 'text-green-600'

  if (totalPoints > maximumPointsLimited) {
    textColor = 'text-red-600'
  }

  return (
    <div className='mt-6 text-center'>

      <p className={`${textColor} font-semibold`}>
        {totalPoints}/{maximumPointsLimited}
      </p>
    </div>
  )
}

function App() {

  const [beybladeCount, setBeybladeCount] = useState(3);
  const [beyblades, setBeyblades] = useState([]);
  const [currentFormat, setCurrentFormat] = useState(STANDARD_FORMAT);
  const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS)
  const [partsUsed, setPartsUsed] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const handlePartChange = (index, partType, value) => {
    const newBeyblades = [
      ...beyblades,
    ];

    Array(beybladeCount).fill(null).forEach((item, index, arr) => {
      if (!newBeyblades[index]) {
        newBeyblades[index] = { blade: '', ratchet: '', bit: '' }
      }
    })

    newBeyblades[index][partType] = value

    setBeyblades(newBeyblades);

    const newUsedParts = new Set()
    newBeyblades.forEach((bey) => {
      newUsedParts.add(bey.blade)
      newUsedParts.add(bey.ratchet)
      newUsedParts.add(bey.bit)

    })

    let newPoints = 0
    newUsedParts.forEach((part) => {
      newPoints += (BEYBLADE_DB[part]?.points || 0)
    })
    setTotalPoints(newPoints)

    setPartsUsed([...newUsedParts])
  };



  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">

        <h1 className="text-2xl font-bold mb-6 text-center">Beybrew</h1>

        <img src={bbxBanner} className="mb-6" />
        <div className='mb-4'>
          <form id="beybladeForm" className="space-y-6">
            <div>
              <label htmlFor="beybladeCount" className="block text-sm font-medium text-gray-700">Number of Beyblades</label>
              <input type="number" id="beybladeCount" name="beybladeCount" min="1" max="10" value={beybladeCount} onChange={(e) => setBeybladeCount(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* <!-- Format --> */}
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">Format</label>
              <select id="format" name="format" defaultValue={STANDARD_FORMAT} onChange={(e) => setCurrentFormat(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value={STANDARD_FORMAT}>Standard (No Repeating Parts)</option>
                <option value={LIMITED_FORMAT}>Limited (No Repeating Parts w/ Homebrew Point System)</option>
              </select>
            </div>

            {/* <!-- Maximum Points --> */}
            {currentFormat === LIMITED_FORMAT ? (
              <div>
                <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700">Maximum Points Allowed</label>
                <input type="number" id="maxPoints" name="maxPoints" min="1" value={maximumPointsLimited} onChange={(e) => setMaximumPointsLimited(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>) : null
            }
          </form>
        </div>
        <div className="space-y-6">
          {Array(beybladeCount).fill(null).map((_, index) => {
            return (
              <div key={index} className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-4">Beyblade {index + 1}</h2>
                <PartSelector
                  label="Blade"
                  options={BLADES}
                  value={beyblades[index]?.blade}
                  onChange={(value) => handlePartChange(index, 'blade', value)}
                  partsUsed={partsUsed}
                  currentFormat={currentFormat}
                />
                <PartSelector
                  label="Ratchet"
                  options={RATCHETS}
                  value={beyblades[index]?.ratchet}
                  onChange={(value) => handlePartChange(index, 'ratchet', value)}
                  partsUsed={partsUsed}
                  currentFormat={currentFormat}
                />
                <PartSelector
                  label="Bit"
                  options={BITS}
                  value={beyblades[index]?.bit}
                  onChange={(value) => handlePartChange(index, 'bit', value)}
                  partsUsed={partsUsed}
                  currentFormat={currentFormat}
                />
                <Beyblade
                  blade={beyblades[index]?.blade}
                  ratchet={beyblades[index]?.ratchet}
                  bit={beyblades[index]?.bit}
                  format={currentFormat}
                />
              </div>
            )
          })}

        </div>

        <LimitedFormat format={currentFormat} totalPoints={totalPoints} maximumPointsLimited={maximumPointsLimited} />

      </div>
    </div>
  );
}

export default App;
