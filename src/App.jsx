import React, { useCallback, useEffect, useRef, useState } from 'react';
import PartSelector from './PartSelector';
import Beyblade from './Beyblade';

import { BLADES, RATCHETS, BITS, LIMITED_FORMAT, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS, BEYBLADE_DB, DEFAULT_FORMAT } from './constants';

import bbxBanner from './assets/banner.png'
import { useSearchParams } from 'react-router-dom';
import { toPng } from 'html-to-image';

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


function getPartsUsed(beys) {
  const newUsedParts = new Set()
  beys.forEach((bey) => {
    newUsedParts.add(bey.blade)
    newUsedParts.add(bey.ratchet)
    newUsedParts.add(bey.bit)

  })

  return newUsedParts
}

function App() {

  const [searchParams, setSearchParams] = useSearchParams()

  const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
  const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || DEFAULT_FORMAT);
  const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS)


  const [partsUsed, setPartsUsed] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [beyblades, setBeyblades] = useState([]);

  // Clear search params
  useEffect(() => {
    const [sharedBeys, sharedBeysTotalPoints] = handleSharedBeys(searchParams.getAll('beys') || [])
    setSearchParams(new URLSearchParams())
    setBeyblades(sharedBeys)
    setTotalPoints(sharedBeysTotalPoints)
    setPartsUsed([...getPartsUsed(sharedBeys)])
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

    let newPoints = 0
    const newUsedParts = getPartsUsed(newBeyblades)
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

  const beyComboRef = useRef(null)
  const beyComboParentRef = useRef(null);

  const handleDownloadButton = useCallback(() => {
    if (beyComboRef.current === null) {
      return
    }

    if (beyComboParentRef.current === null) {
      return
    }

    if (partsUsed.length !== (beybladeCount * 3)) {
      console.log(`${partsUsed.length} !=== ${(beybladeCount * 3)}`)
      window.alert('Please fill up all parts')
      return
    }

    beyComboParentRef.current.style = 'display: block';
    toPng(beyComboRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `beybrew_${Date.now()}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        window.alert(`Error: ${err}`)
        console.log(err)
      })
      .finally(() => {
        beyComboParentRef.current.style = 'display: hidden';
      })

    // toBlob(theRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
    //   .then((dataUrl) => {
    //     const link = document.createElement('a')
    //     link.download = 'my-image-name.png'
    //     link.href = dataUrl
    //     link.click()
    //   })


  }, [partsUsed, beyComboRef])

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">


        <h1 className="text-2xl font-bold mb-6 text-center">BeyBrew</h1>

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
              <select id="format" name="format" defaultValue={DEFAULT_FORMAT} onChange={(e) => setCurrentFormat(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
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

        <div className='mt-6 flex justify-center'>
          <ul role="list" className="flex flex-col lg:flex-row divide-y divide-gray-100">

            {Array(beybladeCount).fill(null).map((_, index) => {

              const spinType = BEYBLADE_DB[beyblades[index]?.blade]?.spinType || 'right'
              const bitType = BEYBLADE_DB[beyblades[index]?.bit]?.type
              const comboTypeImg = `/images/${bitType}.png`

              return (
                <li key={`${index}`} className="flex flex-col justify-center mx-4 mb-4">
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-sm font-semibold text-gray-900">{beyblades[index]?.blade} {beyblades[index]?.ratchet}{BEYBLADE_DB[beyblades[index]?.bit]?.alias}</p>

                    {beyblades[index]?.blade ?
                      <img className="h-24 w-24 rounded-full bg-gray-50" src={`/images/${BEYBLADE_DB[beyblades[index]?.blade]?.image}`} alt="" /> : null
                    }
                  </div>
                  <div className='flex flex-row justify-center content-center gap-x-4'>
                    {bitType ? <img className="h-8 w-8 flex-none bg-gray-50" src={comboTypeImg} alt={bitType} /> : null}
                    {beyblades[index]?.blade ? <img className="h-8 w-8 flex-none bg-gray-50" src={`/images/${spinType}-spin.png`} alt="" /> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-6 text-center flex justify-center gap-2">
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

          <button onClick={handleDownloadButton} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg inline-flex items-center relative">
            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
            </svg>
            <span>Download<small style={{ fontSize: '8px', display: 'block' }}>[experimental]</small></span>
          </button>


        </div>


        <footer className="text-sm text-center mt-6">
          <div>
            Made with <span className='text-red-500'>&hearts;</span> in Davao, Philippines &#127477;&#127469;
          </div>
          <div>
            <p>Source available on GitHub <a target="_blank" rel="noreferrer noopener" href="https://github.com/yujinyuz/beybrew">@yujinyuz/beybrew</a></p>
            <p>Follow us on <a target="_blank" rel="noreferrer noopener" className='text-blue-500' href="https://www.facebook.com/bbxdc">Facebook</a></p>
            <p><a target="_blank" rel="noreferrer noopener" className='text-blue-500' href="https://buymeacoffee.com/yujinyuz">Buy me a coffe ☕</a></p>
          </div>
        </footer>

      </div>

      <div className={`w-max hidden`} ref={beyComboParentRef}>
        <ul ref={beyComboRef} role="list" className="flex flex-row divide-y divide-gray-100">

          {Array(beybladeCount).fill(null).map((_, index) => {

            const spinType = BEYBLADE_DB[beyblades[index]?.blade]?.spinType || 'right'
            const bitType = BEYBLADE_DB[beyblades[index]?.bit]?.type
            const comboTypeImg = `/images/${bitType}.png`

            return (
              <li key={`${index}`} className="flex flex-col justify-center mx-4 mb-4">
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-semibold text-gray-900">{beyblades[index]?.blade} {beyblades[index]?.ratchet}{BEYBLADE_DB[beyblades[index]?.bit]?.alias}</p>

                  {beyblades[index]?.blade ?
                    <img className="h-24 w-24 rounded-full bg-gray-50" src={`/images/${BEYBLADE_DB[beyblades[index]?.blade]?.image}`} alt="" /> : null
                  }
                </div>
                <div className='flex flex-row justify-center content-center gap-x-4'>
                  {bitType ? <img className="h-8 w-8 flex-none bg-gray-50" src={comboTypeImg} alt={bitType} /> : null}
                  {beyblades[index]?.blade ? <img className="h-8 w-8 flex-none bg-gray-50" src={`/images/${spinType}-spin.png`} alt="" /> : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>


    </div>
  );
}

export default App;
