import React from 'react'
import { Clock, Cpu, Zap, BarChart2, ArrowLeftRight } from 'lucide-react'
import { fmt2 } from '@/utils/metrics'
import MetricCard from '@/components/ui/MetricCard'

const CARDS = [
  {
    key: 'averageWaitingTime',
    label: 'Avg Waiting Time',
    unit: 'units',
    icon: Clock,
    colorClass: 'text-accent',
    desc: 'Avg time processes wait in ready queue',
    formula: 'Sum(WT) / Total Processes'
  },
  {
    key: 'averageTurnaroundTime',
    label: 'Avg Turnaround',
    unit: 'units',
    icon: Zap,
    colorClass: 'text-orange',
    desc: 'Avg time from arrival to completion',
    formula: 'Sum(TAT) / Total Processes'
  },
  {
    key: 'cpuUtilization',
    label: 'CPU Util',
    unit: '%',
    icon: Cpu,
    colorClass: 'text-green',
    desc: 'Percentage of time CPU is active',
    format: (v) => fmt2(v),
    formula: '((Total Time - Idle Time) / Total Time) × 100'
  },
  {
    key: 'throughput',
    label: 'Throughput',
    unit: 'proc/unit',
    icon: BarChart2,
    colorClass: 'text-purple',
    desc: 'Processes completed per time unit',
    format: (v) => fmt2(v),
    formula: 'Total Processes / Total Time'
  },
  {
    key: 'contextSwitches',
    label: 'Ctx Switches',
    unit: '',
    icon: ArrowLeftRight,
    colorClass: 'text-cyan',
    desc: 'Number of process context switches',
    format: (v) => String(v),
    formula: 'Total Preemptions & Completions'
  },
]

export default function MetricCards({ metrics }) {
  if (!metrics) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-[12px]">
      {CARDS.map((card) => {
        const rawVal = metrics[card.key] ?? 0
        const displayVal = card.format ? card.format(rawVal) : fmt2(rawVal)

        return (
          <MetricCard
            key={card.key}
            label={card.label}
            value={
              <>
                {displayVal}
                {card.unit && <span className="text-[12px] text-text-muted ml-1">{card.unit}</span>}
              </>
            }
            icon={card.icon}
            colorClass={card.colorClass}
            tooltip={`${card.desc} | Formula: ${card.formula}`}
          />
        )
      })}
    </div>
  )
}
