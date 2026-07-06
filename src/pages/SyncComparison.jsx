import React, { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import useSyncStore from '@/store/useSyncStore'
import { runSyncAlgorithm } from '@/utils/syncAlgorithms'
import { exportSyncComparisonToPDF } from '@/utils/exportHelpers'

export default function SyncComparison() {
  const { params } = useSyncStore()
  const [results, setResults] = useState([])
  const [isCalculating, setIsCalculating] = useState(false)

  const handleRunAll = async () => {
    setIsCalculating(true)
    try {
      const problems = [
        { id: 'mutex', name: 'Mutex' },
        { id: 'semaphore', name: 'Semaphore' },
        { id: 'producer_consumer', name: 'Prod/Cons' },
        { id: 'reader_writer', name: 'Read/Write' },
        { id: 'dining', name: 'Dining Phils' }
      ]

      const promises = problems.map(async p => {
        const res = await runSyncAlgorithm({ problem: p.id, ...params })
        return {
          name: p.name,
          throughput: res.throughput || 0,
          avgWait: res.avg_wait || 0,
          starvationIndex: res.starvation_index || 1,
          contextSwitches: res.context_switches || 0,
          cpuUtil: res.cpu_util || 0
        }
      })

      const completed = await Promise.all(promises)
      setResults(completed)
    } catch (err) {
      console.error(err)
      alert("Error calculating comparison")
    } finally {
      setIsCalculating(false)
    }
  }

  const exportPDF = () => {
      exportSyncComparisonToPDF(results, params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Sync <span className="text-accent">Comparison</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Compare throughput and wait times across different synchronization algorithms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportPDF} disabled={results.length === 0} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
            Export PDF
          </button>
          <button onClick={handleRunAll} disabled={isCalculating} className="btn-primary px-6 py-2.5 text-base flex items-center gap-2 shadow-glow disabled:opacity-50">
            <Play className="w-5 h-5" /> {isCalculating ? 'Simulating...' : 'Run All Algorithms'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl space-y-8" id="comparison-content">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                <YAxis yAxisId="left" stroke="var(--border)" tick={{fill: '#94a3b8'}} label={{ value: 'Ops/sec', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--border)" tick={{fill: '#94a3b8'}} label={{ value: 'Avg Wait (ms)', angle: 90, position: 'insideRight', fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="throughput" name="Throughput (Ops/sec)" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgWait" name="Avg Wait (ms)" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">Algorithm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">Throughput (Ops/s)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">Avg Wait (ms)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">Starvation Index</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">Ctx Switches</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-base">CPU Util %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-surface">
                {results.map((r, i) => {
                   const bestThroughput = Math.max(...results.map(res => res.throughput))
                   const bestWait = Math.min(...results.map(res => res.avgWait))
                   return (
                     <tr key={i} className="hover:bg-elevated transition-colors">
                       <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{r.name}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                          {r.throughput.toFixed(1)} {r.throughput === bestThroughput && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-green">Best</span>}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                          {r.avgWait.toFixed(1)} {r.avgWait === bestWait && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-green">Best</span>}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{r.starvationIndex.toFixed(2)}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{r.contextSwitches}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{r.cpuUtil.toFixed(1)}%</td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
