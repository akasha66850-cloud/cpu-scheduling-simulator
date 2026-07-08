import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingDown, Cpu, Award, Loader2, Download } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { exportCPUComparisonToPDF } from '@/utils/exportHelpers'
import ComparisonChart from '@/components/ComparisonChart'
import EmptyState from '@/components/EmptyState'
import { fmt2 } from '@/utils/metrics'
import { runCPUScheduling } from '@/utils/cpuAlgorithms'


// Algorithm labels (for display only — actual execution is server-side)
const ALGO_LABELS = {
  FCFS: 'FCFS', SJF: 'SJF', SRTF: 'SRTF',
  Priority: 'Priority', PriorityPreemptive: 'Pri. Pre.',
  RoundRobin: 'Round Robin', MLQ: 'MLQ', MLFQ: 'MLFQ',
}

const METRICS = [
  { key: 'averageWaitingTime', label: 'Avg Waiting Time', unit: '', lowerIsBetter: true },
  { key: 'averageTurnaroundTime', label: 'Avg Turnaround Time', unit: '', lowerIsBetter: true },
  { key: 'averageResponseTime', label: 'Avg Response Time', unit: '', lowerIsBetter: true },
  { key: 'throughput', label: 'Throughput', unit: '/unit', lowerIsBetter: false },
  { key: 'cpuUtilization', label: 'CPU Util%', unit: '%', lowerIsBetter: false },
]

function getBestAlgo(allResults, metricKey, lowerIsBetter) {
  const vals = allResults.map((r) => r.metrics[metricKey])
  const bestVal = lowerIsBetter ? Math.min(...vals) : Math.max(...vals)
  return allResults.find((r) => r.metrics[metricKey] === bestVal)?.algorithm
}

function generateInsight(allResults) {
  if (allResults.length === 0) return ''
  const minWT = allResults.reduce((a, b) =>
    a.metrics.averageWaitingTime < b.metrics.averageWaitingTime ? a : b
  )
  const maxUtil = allResults.reduce((a, b) =>
    a.metrics.cpuUtilization > b.metrics.cpuUtilization ? a : b
  )
  const minTAT = allResults.reduce((a, b) =>
    a.metrics.averageTurnaroundTime < b.metrics.averageTurnaroundTime ? a : b
  )

  const parts = []
  parts.push(
    `For this process set, **${minWT.algorithm}** achieves the lowest average waiting time (${fmt2(minWT.metrics.averageWaitingTime)} units).`
  )
  if (minTAT.algorithm !== minWT.algorithm) {
    parts.push(
      `**${minTAT.algorithm}** gives the best turnaround time (${fmt2(minTAT.metrics.averageTurnaroundTime)} units).`
    )
  }
  parts.push(
    `**${maxUtil.algorithm}** has the highest CPU utilization at ${fmt2(maxUtil.metrics.cpuUtilization)}%.`
  )
  return parts.join(' ')
}

// Simple markdown-bold renderer
function BoldText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="text-indigo-300">{p}</strong>
          : p
      )}
    </span>
  )
}

const CHART_METRICS = [
  { key: 'averageWaitingTime', label: 'Avg Waiting Time' },
  { key: 'averageTurnaroundTime', label: 'Avg Turnaround Time' },
  { key: 'cpuUtilization', label: 'CPU Utilization (%)' },
  { key: 'averageResponseTime', label: 'Avg Response Time' },
]

