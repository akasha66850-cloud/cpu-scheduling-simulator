import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Square, Route, CornerUpLeft, Milestone } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'

export default function DiskStepView() {
  const { results, stepIndex, isStepMode, stepForward, stepBackward, setResults } = useDiskStore()

  if (!results || !isStepMode) return null

  const steps = results.steps || []
  if (steps.length === 0) return null

  const currentStep = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  return (
    <div className="card p-6 border-accent">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title !mb-0 flex items-center gap-2">
          <Play className="w-5 h-5 text-accent" />
          Step-by-Step Analysis
        </h2>
        
        <div className="flex items-center gap-2 bg-surface rounded-[5px] p-1 border border-border">
          <button
            onClick={stepBackward}
            disabled={isFirst}
            className="p-2 rounded-md hover:bg-elevated text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 text-sm font-mono text-indigo-300 font-bold min-w-[80px] text-center">
            {stepIndex + 1} / {steps.length}
          </div>
          <button
            onClick={stepForward}
            disabled={isLast}
            className="p-2 rounded-md hover:bg-elevated text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-elevated mx-1"></div>
          <button
            onClick={() => setResults(null, false)}
            className="p-2 rounded-md hover:bg-elevated text-red transition-colors"
            title="Stop Step Mode"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-surface rounded-[8px] p-5 border border-border-muted"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1">
              {currentStep.type === 'boundary' || currentStep.type === 'jump' ? (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-orange">
                  <CornerUpLeft className="w-4 h-4 text-orange" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-accent">
                  <Route className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 bg-base px-3 py-2 rounded-[5px] border border-border">
                  <span className="text-xs text-text-muted">From</span>
                  <span className="text-lg font-mono text-text-primary">{currentStep.current}</span>
                </div>
                <div className="text-text-muted">→</div>
                <div className="flex items-center gap-2 bg-base px-3 py-2 rounded-[5px] border border-border">
                  <span className="text-xs text-text-muted">To</span>
                  <span className="text-lg font-mono text-indigo-300">{currentStep.next}</span>
                </div>
                
                <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-[5px] border border-green">
                  <span className="text-xs text-emerald-500/70">Distance</span>
                  <span className="text-lg font-mono text-green">+{currentStep.distance}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Queue Remaining</span>
                {currentStep.queueRemaining.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentStep.queueRemaining.map((req, j) => (
                      <div key={j} className="px-2 py-1 rounded bg-elevated text-text-secondary font-mono text-xs border border-border-muted">
                        {req}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green flex items-center gap-2">
                    <Milestone className="w-4 h-4" /> Queue Empty! All requests served.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
