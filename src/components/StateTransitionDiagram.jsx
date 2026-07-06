import React from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const STATES = ['New', 'Ready', 'Running', 'Waiting', 'Terminated']

/**
 * Determine the current state of a process based on simulation context.
 */
function getProcessState(pid, currentBlock, processResults, currentTime) {
  if (!currentBlock) return 'New'

  const result = processResults?.find((r) => r.pid === pid)
  if (!result) return 'New'

  if (currentTime >= result.completionTime) return 'Terminated'
  if (currentBlock.pid === pid) return 'Running'

  const arrived = result.arrivalTime <= currentTime
  if (!arrived) return 'New'

  return 'Ready'
}

const stateColors = {
  New: 'border-border-muted text-text-muted',
  Ready: 'border-orange text-orange bg-amber-500/10',
  Running: 'border-green text-green bg-emerald-500/10 shadow-glow',
  Waiting: 'border-red text-red bg-red-500/10',
  Terminated: 'border-border-muted text-text-muted bg-elevated',
}

export default function StateTransitionDiagram({ pid, ganttData, processResults, stepIndex }) {
  if (!pid || !ganttData || !processResults) return null

  const currentBlock = ganttData[stepIndex - 1] || null
  const currentTime = currentBlock?.end ?? 0
  const currentState = getProcessState(pid, currentBlock, processResults, currentTime)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATES.map((state, i) => (
        <React.Fragment key={state}>
          <motion.div
            animate={{
              scale: currentState === state ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold transition-all duration-300 ${
              currentState === state ? stateColors[state] : 'border-border-muted text-text-muted'
            }`}
          >
            {state}
          </motion.div>
          {i < STATES.length - 1 && (
            <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
