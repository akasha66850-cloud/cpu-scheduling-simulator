import React from 'react'
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'

function MetricCard({ title, value, icon: Icon, color, subtext, formula }) {
  return (
    <div className={`card p-4 flex flex-col relative overflow-hidden group cursor-help`}>
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 bg-${color}-500 transition-transform group-hover:scale-150`} />
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider tooltip-trigger border-b border-dashed border-border-muted pb-0.5">{title}</h3>
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

export default function PageReplacementMetrics({ metrics }) {
  if (!metrics) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Page Faults"
        value={metrics.pageFaults}
        icon={AlertCircle}
        color="rose"
        subtext="misses"
        formula="Total instances where requested page was NOT in memory"
      />
      <MetricCard
        title="Page Hits"
        value={metrics.pageHits}
        icon={CheckCircle2}
        color="emerald"
        subtext="hits"
        formula="Total instances where requested page WAS in memory"
      />
      <MetricCard
        title="Fault Rate"
        value={`${metrics.faultRate.toFixed(1)}%`}
        icon={TrendingDown}
        color="rose"
        subtext="miss %"
        formula="(Page Faults / Total References) × 100"
      />
      <MetricCard
        title="Hit Rate"
        value={`${metrics.hitRate.toFixed(1)}%`}
        icon={TrendingUp}
        color="emerald"
        subtext="hit %"
        formula="(Page Hits / Total References) × 100"
      />
    </div>
  )
}
