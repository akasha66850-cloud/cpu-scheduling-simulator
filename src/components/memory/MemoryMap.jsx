import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useMemoryStore from '@/store/useMemoryStore'

export default function MemoryMap({ blocks, processes, stepIndex, isStepMode }) {
  if (!blocks || blocks.length === 0) return null

  const totalMemory = blocks.reduce((sum, b) => sum + (b.initialSize || b.size), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 w-full h-24 rounded-[5px] overflow-hidden border border-border-muted bg-surface p-2 shadow-inner">
        <AnimatePresence>
          {blocks.map((b, i) => {
            const widthPct = ((b.initialSize || b.size) / totalMemory) * 100
            const isAllocated = b.isAllocated
            const proc = isAllocated ? processes.find(p => p.id === b.processId) : null
            const color = proc ? proc.color : '#334155'
            
            // Calculate filled vs empty percentage within this block
            const usedPct = isAllocated && proc ? (proc.size / (b.initialSize || b.size)) * 100 : 0
            const freePct = 100 - usedPct

            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative rounded overflow-hidden flex flex-col justify-between"
                style={{
                  width: `calc(${widthPct}% - 8px)`,
                  minWidth: '40px',
                  backgroundColor: '#1e293b',
                  border: `1px solid ${isAllocated ? color + '80' : '#47556950'}`,
                }}
              >
                {/* Background fill */}
                <motion.div
                  initial={false}
                  animate={{ height: `${usedPct}%` }}
                  transition={{ duration: 0.4 }}
                  className="absolute bottom-0 left-0 right-0 opacity-20"
                  style={{ backgroundColor: color }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <span className="font-mono text-xs font-bold text-text-primary z-10">{b.id}</span>
                  <span className="text-[10px] text-text-muted z-10">{b.initialSize || b.size}u</span>
                </div>

                {isAllocated && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-between p-1 z-20 pointer-events-none"
                  >
                    <div className="w-full flex justify-end">
                      <span className="text-[9px] font-bold px-1 rounded bg-black/40 text-text-primary" style={{ color: color }}>
                        {b.processId}
                      </span>
                    </div>
                    {b.internalFrag > 0 && (
                      <div className="w-full flex justify-center pb-0.5">
                        <span className="text-[8px] text-red-300 bg-red-900/40 px-1 rounded" title="Internal Fragmentation">
                          IF: {b.internalFrag}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {!isAllocated && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1 z-10 pointer-events-none">
                    <span className="text-[9px] text-green bg-emerald-900/20 px-1 rounded">FREE</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted justify-center">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-elevated border border-border-muted rounded-sm" /> Free Block</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-accent border border-accent rounded-sm" /> Allocated Process</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-900/40 rounded-sm" /> Internal Fragmentation</div>
      </div>
    </div>
  )
}
