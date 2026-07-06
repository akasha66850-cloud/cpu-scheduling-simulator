import React from 'react'
import { motion } from 'framer-motion'
import { Ruler, Clock, Zap, Activity, Repeat, Timer } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'

export default function DiskMetrics() {
  const { results, activeAlgorithm } = useDiskStore()

  if (!results || !results.metrics) return null

  const m = results.metrics

  const cards = [
    {
      key: 'distance',
      label: 'Total Seek Distance',
      value: m.totalDistance,
      unit: 'cylinders',
      icon: Ruler,
      color: 'indigo',
      formula: '\u03A3 |Current - Next|'
    },
    {
      key: 'avgSeek',
      label: 'Average Seek Time',
      value: m.avgSeekTime,
      unit: 'ms',
      icon: Clock,
      color: 'emerald',
      formula: 'Total Distance \u00D7 1 ms/cylinder'
    },
    {
      key: 'throughput',
      label: 'Throughput',
      value: m.throughput,
      unit: 'req/ms',
      icon: Zap,
      color: 'sky',
      formula: 'Total Requests / Total Seek Time'
    },
    {
      key: 'avgResp',
      label: 'Avg Response Time',
      value: m.avgResponseTime,
      unit: 'ms',
      icon: Timer,
      color: 'amber',
      formula: 'Average wait distance until served'
    },
    {
      key: 'variance',
      label: 'Seek Variance',
      value: m.variance,
      unit: '',
      icon: Activity,
      color: 'rose',
      formula: 'Variance of individual seek distances (\u03C3\u00B2)'
    }
  ]

  if (['scan', 'look', 'cscan', 'clook'].includes(activeAlgorithm)) {
    cards.push({
      key: 'reversals',
      label: 'Direction Reversals',
      value: m.reversals,
      unit: 'times',
      icon: Repeat,
      color: 'violet',
      formula: 'Count of times the head changed direction'
    })
  }

  const colorMap = {
    indigo: 'text-accent bg-accent border-accent',
    amber: 'text-orange bg-amber-500/10 border-orange',
    emerald: 'text-green bg-emerald-500/10 border-green',
    rose: 'text-red bg-rose-500/10 border-rose-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon
        const colorClass = colorMap[card.color]

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`card p-4 flex flex-col gap-2 transition-colors relative overflow-hidden group cursor-help`}
          >
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 bg-${card.color}-500 transition-transform group-hover:scale-150`} />
            <div className={`w-8 h-8 rounded-[5px] border flex items-center justify-center ${colorClass} z-10`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="z-10 mt-1">
              <p className="text-xs text-text-muted mb-0.5 border-b border-dashed border-border-muted pb-0.5 inline-block">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-xl font-bold font-mono text-${card.color}-400`}>
                  {card.value}
                </p>
                {card.unit && <span className="text-[10px] text-text-muted uppercase">{card.unit}</span>}
              </div>
            </div>
            <div className="absolute inset-0 bg-surface p-3 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-semibold">Formula</span>
              <span className="text-xs text-indigo-200 font-mono leading-relaxed">{card.formula}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
