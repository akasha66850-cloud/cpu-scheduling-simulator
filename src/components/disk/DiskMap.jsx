import React from 'react'
import { motion } from 'framer-motion'
import useDiskStore from '@/store/useDiskStore'

export default function DiskMap() {
  const { diskSize, results, stepIndex, requestQueueInput, initialHead } = useDiskStore()

  // Parse original queue to know all the target cylinders
  const allRequests = Array.from(new Set(requestQueueInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n < diskSize)))

  // Determine current position and served requests
  let currentHead = initialHead
  let servedRequests = []

  if (results && results.steps && results.steps.length > 0) {
    const currentStep = results.steps[stepIndex]
    // The head's current position to draw
    currentHead = currentStep.current
    
    // Any request not in the remaining queue is considered served
    const remainingQueue = currentStep.queueRemaining || []
    servedRequests = allRequests.filter(req => !remainingQueue.includes(req) && req !== currentStep.next)
    
    // If the step itself just served something (i.e. we are at the target), we can optionally mark it served
    if (remainingQueue.length === 0 && stepIndex === results.steps.length - 1) {
      servedRequests = allRequests
      currentHead = currentStep.next
    }
  }

  // Calculate percentage positions for CSS
  const getLeftPct = (cylinder) => `${(cylinder / (diskSize - 1)) * 100}%`

  return (
    <div className="card p-6 overflow-hidden">
      <div className="flex justify-between text-xs text-text-muted font-mono mb-8">
        <span>0</span>
        <span>{diskSize - 1}</span>
      </div>

      <div className="relative h-4 bg-surface rounded-full border border-border-muted w-full mb-8">
        {/* Render request dots */}
        {allRequests.map((req, i) => {
          const isServed = servedRequests.includes(req)
          return (
            <motion.div
              key={`req-${req}-${i}`}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full -ml-1.5 z-10 transition-colors duration-300 ${
                isServed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              }`}
              style={{ left: getLeftPct(req) }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-text-muted font-mono">
                {req}
              </div>
            </motion.div>
          )
        })}

        {/* Render read/write head */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -ml-2 z-20 flex flex-col items-center"
          animate={{ left: getLeftPct(currentHead) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div className="w-4 h-8 bg-accent rounded shadow-[0_0_15px_rgba(99,102,241,0.8)] border-2 border-white flex items-center justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
          <div className="mt-1 bg-accent text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono border border-accent whitespace-nowrap">
            Head: {currentHead}
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center gap-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent border border-white"></div> Read/Write Head
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div> Pending Request
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Served Request
        </div>
      </div>
    </div>
  )
}
