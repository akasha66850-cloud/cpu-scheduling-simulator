import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Layers, BarChart2, Download } from 'lucide-react'
import usePageReplacementStore from '@/store/usePageReplacementStore'
import { runPageAlgorithm } from '@/utils/pageAlgorithms'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { exportPageReplacementComparisonToPDF } from '@/utils/exportHelpers'

const ALGORITHMS = [
  { id: 'FIFO', name: 'First-In First-Out' },
  { id: 'LRU', name: 'Least Recently Used' },
  { id: 'Optimal', name: 'Optimal (Belady)' },
  { id: 'SecondChance', name: 'Second Chance' },
]

export default function PageReplacementComparison() {
  const referenceString = usePageReplacementStore(s => s.referenceString)
  const frameCount = usePageReplacementStore(s => s.frameCount)

  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const runComparison = async () => {
    if (!referenceString) return
    setIsRunning(true)
    try {
      const res = await Promise.all(ALGORITHMS.map(async alg => {
        const payload = {
          algorithm: alg.id,
          referenceString,
          frameCount
        }
        const out = await runPageAlgorithm(payload)
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
      faultRate: Math.min(...results.map(r => r.faultRate)),
      hitRate: Math.max(...results.map(r => r.hitRate)),
    }
  }, [results])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent rounded-[8px]"><Layers className="w-6 h-6 text-accent" /></div>
            PR Algorithm Comparison
          </h1>
          <p className="mt-2 text-text-muted text-sm">
            Run all page replacement algorithms simultaneously to compare metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={() => exportPageReplacementComparisonToPDF(results, referenceString, frameCount)}
              className="btn-secondary px-6 py-3 text-base flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          )}
          <button
            onClick={runComparison}
            disabled={!referenceString || isRunning}
            className="btn-primary px-6 py-3 text-base flex items-center gap-2 shadow-glow"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Running...' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {!referenceString && (
        <div className="p-8 text-center text-text-muted card">
          Add a reference string in the Simulator first.
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
                  <th className="pb-3 font-semibold px-4 text-right">Page Faults</th>
                  <th className="pb-3 font-semibold px-4 text-right">Page Hits</th>
                  <th className="pb-3 font-semibold px-4 text-right">Fault Rate</th>
                  <th className="pb-3 font-semibold px-4 text-right">Hit Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {results.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="py-4 px-4 font-semibold text-text-primary">{r.name}</td>
                    <td className={`py-4 px-4 text-right ${r.faultRate === bestVals.faultRate ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.pageFaults}
                    </td>
                    <td className={`py-4 px-4 text-right ${r.hitRate === bestVals.hitRate ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.pageHits}
                    </td>
                    <td className={`py-4 px-4 text-right ${r.faultRate === bestVals.faultRate ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.faultRate.toFixed(1)}%
                    </td>
                    <td className={`py-4 px-4 text-right ${r.hitRate === bestVals.hitRate ? 'text-green font-bold' : 'text-text-secondary'}`}>
                      {r.hitRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div id="pr-comparison-charts" className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5 h-80">
              <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Page Fault Rate (%) - Lower is Better</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="faultRate" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.faultRate === bestVals.faultRate ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 h-80">
              <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Page Hit Rate (%) - Higher is Better</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="hitRate" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hitRate === bestVals.hitRate ? '#10b981' : '#6366f1'} />
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
