import React from 'react'
import { CheckCircle2, XCircle, PieChart, Layers, Activity, Clock } from 'lucide-react'

function MetricCard({ title, value, icon: Icon, color, subtext, formula }) {
  return (
    <div className={`card p-4 flex flex-col relative overflow-hidden group cursor-help`}>
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 bg-${color}-500 transition-transform group-hover:scale-150`} />
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</h3>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {subtext && <span className="text-xs text-text-muted font-medium">{subtext}</span>}
      </div>
      {formula && (
        <div className="absolute inset-0 bg-surface p-3 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-center">
          <span className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-semibold">Formula</span>
          <span className="text-xs text-indigo-200 font-mono leading-relaxed">{formula}</span>
        </div>
      )}
    </div>
  )
}

export default function MemoryMetrics({ metrics }) {
  if (!metrics) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Success Rate"
        value={`${metrics.successRate.toFixed(1)}%`}
        icon={metrics.successRate === 100 ? CheckCircle2 : XCircle}
        color={metrics.successRate === 100 ? 'emerald' : 'rose'}
        subtext={`${metrics.allocatedCount} / ${metrics.allocatedCount + metrics.failedCount} alloc`}
        formula="(Allocated / Total) × 100"
      />
      <MetricCard
        title="Utilization"
        value={`${metrics.memoryUtilization.toFixed(1)}%`}
        icon={PieChart}
        color="indigo"
        subtext="Memory Used"
        formula="(Used Memory / Total Memory) × 100"
      />
      <MetricCard
        title="External Frag"
        value={metrics.externalFragmentation}
        icon={Layers}
        color="rose"
        subtext="units"
        formula="Total Free Memory - Largest Free Block"
      />
      <MetricCard
        title="Internal Frag"
        value={metrics.internalFragmentation}
        icon={Layers}
        color="amber"
        subtext="units"
        formula="Σ (Block Size - Process Size)"
      />
      <MetricCard
        title="Search Steps"
        value={metrics.avgSearchSteps.toFixed(1)}
        icon={Activity}
        color="blue"
        subtext="avg per alloc"
        formula="Total Checks / Total Processes"
      />
      <MetricCard
        title="Execution Time"
        value={`${metrics.executionTime ? metrics.executionTime.toFixed(2) : 0}`}
        icon={Clock}
        color="slate"
        subtext="µs"
      />
    </div>
  )
}
