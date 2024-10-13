import React, { useEffect, useState } from 'react';
import PartSelector from './PartSelector';
import Beyblade from './Beyblade';

import { BLADES, RATCHETS, BITS, LIMITED_FORMAT, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS, BEYBLADE_DB } from './constants';

import bbxBanner from './assets/banner.png'
import { useSearchParams } from 'react-router-dom';

function LimitedFormatPoints({ format, totalPoints, maximumPointsLimited }) {
  if (format !== LIMITED_FORMAT)
    return null;

  let textColor = 'text-green-600'

  if (totalPoints > maximumPointsLimited) {
    textColor = 'text-red-600'
  }

  return (
    <div className='sticky top-0 right-0 text-center bg-white'>
      <p className={`${textColor} font-semibold`}>
        Total Points: {totalPoints}/{maximumPointsLimited}
      </p>
    </div>
  )
}


function getSharedValues() {
  // When there are values from search params, try to get it because this combo has been probably shared by another person

}

function handleSharedBeys(beys) {

  const newBeys = []

  let totalPoints = 0


  beys.forEach(bey => {

    let [blade, ratchet, bit] = bey.split(',')

    newBeys.push({
      blade: blade,
      ratchet: ratchet,
      bit: bit,
    })

    totalPoints += BEYBLADE_DB[blade]?.points || 0
    totalPoints += BEYBLADE_DB[ratchet]?.points || 0
    totalPoints += BEYBLADE_DB[bit]?.points || 0
  })

  return [newBeys, totalPoints]
}

function App() {

  const [searchParams, setSearchParams] = useSearchParams()

  const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
  const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || STANDARD_FORMAT);
  const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS)

  const [sharedBeys, sharedBeysTotalPoints] = handleSharedBeys(searchParams.getAll('beys') || [])

  const [partsUsed, setPartsUsed] = useState([]);
  const [totalPoints, setTotalPoints] = useState(sharedBeysTotalPoints || 0);
  const [beyblades, setBeyblades] = useState(sharedBeys || []);

  // Clear seacrh params
  useEffect(() => {
    setSearchParams(new URLSearchParams())
  }, [])

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

  const handleShareButton = () => {
    const url = new URL(window.location.href)
    const params = {
      beycount: beybladeCount,
      format: currentFormat,
    }

    Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));


    // We can't just use .set for search params because it overrides the older one.
    beyblades.forEach(bey => {
      url.searchParams.append('beys', `${bey.blade},${bey.ratchet},${bey.bit}`)
    })

    navigator.clipboard.writeText(url.toString())
      .then(() => {
        window.alert('Successfully copied to clipboard!')
        console.log("URL copied to clipboard: ", url.toString())
      })
      .catch(err => {
        console.error("Failed to copy URL: ", err);
      })

  }



  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">


        <h1 className="text-2xl font-bold mb-6 text-center">Beybrew</h1>

        <img src={bbxBanner} className="mb-6" />

        <LimitedFormatPoints format={currentFormat} totalPoints={totalPoints} maximumPointsLimited={maximumPointsLimited} />
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

        <div className='mt-6 text-center flex justify-center'>
          <button
            onClick={handleShareButton}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* Share Icon (Replace with an icon library like Heroicons if preferred) */}
            <svg className="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M7.926 10.898 15 7.727m-7.074 5.39L15 16.29M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
            </svg>
            <span>Share</span>
          </button>

        </div>

        <footer className="text-sm text-center mt-6">
          <div>
            Made with <span className='text-red-500'>&hearts;</span> from Davao, Philippines &#127477;&#127469;
          </div>
          <div>
            <p>Source available on GitHub <a target="_blank" rel="noreferrer noopener" href="https://github.com/yujinyuz/beybrew">@yujinyuz</a></p>
            <p>Join us on <a target="_blank" rel="noreferrer noopener" className='text-blue-500' href="https://www.facebook.com/groups/6853157261426617">on Facebook</a> Beyblade X Davao Community</p>
          </div>
        </footer>

      </div>



    </div>
  );
}

export default App;
