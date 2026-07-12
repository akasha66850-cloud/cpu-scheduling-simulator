import React, { useState } from 'react'
import { Settings, BookOpen } from 'lucide-react'
import usePageReplacementStore from '@/store/usePageReplacementStore'

export const PAGE_ALGORITHM_DESCS = {
  FIFO: 'First-In, First-Out: Replaces the oldest page in memory. Can suffer from Belady\'s Anomaly where more frames cause more faults.',
  LRU: 'Least Recently Used: Replaces the page that has not been used for the longest period of time. Great performance but higher overhead.',
  Optimal: 'Belady\'s Optimal Algorithm: Replaces the page that will not be used for the longest time in the future. Impossible to implement in reality, used as a benchmark.',
  SecondChance: 'Clock Algorithm: A FIFO variant that gives pages a "second chance" if they have been referenced recently, combining FIFO speed with LRU-like intelligence.'
}

export default function PageReplacementForm({ algorithm, setAlgorithm }) {
  const referenceString = usePageReplacementStore((s) => s.referenceString)
  const setReferenceString = usePageReplacementStore((s) => s.setReferenceString)
  const frameCount = usePageReplacementStore((s) => s.frameCount)
  const setFrameCount = usePageReplacementStore((s) => s.setFrameCount)

  const [inputStr, setInputStr] = useState(referenceString)

  const handleBlur = () => {
    // Clean up input and limit to 50 pages
    let cleanedArr = inputStr
      .replace(/[^0-9,\s]/g, '')
      .split(/[,\s]+/)
      .filter((s) => s !== '')
      
    if (cleanedArr.length > 50) {
      cleanedArr = cleanedArr.slice(0, 50)
      // Optional: you could add a toast here if you have a toast system
    }
    
    const cleaned = cleanedArr.join(', ')
    setInputStr(cleaned)
    setReferenceString(cleaned)
  }

  return (
    <div className="card p-6 border-t-4 border-t-indigo-500 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent rounded-[5px]">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">Simulation Setup</h2>
          <p className="text-xs text-text-muted">Configure page replacement parameters</p>
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1 flex justify-between">
            <span>Reference String</span>
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              onBlur={handleBlur}
              placeholder="e.g. 7, 0, 1, 2, 0, 3..."
              className="input-field pl-10 w-full font-mono text-sm"
            />
          </div>
          <p className="text-xs text-text-muted mt-1">Comma or space separated integers</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="input-field w-full"
            >
              <option value="FIFO">First-In First-Out (FIFO)</option>
              <option value="LRU">Least Recently Used (LRU)</option>
              <option value="Optimal">Optimal (Belady's)</option>
              <option value="SecondChance">Second Chance (Clock)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Number of Frames
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={frameCount}
              onChange={(e) => setFrameCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="mt-auto pt-4 flex-1 flex flex-col justify-end">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[5px]">
            <p className="text-xs text-indigo-200 leading-relaxed">
              {PAGE_ALGORITHM_DESCS[algorithm]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