export default function Comparison() {
  const processes = useSchedulerStore((s) => s.processes)
  const quantum   = useSchedulerStore((s) => s.quantum)
  const agingEnabled = useSchedulerStore((s) => s.agingEnabled)
  const mlqQ0Quantum = useSchedulerStore((s) => s.mlqQ0Quantum)
  const mlqQ1Quantum = useSchedulerStore((s) => s.mlqQ1Quantum)
  const mlfqQ0       = useSchedulerStore((s) => s.mlfqQ0)
  const mlfqQ1       = useSchedulerStore((s) => s.mlfqQ1)
  const mlfqBoost    = useSchedulerStore((s) => s.mlfqBoost)
  
  const [activeMetric, setActiveMetric] = useState('averageWaitingTime')

  // ── Fetch all 8 algorithms natively ────────────────
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading]       = useState(false)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!processes || processes.length === 0) { setAllResults([]); return }
    setLoading(true)
    setFetchError(null)

    try {
      const algos = Object.keys(ALGO_LABELS)
      const options = { quantum, agingEnabled, mlqQ0Quantum, mlqQ1Quantum, mlfqQ0, mlfqQ1, mlfqBoost }
      
      const results = algos.map((algo) => {
        const { metrics } = runCPUScheduling(algo, processes, options)
        return { algorithm: algo, label: ALGO_LABELS[algo], metrics }
      })
      
      setAllResults(results)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [processes, quantum, agingEnabled, mlqQ0Quantum, mlqQ1Quantum, mlfqQ0, mlfqQ1, mlfqBoost])

  const insight = useMemo(() => generateInsight(allResults), [allResults])

  if (!processes || processes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <EmptyState
          title="No processes to compare"
          description="Add processes in the Simulator page first, then come back here to compare all algorithms."
          icon={BarChart2}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Loading / error overlay */}
      {loading && (
        <div className="flex items-center gap-3 mb-6 justify-center bg-elevated rounded-md p-4">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="text-text-muted">Running all 8 algorithms natively…</span>
        </div>
      )}
      {fetchError && (
        <div className="card p-4 border-red-700 text-red text-sm mb-6">
          Error: {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-[20px]">
        
        {/* ── LEFT COLUMN (Primary Content) ── */}
        <div className="flex flex-col gap-[20px] min-w-0">
          
          {/* Metric selector tabs */}
          <div className="flex flex-wrap gap-2">
            {CHART_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-all duration-200 ${
                  activeMetric === m.key
                    ? 'bg-accent text-text-primary shadow-glow'
                    : 'bg-elevated text-text-muted hover:text-text-primary hover:bg-overlay'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          <div id="cpu-comparison-charts" className="card p-6">
            <h2 className="section-title mb-4">
              <BarChart2 className="w-4 h-4 text-accent" />
              {CHART_METRICS.find((m) => m.key === activeMetric)?.label}
            </h2>
            <ComparisonChart data={allResults} metric={activeMetric} />
          </div>

          {/* Comparison table */}
          <div className="card p-5">
            <h2 className="section-title mb-4">
              <TrendingDown className="w-4 h-4 text-accent" />
              Full Comparison Table
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    {METRICS.map((m) => (
                      <th key={m.key}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((r) => (
                    <tr key={r.algorithm}>
                      <td className="font-semibold font-mono text-indigo-300">{r.label}</td>
                      {METRICS.map((m) => {
                        const bestAlgo = getBestAlgo(allResults, m.key, m.lowerIsBetter)
                        const isBest = bestAlgo === r.algorithm
                        return (
                          <td key={m.key} className={`font-mono ${isBest ? 'text-green font-bold' : 'text-text-secondary'}`}>
                            {fmt2(r.metrics[m.key])}{m.unit}
                            {isBest && (
                              <span className="ml-2 badge badge-green text-xs">best</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (Secondary/Context) ── */}
        <div className="flex flex-col gap-[20px]">
          
          {/* Action Buttons */}
          {allResults.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => exportCPUComparisonToPDF(allResults, processes, quantum)}
                className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          )}

          {/* Insight panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 border-l-2 border-accent"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-accent" />
              <h2 className="section-title">Which Algorithm Wins?</h2>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              <BoldText text={insight} />
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {METRICS.slice(0, 3).map((m) => {
                const bestAlgo = allResults.find(
                  (r) => r.algorithm === getBestAlgo(allResults, m.key, m.lowerIsBetter)
                )
                if (!bestAlgo) return null
                return (
                  <div key={m.key} className="bg-elevated rounded-[5px] p-3">
                    <p className="text-xs text-text-muted mb-1">{m.label}</p>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-green" />
                      <span className="font-mono font-bold text-green text-sm">{bestAlgo.label}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 font-mono">
                      {fmt2(bestAlgo.metrics[m.key])}{m.unit}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
