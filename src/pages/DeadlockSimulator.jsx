import React from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'

import DeadlockInput from '@/components/deadlock/DeadlockInput'
import BankersMatrix from '@/components/deadlock/BankersMatrix'
import RAGVisualizer from '@/components/deadlock/RAGVisualizer'
import RecoveryStepView from '@/components/deadlock/RecoveryStepView'
import CoffmanPanel from '@/components/deadlock/CoffmanPanel'
import DeadlockMetrics from '@/components/deadlock/DeadlockMetrics'

import { runDeadlockAlgorithm } from '@/utils/deadlockAlgorithms'
import useSettingsStore from '@/store/useSettingsStore'

export default function DeadlockSimulator() {
  const { 
    allocation, maxDemand, available, activeStrategy,
    results,
    setResults, resetSimulation, resetAll 
  } = useDeadlockStore()

  const handleRun = () => {
    resetSimulation()
    setTimeout(async () => {
      let res = null
      
      const needMatrix = maxDemand.map((row, i) => 
        row.map((maxVal, j) => Math.max(0, maxVal - allocation[i][j]))
      )

      try {
        let action = activeStrategy
        if (action === 'bankers') action = 'checkSafety'
        else if (action === 'detection') action = 'runDetection'
        else if (action === 'recoveryA') action = 'runRecoveryTerminate'
        else if (action === 'recoveryB') action = 'runRecoveryPreempt'
        else if (action === 'preventionHoldWait') action = 'runPreventionHoldWait'
        else if (action === 'preventionCircWait') action = 'runPreventionCircularWait'

        const payload = {
          action: action,
          allocation: allocation,
          maxDemand: maxDemand,
          request: needMatrix,
          available: available
        }
        res = await runDeadlockAlgorithm(payload)
      } catch (err) {
        console.error("Failed to execute Deadlock algorithm", err)
        alert("Failed to execute Deadlock algorithm. Check console.")
        return
      }

      if (res) {
        setResults(res, true) // start in step mode by default
      }
    }, 50)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Deadlock <span className="text-accent">Handling</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Visualize Banker's Algorithm, Resource Allocation Graphs (RAG), and various deadlock detection, recovery, and prevention strategies.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={resetAll} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
          <button onClick={handleRun} className="btn-primary px-6 py-2.5 text-base flex items-center gap-2 shadow-glow">
            <Play className="w-5 h-5" /> Run Simulation
          </button>
        </div>
      </div>

      <DeadlockInput />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {useSettingsStore.getState().showDeadlockAlerts && results?.metrics?.isDeadlocked && (
            <div className="deadlock-banner bg-rose-500/10 border border-rose-500/50 text-red px-4 py-3 rounded-[8px] flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              🔴 Deadlock detected in current state
            </div>
          )}
          <DeadlockMetrics />
          {activeStrategy === 'bankers' ? <BankersMatrix /> : <RAGVisualizer />}
          <RecoveryStepView />
        </div>
        
        <div className="space-y-6">
          <CoffmanPanel />
        </div>
      </div>
      
    </div>
  )
}
