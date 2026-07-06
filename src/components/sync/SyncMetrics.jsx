import React from 'react'
import useSyncStore from '@/store/useSyncStore'
import { Info } from 'lucide-react'

function MetricCard({ label, value, unit, formula }) {
  return (
    <div className="bg-surface border border-border rounded-[8px] p-5 relative overflow-hidden group">
      <div className="absolute top-3 right-3 text-text-muted group-hover:text-accent transition-colors cursor-help" title={formula}>
        <Info className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-text-muted mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary tracking-tight">{value}</span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export default function SyncMetrics() {
  const { results } = useSyncStore()

  if (!results) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 opacity-50">
        <MetricCard label="Throughput" value="-" formula="Ops completed per second" />
        <MetricCard label="Avg Wait" value="-" formula="Average wait time for resource acquisition" />
        <MetricCard label="Max Wait" value="-" formula="Maximum wait time observed by any thread" />
        <MetricCard label="Starvation Idx" value="-" formula="Max Wait / Avg Wait" />
        <MetricCard label="CPU Util" value="-" formula="Percentage of time threads spent running vs idle/waiting" />
        <MetricCard label="Switches" value="-" formula="Total Context Switches" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <MetricCard label="Throughput" value={results.throughput?.toFixed(1)} unit="ops/s" formula="Ops completed per second" />
      <MetricCard label="Avg Wait" value={results.avg_wait?.toFixed(1)} unit="ms" formula="Average wait time for resource acquisition" />
      <MetricCard label="Max Wait" value={results.max_wait} unit="ms" formula="Maximum wait time observed by any thread" />
      <MetricCard label="Starvation Idx" value={results.starvation_index?.toFixed(2)} formula="Max Wait / Avg Wait" />
      <MetricCard label="CPU Util" value={results.cpu_util?.toFixed(1)} unit="%" formula="Percentage of time threads spent running vs idle/waiting" />
      <MetricCard label="Switches" value={results.context_switches} formula="Total Context Switches" />
    </div>
  )
}
