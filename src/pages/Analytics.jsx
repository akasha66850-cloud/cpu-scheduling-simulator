import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { Activity, AlertTriangle, ArrowLeftRight, BarChart2, Clock } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import EmptyState from '@/components/EmptyState'
import { getPIDColor } from '@/components/GanttChart'
import { detectStarvation, fmt2 } from '@/utils/metrics'
import useSettingsStore from '@/store/useSettingsStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-elevated border border-border-muted rounded-[5px] p-3 shadow-xl text-sm">
        <p className="font-bold text-text-primary mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="font-mono text-text-primary">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const results = useSchedulerStore((s) => s.results)
  const processes = useSchedulerStore((s) => s.processes)
  const algorithm = useSchedulerStore((s) => s.algorithm)
  const ganttData = useSchedulerStore((s) => s.ganttData)
  const showStarvationWarnings = useSettingsStore((s) => s.showStarvationWarnings)

  // Process timeline: waiting vs executing per process
  const timelineData = useMemo(() => {
    if (!results) return []
    return results.processResults.map((r) => ({
      pid: r.pid,
      Waiting: r.waitingTime,
      Executing: r.burstTime,
      color: getPIDColor(r.pid),
    }))
  }, [results])

  // WT distribution
  const wtData = useMemo(() => {
    if (!results) return []
    return results.processResults.map((r) => ({
      pid: r.pid,
      waitingTime: r.waitingTime,
      color: getPIDColor(r.pid),
    }))
  }, [results])

  // RT distribution
  const rtData = useMemo(() => {
    if (!results) return []
    return results.processResults.map((r) => ({
      pid: r.pid,
      responseTime: r.responseTime,
      color: getPIDColor(r.pid),
    }))
  }, [results])

  // Starvation
  const starvedProcesses = useMemo(() => {
    if (!results || !processes) return []
    return detectStarvation(results.processResults, processes)
  }, [results, processes])

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <EmptyState
          title="No simulation data"
          description="Run a simulation in the Simulator page to see detailed analytics here."
          icon={Activity}
        />
      </div>
    )
  }

  const { metrics } = results

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Starvation banner (Full width if applicable) */}
      {showStarvationWarnings && starvedProcesses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 mb-6 bg-amber-500/10 border border-orange rounded-[8px] text-amber-300"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Starvation Detected</p>
            <p className="text-xs mt-0.5">
              {starvedProcesses.map((s) =>
                `${s.pid} waited ${s.waitingTime} units (threshold: ${fmt2(s.threshold)})`
              ).join('; ')}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-[20px]">
        
        {/* ── LEFT COLUMN (Primary Content) ── */}
        <div className="flex flex-col gap-[20px] min-w-0">
          
          {/* Process Timeline: Waiting vs Executing */}
          <div className="card p-5">
            <h2 className="section-title mb-4">
              <Activity className="w-4 h-4 text-accent" />
              Process Timeline (Waiting vs Executing)
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="pid"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                />
                <Bar dataKey="Waiting" stackId="a" fill="var(--text-muted)" fillOpacity={0.7} radius={[0, 0, 0, 0]} name="Waiting Time" />
                <Bar dataKey="Executing" stackId="a" radius={[4, 4, 0, 0]} name="Burst Time">
                  {timelineData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* WT and RT charts side by side */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Waiting time distribution */}
            <div className="card p-5">
              <h2 className="section-title mb-4">
                <Clock className="w-4 h-4 text-orange" />
                Waiting Time per Process
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={wtData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="pid"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="waitingTime" name="Waiting Time" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {wtData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Response time distribution */}
            <div className="card p-5">
              <h2 className="section-title mb-4">
                <Activity className="w-4 h-4 text-green" />
                Response Time per Process
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rtData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="pid"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="responseTime" name="Response Time" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {rtData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-process stat table */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Per-Process Breakdown</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Completion</th>
                    <th>Turnaround</th>
                    <th>Waiting</th>
                    <th>Response</th>
                    <th>WT/BT Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {results.processResults.map((r) => (
                    <tr key={r.pid}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPIDColor(r.pid) }} />
                          <span className="font-mono text-indigo-300 font-semibold">{r.pid}</span>
                        </div>
                      </td>
                      <td className="font-mono">{r.arrivalTime}</td>
                      <td className="font-mono">{r.burstTime}</td>
                      <td className="font-mono">{r.completionTime}</td>
                      <td className="font-mono">{r.turnaroundTime}</td>
                      <td className="font-mono">{r.waitingTime}</td>
                      <td className="font-mono">{r.responseTime}</td>
                      <td className="font-mono text-xs text-text-muted">
                        {fmt2(r.waitingTime / Math.max(r.burstTime, 1))}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Secondary/Context) ── */}
        <div className="flex flex-col gap-[20px]">
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight className="w-4 h-4 text-accent" />
              <span className="text-xs text-text-muted">Context Switches</span>
            </div>
            <p className="text-3xl font-black font-mono text-text-primary">{metrics.contextSwitches}</p>
            <div className="mt-2 flex gap-1 flex-wrap">
              {Array.from({ length: Math.min(metrics.contextSwitches, 20) }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-accent rounded-sm opacity-70" />
              ))}
              {metrics.contextSwitches > 20 && (
                <span className="text-xs text-text-muted">+{metrics.contextSwitches - 20} more</span>
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange" />
              <span className="text-xs text-text-muted">Total CPU Time</span>
            </div>
            <p className="text-3xl font-black font-mono text-text-primary">{metrics.totalTime}</p>
            <p className="text-xs text-text-muted mt-1">time units</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green" />
              <span className="text-xs text-text-muted">Idle Time</span>
            </div>
            <p className="text-3xl font-black font-mono text-text-primary">{metrics.totalIdleTime}</p>
            <p className="text-xs text-text-muted mt-1">time units</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-text-muted">CPU Utilization</span>
            </div>
            <p className="text-3xl font-black font-mono text-text-primary">{fmt2(metrics.cpuUtilization)}%</p>
            <div className="mt-2 h-1.5 bg-elevated rounded-full">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(metrics.cpuUtilization, 100)}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
