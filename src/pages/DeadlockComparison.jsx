import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Layers, BarChart2, Download } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'
import { runDeadlockAlgorithm } from '@/utils/deadlockAlgorithms'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { exportDeadlockComparisonToPDF } from '@/utils/exportHelpers'

const STRATEGIES = [
  { id: 'checkSafety', name: "Banker's Avoidance" },
  { id: 'runDetection', name: 'Detection (RAG)' },
  { id: 'runRecoveryTerminate', name: 'Recovery (Terminate)' },
  { id: 'runRecoveryPreempt', name: 'Recovery (Preempt)' },
  { id: 'runPreventionHoldWait', name: 'Prevention (H&W)' },
  { id: 'runPreventionCircularWait', name: 'Prevention (Circ)' },
]

export default function DeadlockComparison() {
  const { allocation, maxDemand, available } = useDeadlockStore()

  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const runComparison = async () => {
    setIsRunning(true)
    try {
      const needMatrix = maxDemand.map((row, i) => 
        row.map((maxVal, j) => Math.max(0, maxVal - allocation[i][j]))
      )

      const res = await Promise.all(STRATEGIES.map(async strat => {
        const payload = {
          action: strat.id,
          allocation,
          maxDemand,
          request: needMatrix,
          available
        }
        const out = await runDeadlockAlgorithm(payload)
        
        // Normalize metrics for chart
        let overhead = out.metrics?.overhead || 0
        let safety = out.metrics?.safetyGuarantee || 0
        let starvation = out.metrics?.starvationRisk || 0
        
        // Custom defaults if algo doesn't return them
        if (strat.id === 'checkSafety') { overhead = 60; safety = 100; starvation = 10; }
        if (strat.id === 'runDetection') { overhead = 30; safety = 0; starvation = 0; }

        return {
          id: strat.id,
          name: strat.name,
          overhead,
          safety,
          starvation
        }
      }))
      setResults(res)
    } catch (err) {
      console.error("Comparison failed", err)
      alert("Failed to run comparison")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent rounded-[8px]"><Layers className="w-6 h-6 text-accent" /></div>
            Deadlock Strategies Comparison
          </h1>
          <p className="mt-2 text-text-muted text-sm">
            Run all deadlock handling strategies simultaneously to compare trade-offs.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={() => exportDeadlockComparisonToPDF(results)}
              className="btn-secondary px-6 py-3 text-base flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          )}
          <button
            onClick={runComparison}
            disabled={isRunning}
            className="btn-primary px-6 py-3 text-base flex items-center gap-2 shadow-glow"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Running...' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {!results && (
        <div className="p-8 text-center text-text-muted card">
          Click "Run Comparison" to analyze current system state.
        </div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="card p-5 overflow-x-auto">
            <h2 className="section-title mb-4"><BarChart2 className="w-4 h-4 text-accent" /> Trade-off Matrix</h2>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border-muted text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 font-semibold px-4">Strategy</th>
                  <th className="pb-3 font-semibold px-4 text-right">Overhead Cost</th>
                  <th className="pb-3 font-semibold px-4 text-right">Safety Guarantee (%)</th>
                  <th className="pb-3 font-semibold px-4 text-right">Starvation Risk (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {results.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="py-4 px-4 font-semibold text-text-primary">{r.name}</td>
                    <td className={`py-4 px-4 text-right text-orange`}>{r.overhead}</td>
                    <td className={`py-4 px-4 text-right text-green`}>{r.safety}%</td>
                    <td className={`py-4 px-4 text-right text-red`}>{r.starvation}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div id="deadlock-comparison-charts" className="card p-5 h-96">
            <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Overhead vs Safety vs Starvation</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="overhead" name="Overhead" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="safety" name="Safety Guarantee (%)" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="starvation" name="Starvation Risk (%)" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  )
}
