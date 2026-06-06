import React from 'react'
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, Play, Square } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { getPIDColor } from './GanttChart'
import { motion } from 'framer-motion'

export default function StepModeControls() {
  const ganttData = useSchedulerStore((s) => s.ganttData)
  const stepIndex = useSchedulerStore((s) => s.stepIndex)
  const stepForward = useSchedulerStore((s) => s.stepForward)
  const stepBackward = useSchedulerStore((s) => s.stepBackward)
  const results = useSchedulerStore((s) => s.results)
  const processes = useSchedulerStore((s) => s.processes)

  if (!results || ganttData.length === 0) return null

  const totalBlocks = ganttData.length
  const currentBlock = ganttData[stepIndex - 1] || null
  const currentTime = currentBlock ? currentBlock.end : 0

  // Which processes are in the ready queue at currentTime
  const runningPid = currentBlock?.pid
  const readyQueue = processes.filter((p) => {
    if (!currentBlock) return false
    if (p.id === runningPid) return false
    const arrived = p.arrivalTime <= currentTime
    const notDone = !results.processResults.find(
      (r) => r.pid === p.id && r.completionTime <= currentTime
    )
    return arrived && notDone
  })

  return (
    <div className="card p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 justify-center">
        <button
          onClick={() => useSchedulerStore.getState().setStepMode && useSchedulerStore.setState({ stepIndex: 0 })}
          className="btn-secondary p-2"
          title="Reset to start"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={stepBackward}
          className="btn-secondary p-2"
          disabled={stepIndex <= 0}
          title="Step backward"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Progress indicator */}
        <div className="flex-1 mx-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Step {stepIndex} / {totalBlocks}</span>
            <span className="font-mono">t = {currentTime}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${(stepIndex / totalBlocks) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        <button
          onClick={stepForward}
          className="btn-secondary p-2"
          disabled={stepIndex >= totalBlocks}
          title="Step forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => useSchedulerStore.setState({ stepIndex: totalBlocks })}
          className="btn-secondary p-2"
          title="Jump to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Current state */}
      <div className="grid grid-cols-2 gap-3">
        {/* Running process */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Running Now</p>
          {currentBlock ? (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: getPIDColor(currentBlock.pid) }}
              />
              <span className="font-mono font-bold text-white">{currentBlock.pid}</span>
              <span className="text-xs text-slate-400">
                [{currentBlock.start} → {currentBlock.end}]
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Not started</span>
          )}
        </div>

        {/* Ready queue */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Ready Queue ({readyQueue.length})</p>
          <div className="flex flex-wrap gap-1">
            {readyQueue.length === 0 ? (
              <span className="text-slate-500 text-xs">Empty</span>
            ) : (
              readyQueue.map((p) => (
                <span
                  key={p.id}
                  className="font-mono text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: getPIDColor(p.id) + '60',
                    color: getPIDColor(p.id),
                    backgroundColor: getPIDColor(p.id) + '15',
                  }}
                >
                  {p.id}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
