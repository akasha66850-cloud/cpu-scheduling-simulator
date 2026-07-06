import React, { memo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'

const ALGO_COLORS = {
  FCFS: '#6366f1',
  SJF: '#f59e0b',
  SRTF: '#10b981',
  Priority: '#ef4444',
  PriorityPreemptive: '#8b5cf6',
  RoundRobin: '#06b6d4',
}

const ALGO_LABELS = {
  FCFS: 'FCFS',
  SJF: 'SJF',
  SRTF: 'SRTF',
  Priority: 'Priority',
  PriorityPreemptive: 'Pri-Pre',
  RoundRobin: 'RR',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-elevated border border-border-muted rounded-[5px] p-3 shadow-xl text-sm">
        <p className="font-bold text-text-primary mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="font-mono text-text-primary">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const ComparisonChart = memo(function ComparisonChart({ data, metric }) {
  if (!data || data.length === 0) return null

  const chartData = data.map((d) => ({
    algorithm: ALGO_LABELS[d.algorithm] || d.algorithm,
    value: d.metrics[metric] ?? 0,
    color: ALGO_COLORS[d.algorithm] || '#6366f1',
  }))

  const metricLabels = {
    averageWaitingTime: 'Avg Waiting Time',
    averageTurnaroundTime: 'Avg Turnaround Time',
    cpuUtilization: 'CPU Utilization (%)',
    throughput: 'Throughput',
    averageResponseTime: 'Avg Response Time',
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="algorithm"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name={metricLabels[metric] || metric} radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export default ComparisonChart
