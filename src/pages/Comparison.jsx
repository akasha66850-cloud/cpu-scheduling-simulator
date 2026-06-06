import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingDown, Cpu, Award } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import ComparisonChart from '@/components/ComparisonChart'
import EmptyState from '@/components/EmptyState'
import { computeAggregateMetrics } from '@/utils/metrics'
import { fmt2 } from '@/utils/metrics'

import runFCFS from '@/algorithms/fcfs'
import runSJF from '@/algorithms/sjf'
import runSRTF from '@/algorithms/srtf'
import runPriority from '@/algorithms/priority'
import runPriorityPreemptive from '@/algorithms/priorityPreemptive'
import runRoundRobin from '@/algorithms/roundRobin'

// ─── Constants ────────────────────────────────────────────────
const ALGORITHMS = [
  { key: 'FCFS', fn: runFCFS, label: 'FCFS' },
  { key: 'SJF', fn: runSJF, label: 'SJF' },
  { key: 'SRTF', fn: runSRTF, label: 'SRTF' },
  { key: 'Priority', fn: runPriority, label: 'Priority' },
  { key: 'PriorityPreemptive', fn: runPriorityPreemptive, label: 'Pri. Pre.' },
  { key: 'RoundRobin', fn: (p, o) => runRoundRobin(p, { quantum: o?.quantum || 2 }), label: 'Round Robin' },
]

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
  const quantum = useSchedulerStore((s) => s.quantum)
  const [activeMetric, setActiveMetric] = useState('averageWaitingTime')

  // Run all 6 algorithms on the same process set
  const allResults = useMemo(() => {
    if (!processes || processes.length === 0) return []
    return ALGORITHMS.map(({ key, fn, label }) => {
      try {
        const { ganttData, processResults } = fn(processes, { quantum })
        const metrics = computeAggregateMetrics(processResults, ganttData)
        return { algorithm: key, label, metrics, processResults, ganttData }
      } catch (e) {
        console.error(`Error running ${key}:`, e)
        return null
      }
    }).filter(Boolean)
  }, [processes, quantum])

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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Algorithm Comparison</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          All 6 algorithms run on the same {processes.length} processes (RR q={quantum})
        </p>
      </div>

      {/* Metric selector tabs */}
      <div className="flex flex-wrap gap-2">
        {CHART_METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeMetric === m.key
                ? 'bg-indigo-600 text-white shadow-glow'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <h2 className="section-title mb-4">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          {CHART_METRICS.find((m) => m.key === activeMetric)?.label}
        </h2>
        <ComparisonChart data={allResults} metric={activeMetric} />
      </div>

      {/* Comparison table */}
      <div className="card p-5">
        <h2 className="section-title mb-4">
          <TrendingDown className="w-4 h-4 text-indigo-400" />
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
                      <td key={m.key} className={`font-mono ${isBest ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
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

      {/* Insight panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 border-l-2 border-indigo-500"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="section-title">Which Algorithm Wins?</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          <BoldText text={insight} />
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {METRICS.slice(0, 3).map((m) => {
            const bestAlgo = allResults.find(
              (r) => r.algorithm === getBestAlgo(allResults, m.key, m.lowerIsBetter)
            )
            if (!bestAlgo) return null
            return (
              <div key={m.key} className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-400 text-sm">{bestAlgo.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {fmt2(bestAlgo.metrics[m.key])}{m.unit}
                </p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
