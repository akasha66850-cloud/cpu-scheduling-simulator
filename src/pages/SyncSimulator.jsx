import React, { useEffect } from 'react'
import { RotateCcw, Play } from 'lucide-react'
import useSyncStore from '@/store/useSyncStore'

import SyncInput from '@/components/sync/SyncInput'
import SyncVisualizer from '@/components/sync/SyncVisualizer'
import SyncMetrics from '@/components/sync/SyncMetrics'
import SyncStepView from '@/components/sync/SyncStepView'

export default function SyncSimulator() {
  const { clearAll, runSimulation, isRunning, activeProblem } = useSyncStore()

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName.toLowerCase() === 'input') return

      if (e.key.toLowerCase() === 'y') {
        e.preventDefault()
        runSimulation()
      }
      if (e.key === 'ArrowRight') {
        useSyncStore.getState().stepForward()
      }
      if (e.key === 'ArrowLeft') {
        useSyncStore.getState().stepBackward()
      }
      if (e.key.toLowerCase() === 'w') {
         useSyncStore.getState().togglePreference()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runSimulation])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Process <span className="text-accent">Synchronization</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Simulate classical IPC problems. High-performance simulation engines running completely client-side in native JavaScript.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={clearAll} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
          <button onClick={runSimulation} disabled={isRunning} className="btn-primary px-6 py-2.5 text-base flex items-center gap-2 shadow-glow disabled:opacity-50">
            <Play className="w-5 h-5" /> {isRunning ? 'Running...' : 'Run Simulation (Y)'}
          </button>
        </div>
      </div>

      <SyncInput />

      <SyncMetrics />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SyncVisualizer />
        </div>
        
        <div className="space-y-6">
          <SyncStepView />
        </div>
      </div>
      
    </div>
  )
}
