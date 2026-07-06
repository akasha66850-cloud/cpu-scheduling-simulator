import React from 'react'
import { RotateCcw, Play } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'

import DiskInput from '@/components/disk/DiskInput'
import DiskMap from '@/components/disk/DiskMap'
import TrajectoryChart from '@/components/disk/TrajectoryChart'
import DiskStepView from '@/components/disk/DiskStepView'
import DiskMetrics from '@/components/disk/DiskMetrics'
import { runDiskAlgorithm } from '@/utils/diskAlgorithms'

export default function DiskSimulator() {
  const { 
    requestQueueInput, initialHead, diskSize, direction, activeAlgorithm,
    results,
    setResults, resetSimulation, resetAll 
  } = useDiskStore()

  const [isCalculating, setIsCalculating] = React.useState(false)

  const handleRun = async () => {
    resetSimulation()
    setIsCalculating(true)
    
    try {
      const queueArray = requestQueueInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n < diskSize)
      if (queueArray.length === 0 || initialHead < 0 || initialHead >= diskSize) {
        setIsCalculating(false)
        return
      }

      const payload = {
        algorithm: activeAlgorithm,
        queue: queueArray,
        head: initialHead,
        diskSize: diskSize,
        direction: direction
      }
      
      const res = await runDiskAlgorithm(payload)
      setResults(res, true)
    } catch (err) {
      console.error("Failed to execute Disk algorithm", err)
      alert("Failed to execute Disk algorithm. See console for details.")
      return
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Disk <span className="text-accent">Scheduling</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Visualize and step through classic disk scheduling algorithms with animated seek trajectories and interactive disk maps.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={resetAll} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
          <button onClick={handleRun} disabled={isCalculating} className="btn-primary px-6 py-2.5 text-base flex items-center gap-2 shadow-glow disabled:opacity-50">
            <Play className="w-5 h-5" /> {isCalculating ? 'Calculating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      <DiskInput />

      <DiskMetrics />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <DiskMap />
          <DiskStepView />
        </div>
        
        <div className="space-y-6">
          <TrajectoryChart />
        </div>
      </div>
      
    </div>
  )
}
