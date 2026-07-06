import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Layers, BarChart2, Download, Trophy } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { exportDiskComparisonToPDF } from '@/utils/exportHelpers'
import { runDiskAlgorithm } from '@/utils/diskAlgorithms'

const STRATEGIES = [
  { id: 'fcfs', name: 'FCFS' },
  { id: 'sstf', name: 'SSTF' },
  { id: 'scan', name: 'SCAN' },
  { id: 'cscan', name: 'C-SCAN' },
  { id: 'look', name: 'LOOK' },
  { id: 'clook', name: 'C-LOOK' },
]

export default function DiskComparison() {
  const { requestQueueInput, initialHead, diskSize, direction } = useDiskStore()
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const runComparison = async () => {
    setIsRunning(true)
    
    try {
      const queueArray = requestQueueInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n < diskSize)
      if (queueArray.length === 0 || initialHead < 0 || initialHead >= diskSize) {
        setIsRunning(false)
        return
      }

      const promises = STRATEGIES.map(async strat => {
        const payload = {
          algorithm: strat.id,
          queue: queueArray,
          head: initialHead,
          diskSize: diskSize,
          direction: direction
        }
        
        const out = await runDiskAlgorithm(payload)
        
        return {
          id: strat.id,
          name: strat.name,
          distance: out.metrics.totalDistance,
          avgResponse: parseFloat(out.metrics.avgResponseTime),
          variance: parseFloat(out.metrics.variance)
        }
      })
      
      const res = await Promise.all(promises)
      setResults(res)
    } catch (err) {
      console.error("Failed to execute Disk algorithm module", err)
      alert("Failed to execute Disk algorithm module. Check console.")
    } finally {
      setIsRunning(false)
    }
  }

  // Find min values for highlighting
  const minDistance = results ? Math.min(...results.map(r => r.distance)) : 0
  const minResponse = results ? Math.min(...results.map(r => r.avgResponse)) : 0
  const minVariance = results ? Math.min(...results.map(r => r.variance)) : 0

  const colors = {
    fcfs: '#6366f1',
    sstf: '#10b981',
    scan: '#f59e0b',
    cscan: '#8b5cf6',
    look: '#ec4899',
    clook: '#0ea5e9'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent rounded-[8px]"><Layers className="w-6 h-6 text-accent" /></div>
            Disk Scheduling Comparison
          </h1>
          <p className="mt-2 text-text-muted text-sm">
            Run all 6 disk scheduling algorithms simultaneously to compare Total Seek Distance.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={() => exportDiskComparisonToPDF(results, { requestQueueInput, initialHead, diskSize, direction })}
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
        <div className="p-8 text-center text-text-muted card flex flex-col items-center gap-2">
          <Trophy className="w-8 h-8 text-text-muted mb-2" />
          <p>Click "Run Comparison" to race the algorithms and find the most efficient schedule.</p>
        </div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-6">
          
          <div className="card p-5 overflow-x-auto">
            <h2 className="section-title mb-4"><BarChart2 className="w-4 h-4 text-accent" /> Metrics Matrix</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-muted text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 font-semibold px-4">Algorithm</th>
                  <th className="pb-3 font-semibold px-4 text-right">Total Distance</th>
                  <th className="pb-3 font-semibold px-4 text-right">Avg Response (ms)</th>
                  <th className="pb-3 font-semibold px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {results.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="py-4 px-4 font-semibold" style={{ color: colors[r.id] }}>{r.name}</td>
                    
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2 py-1 rounded font-mono ${r.distance === minDistance ? 'bg-emerald-500/20 text-green border border-green' : 'text-text-secondary'}`}>
                        {r.distance}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2 py-1 rounded font-mono ${r.avgResponse === minResponse ? 'bg-emerald-500/20 text-green border border-green' : 'text-text-secondary'}`}>
                        {r.avgResponse}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2 py-1 rounded font-mono ${r.variance === minVariance ? 'bg-emerald-500/20 text-green border border-green' : 'text-text-secondary'}`}>
                        {r.variance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div id="disk-comparison-chart" className="card p-5 h-96">
            <h3 className="text-sm font-medium text-text-secondary mb-4 text-center">Total Seek Distance (Lower is Better)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="distance" name="Total Distance" radius={[4, 4, 0, 0]}>
                  {results.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.id] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </motion.div>
      )}
    </div>
  )
}
