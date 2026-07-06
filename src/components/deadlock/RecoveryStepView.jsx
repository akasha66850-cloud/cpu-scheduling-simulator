import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Square, Info } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'

export default function RecoveryStepView() {
  const { results, stepIndex, isStepMode, stepForward, stepBackward, setResults } = useDeadlockStore()

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
              {currentStep.type === 'violation' || currentStep.type === 'unsafe' || currentStep.isDeadlocked ? (
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <span className="text-red font-bold">!</span>
                </div>
              ) : currentStep.type === 'result' && !currentStep.isDeadlocked ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-green">
                  <span className="text-green font-bold">✓</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-accent">
                  <Info className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-lg text-text-primary mb-4">{currentStep.message}</p>
              
              {/* Contextual matrices depending on algorithm type */}
              {currentStep.work && (
                <div className="bg-base rounded-[5px] p-4 border border-border inline-block">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Available (Work)</span>
                  <div className="flex gap-2">
                    {currentStep.work.map((w, j) => (
                      <div key={j} className="w-8 h-8 rounded bg-accent border border-accent flex items-center justify-center text-sm font-mono text-indigo-300">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
