import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function PageFramesVisualization({ frames, frameCount, currentPage, isHit, evictedPage }) {
  // Pad the frames array to match frameCount length for consistent UI
  const paddedFrames = Array.from({ length: frameCount }, (_, i) => frames[i] !== undefined ? frames[i] : null)

  return (
    <div className="card p-6 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-text-muted">
        <LayoutGrid className="w-5 h-5" />
        <span className="font-semibold text-sm">Physical Memory Frames</span>
      </div>

      {currentPage !== null && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Request:</span>
            <span className="w-8 h-8 rounded-[5px] bg-accent border border-accent flex items-center justify-center font-mono font-bold text-indigo-300">
              {currentPage}
            </span>
          </div>
          {isHit ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-green text-green text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Hit
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-red text-sm font-semibold">
              <AlertCircle className="w-4 h-4" /> Fault
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 mt-8 flex-wrap justify-center">
        <AnimatePresence mode="popLayout">
          {paddedFrames.map((page, index) => {
            const isNewlyLoaded = !isHit && page === currentPage && page !== null
            const isHitFrame = isHit && page === currentPage && page !== null

            return (
              <motion.div
                key={`frame-${index}-${page}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  boxShadow: isNewlyLoaded ? '0 0 20px rgba(244, 63, 94, 0.4)' : isHitFrame ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                  borderColor: isNewlyLoaded ? '#f43f5e' : isHitFrame ? '#10b981' : '#334155'
                }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`w-20 h-24 rounded-[8px] border-2 flex flex-col items-center justify-center relative bg-elevated`}
              >
                <span className="absolute top-2 left-2 text-[10px] text-text-muted font-mono">F{index}</span>
                {page !== null ? (
                  <span className={`text-3xl font-mono font-bold ${isNewlyLoaded ? 'text-red' : isHitFrame ? 'text-green' : 'text-text-primary'}`}>
                    {page}
                  </span>
                ) : (
                  <span className="text-text-muted">-</span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {evictedPage !== null && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 flex items-center gap-2 text-red text-sm bg-rose-500/10 px-4 py-2 rounded-[5px] border border-rose-500/20"
          >
            Evicted Page: <span className="font-mono font-bold text-rose-300">{evictedPage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
