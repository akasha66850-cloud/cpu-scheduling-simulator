import React from 'react'
import { motion } from 'framer-motion'
import { Settings2, Database, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'

export const DISK_ALGORITHMS = [
  { id: 'fcfs', label: 'FCFS', desc: 'First-Come, First-Served: Requests are processed in exact arrival order. Simple, but can cause wild head swings.' },
  { id: 'sstf', label: 'SSTF', desc: 'Shortest Seek Time First: Selects the pending request closest to the current head position. Reduces head movement but can cause starvation.' },
  { id: 'scan', label: 'SCAN', desc: 'Elevator Algorithm: Head sweeps from one end of the disk to the other, servicing requests along the way.' },
  { id: 'cscan', label: 'C-SCAN', desc: 'Circular SCAN: Sweeps in one direction, then immediately returns to the beginning without servicing requests on the return trip. More uniform wait times.' },
  { id: 'look', label: 'LOOK', desc: 'Like SCAN, but the head reverses direction immediately after servicing the last request in that direction, without going all the way to the edge.' },
  { id: 'clook', label: 'C-LOOK', desc: 'Like C-SCAN, but the head returns to the first request instead of the absolute edge of the disk.' }
]

export default function DiskInput() {
  const {
    requestQueueInput, initialHead, diskSize, direction, activeAlgorithm,
    setRequestQueueInput, setInitialHead, setDiskSize, setDirection, setActiveAlgorithm
  } = useDiskStore()

  // Validation
  const queueArray = requestQueueInput.trim().split(/\s+/).map(Number)
  const isValidQueue = queueArray.every(n => !isNaN(n) && n >= 0 && n < diskSize)
  const isHeadValid = initialHead >= 0 && initialHead < diskSize
  const hasErrors = !isValidQueue || !isHeadValid

  const handleQueueBlur = () => {
    let arr = requestQueueInput.trim().split(/\s+/)
    if (arr.length > 50) {
      arr = arr.slice(0, 50)
      setRequestQueueInput(arr.join(' '))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Dimensions & Head */}
        <div className="card p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
            <Settings2 className="w-4 h-4 text-accent" />
            Disk Parameters
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Disk Size (Total Cylinders)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={diskSize}
                onChange={(e) => setDiskSize(Math.min(500, Math.max(10, parseInt(e.target.value) || 200)))}
                className="w-full bg-surface border border-border-muted rounded px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Initial Head Position</label>
              <input
                type="number"
                min="0"
                max={diskSize - 1}
                value={initialHead}
                onChange={(e) => setInitialHead(parseInt(e.target.value) || 0)}
                className={`w-full bg-surface border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${
                  !isHeadValid ? 'border-rose-500 focus:border-rose-400 text-red' : 'border-border-muted focus:border-accent'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Queue Input */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Database className="w-4 h-4 text-accent" />
              Request Queue
            </label>
            <span className="text-xs text-text-muted">Space-separated cylinder numbers</span>
          </div>
          
          <textarea
            value={requestQueueInput}
            onChange={(e) => setRequestQueueInput(e.target.value)}
            onBlur={handleQueueBlur}
            className={`w-full h-24 bg-surface border rounded-[5px] p-3 text-sm font-mono focus:outline-none transition-colors ${
              !isValidQueue ? 'border-rose-500 focus:border-rose-400 text-red' : 'border-border-muted focus:border-accent'
            }`}
            placeholder="e.g. 82 170 43 140"
          />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-2">Algorithm</label>
              <div className="flex flex-wrap gap-2">
                {DISK_ALGORITHMS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAlgorithm(a.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeAlgorithm === a.id 
                        ? 'bg-accent text-text-primary shadow-md shadow-indigo-500/20' 
                        : 'bg-elevated text-text-muted hover:bg-overlay hover:text-text-primary'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[5px]">
              <p className="text-xs text-indigo-200 leading-relaxed">
                {DISK_ALGORITHMS.find(a => a.id === activeAlgorithm)?.desc}
              </p>
            </div>

            {/* Direction Toggle (Only for SCAN/LOOK variants) */}
            {['scan', 'cscan', 'look', 'clook'].includes(activeAlgorithm) && (
              <div>
                <label className="block text-xs text-text-muted mb-2">Initial Direction</label>
                <div className="flex bg-surface rounded-[5px] p-1 border border-border w-fit">
                  <button
                    onClick={() => setDirection('up')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      direction === 'up' ? 'bg-accent text-indigo-300' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3" /> Towards {diskSize - 1}
                  </button>
                  <button
                    onClick={() => setDirection('down')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      direction === 'down' ? 'bg-accent text-indigo-300' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3" /> Towards 0
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {hasErrors && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[5px] flex items-center gap-3 text-red text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Validation Error: All cylinder requests and the initial head must be between 0 and {diskSize - 1}.</p>
        </motion.div>
      )}
    </div>
  )
}
