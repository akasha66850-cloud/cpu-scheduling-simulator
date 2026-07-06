import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Layers, BarChart2, Download } from 'lucide-react'
import useMemoryStore from '@/store/useMemoryStore'
import { exportMemoryComparisonToPDF } from '@/utils/exportHelpers'
import { runMemoryAlgorithm } from '@/utils/memoryAlgorithms'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

const ALGORITHMS = [
  { id: 'firstFit', name: 'First Fit' },
  { id: 'bestFit', name: 'Best Fit' },
  { id: 'worstFit', name: 'Worst Fit' },
  { id: 'nextFit', name: 'Next Fit' },
]

export default function MemoryComparison() {
  const blocks = useMemoryStore(s => s.blocks)
  const processes = useMemoryStore(s => s.processes)

  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const runComparison = async () => {
    setIsRunning(true)
    try {
      const res = await Promise.all(ALGORITHMS.map(async alg => {
        const payload = {
          algorithm: alg.id,
          blocks,
          processes
        }
        const out = await runMemoryAlgorithm(payload)
        return {
          id: alg.id,
          name: alg.name,
          ...out.metrics
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

  // Find best values
  const bestVals = useMemo(() => {
    if (!results) return {}
    return {
      successRate: Math.max(...results.map(r => r.successRate)),
      memoryUtilization: Math.max(...results.map(r => r.memoryUtilization)),
      internalFragmentation: Math.min(...results.map(r => r.internalFragmentation)),
      avgSearchSteps: Math.min(...results.map(r => r.avgSearchSteps)),
    }
  }, [results])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent rounded-[8px]"><Layers className="w-6 h-6 text-accent" /></div>
            Algorithm Comparison
          </h1>
          <p className="mt-2 text-text-muted text-sm">
            Run all memory algorithms simultaneously on the same inputs to compare metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={() => exportMemoryComparisonToPDF(results, blocks, processes)}
              className="btn-secondary px-6 py-3 text-base flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          )}
          <button
            onClick={runComparison}
            disabled={blocks.length === 0 || processes.length === 0 || isRunning}
            className="btn-primary px-6 py-3 text-base flex items-center gap-2 shadow-glow"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Running...' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="p-8 text-center text-text-muted card">
          Add blocks and processes in the Simulator first.
        </div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="card p-5 overflow-x-auto">
            <h2 className="section-title mb-4"><BarChart2 className="w-4 h-4 text-accent" /> Metrics Breakdown</h2>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border-muted text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 font-semibold px-4">Algorithm</th>
                  <th className="pb-3 font-semibold px-4 text-right">Success Rate</th>
                  <th className="pb-3 font-semibold px-4 text-right">Utilization</th>
                  <th className="pb-3 font-semibold px-4 text-right">Internal Frag</th>
                  <th className="pb-3 font-semibold px-4 text-right">Ext. Frag</th>
                  <th className="pb-3 font-semibold px-4 text-right">Avg Search Steps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {results.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="py-4 px-4 font-semibold text-text-primary">{r.name}</td>
                    <td className={`py-4 px-4 text-right ${r.successRate === bestVals.successRate ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.successRate.toFixed(1)}%
                    </td>
                    <td className={`py-4 px-4 text-right ${r.memoryUtilization === bestVals.memoryUtilization ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.memoryUtilization.toFixed(1)}%
                    </td>
                    <td className={`py-4 px-4 text-right ${r.internalFragmentation === bestVals.internalFragmentation ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.internalFragmentation}
                    </td>
                    <td className="py-4 px-4 text-right text-text-secondary">{r.externalFragmentation}</td>
                    <td className={`py-4 px-4 text-right ${r.avgSearchSteps === bestVals.avgSearchSteps ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.avgSearchSteps.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div id="memory-comparison-charts" className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5 h-80">
              <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Success Rate (%)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.successRate === bestVals.successRate ? '#10b981' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 h-80">
              <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Internal Fragmentation (units)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="internalFragmentation" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.internalFragmentation === bestVals.internalFragmentation ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
