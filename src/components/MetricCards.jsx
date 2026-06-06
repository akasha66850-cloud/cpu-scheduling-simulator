import React from 'react'
import { Clock, Cpu, Zap, BarChart2, ArrowLeftRight } from 'lucide-react'
import { fmt2 } from '@/utils/metrics'
import { motion } from 'framer-motion'

const CARDS = [
  {
    key: 'averageWaitingTime',
    label: 'Avg Waiting Time',
    unit: 'units',
    icon: Clock,
    color: 'indigo',
    desc: 'Avg time processes wait in ready queue',
  },
  {
    key: 'averageTurnaroundTime',
    label: 'Avg Turnaround',
    unit: 'units',
    icon: Zap,
    color: 'amber',
    desc: 'Avg time from arrival to completion',
  },
  {
    key: 'cpuUtilization',
    label: 'CPU Utilization',
    unit: '%',
    icon: Cpu,
    color: 'emerald',
    desc: 'Percentage of time CPU is active',
    format: (v) => fmt2(v),
  },
  {
    key: 'throughput',
    label: 'Throughput',
    unit: 'proc/unit',
    icon: BarChart2,
    color: 'violet',
    desc: 'Processes completed per time unit',
    format: (v) => fmt2(v),
  },
  {
    key: 'contextSwitches',
    label: 'Context Switches',
    unit: '',
    icon: ArrowLeftRight,
    color: 'sky',
    desc: 'Number of process context switches',
    format: (v) => String(v),
  },
]

const colorMap = {
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

export default function MetricCards({ metrics }) {
  if (!metrics) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {CARDS.map((card, i) => {
        const Icon = card.icon
        const rawVal = metrics[card.key] ?? 0
        const displayVal = card.format ? card.format(rawVal) : fmt2(rawVal)
        const colorClass = colorMap[card.color]

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors"
            title={card.desc}
          >
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{card.label}</p>
              <p className="text-xl font-bold font-mono text-slate-100">
                {displayVal}
                {card.unit && (
                  <span className="text-xs font-normal text-slate-500 ml-1">{card.unit}</span>
                )}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
