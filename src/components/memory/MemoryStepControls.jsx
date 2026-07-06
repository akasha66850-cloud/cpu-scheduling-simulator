import React, { useState, useEffect } from 'react'
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, Play, Square } from 'lucide-react'
import useMemoryStore from '@/store/useMemoryStore'
import { motion } from 'framer-motion'

export default function MemoryStepControls() {
  const allocationSteps = useMemoryStore(s => s.allocationSteps)
  const stepIndex = useMemoryStore(s => s.stepIndex)
  const stepForward = useMemoryStore(s => s.stepForward)
  const stepBackward = useMemoryStore(s => s.stepBackward)
  const processes = useMemoryStore(s => s.processes)

  const [isPlaying, setIsPlaying] = useState(false)

  if (!allocationSteps || allocationSteps.length === 0) return null

  const totalSteps = allocationSteps.length

  useEffect(() => {
    let timer
    if (isPlaying) {
      timer = setInterval(() => {
        const state = useMemoryStore.getState()
        if (state.stepIndex < totalSteps) {
          state.stepForward()
        } else {
          setIsPlaying(false)
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isPlaying, totalSteps])

  const currentStep = stepIndex > 0 ? allocationSteps[stepIndex - 1] : null
  const currentProcess = currentStep ? processes.find(p => p.id === currentStep.processId) : null
  
  // Find processes waiting
  const processedIds = allocationSteps.slice(0, stepIndex).map(s => s.processId)
  const waitingProcesses = processes.filter(p => !processedIds.includes(p.id))
  
  // Find failed processes
  const failedIds = allocationSteps.slice(0, stepIndex).filter(s => !s.success).map(s => s.processId)
  const failedProcesses = processes.filter(p => failedIds.includes(p.id))

  return (
    <div className="card p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => useMemoryStore.setState({ stepIndex: 0 })} className="btn-secondary p-2" title="Reset">
          <SkipBack className="w-4 h-4" />
        </button>
        <button onClick={stepBackward} className="btn-secondary p-2" disabled={stepIndex <= 0}>
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 mx-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Allocation {stepIndex} / {totalSteps}</span>
          </div>
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${(stepIndex / totalSteps) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        <button onClick={stepForward} className="btn-secondary p-2" disabled={stepIndex >= totalSteps}>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button onClick={() => setIsPlaying(!isPlaying)} className={`btn-secondary p-2 ${isPlaying ? 'text-green' : ''}`} title={isPlaying ? "Pause" : "Auto Play"}>
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <button onClick={() => useMemoryStore.setState({ stepIndex: totalSteps })} className="btn-secondary p-2" title="Jump to end">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Current State */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-elevated rounded-[5px] p-3 border border-border-muted">
          <p className="text-xs text-text-muted mb-1">Current Action</p>
          {currentStep ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-text-primary">{currentProcess?.id}</span>
              <span className="text-xs text-text-muted">{currentProcess?.size}u →</span>
              {currentStep.success ? (
                <span className="badge badge-emerald text-[10px]">Allocated in {currentStep.blockId}</span>
              ) : (
                <span className="badge badge-rose text-[10px]">Failed</span>
              )}
            </div>
          ) : (
            <span className="text-text-muted text-sm">Not started</span>
          )}
        </div>

        <div className="bg-elevated rounded-[5px] p-3 border border-border-muted">
          <p className="text-xs text-text-muted mb-1">Waiting Queue ({waitingProcesses.length})</p>
          <div className="flex flex-wrap gap-1">
            {waitingProcesses.length === 0 ? <span className="text-text-muted text-xs">Empty</span> : waitingProcesses.map(p => (
              <span key={p.id} className="font-mono text-xs px-2 py-0.5 rounded border" style={{ borderColor: p.color, color: p.color }}>{p.id}</span>
            ))}
          </div>
        </div>

        <div className="bg-elevated rounded-[5px] p-3 border border-border-muted">
          <p className="text-xs text-text-muted mb-1">Failed Processes ({failedProcesses.length})</p>
          <div className="flex flex-wrap gap-1">
            {failedProcesses.length === 0 ? <span className="text-text-muted text-xs">None</span> : failedProcesses.map(p => (
              <span key={p.id} className="font-mono text-xs px-2 py-0.5 rounded border border-rose-500/50 text-red bg-rose-500/10">{p.id}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
