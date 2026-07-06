import React from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldCheck, Skull, RefreshCw, Scissors, AlertCircle } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'

export default function DeadlockMetrics() {
  const { results, activeStrategy } = useDeadlockStore()

  if (!results || !results.metrics) return null

  const m = results.metrics

  let cards = []

  if (activeStrategy === 'bankers') {
    cards = [
      {
        key: 'safety',
        label: 'System State',
        value: m.isSafe ? 'SAFE' : 'UNSAFE',
        icon: m.isSafe ? ShieldCheck : Skull,
        color: m.isSafe ? 'emerald' : 'rose',
        formula: 'Need \u2264 Available for all P in Safe Sequence'
      },
      {
        key: 'seqLen',
        label: 'Safe Seq Length',
        value: m.safeSequenceLength || 0,
        icon: Activity,
        color: 'indigo',
        formula: 'Count(Processes that successfully complete)'
      }
    ]
  } else if (activeStrategy === 'detection') {
    cards = [
      {
        key: 'state',
        label: 'System State',
        value: m.isDeadlocked ? 'DEADLOCK' : 'SAFE',
        icon: m.isDeadlocked ? Skull : ShieldCheck,
        color: m.isDeadlocked ? 'rose' : 'emerald',
        formula: 'Deadlock = \u2203 P : Request > Available'
      },
      {
        key: 'count',
        label: 'Deadlocked Count',
        value: m.deadlockCount || 0,
        icon: Activity,
        color: 'amber',
        formula: 'Count(Processes with Finish == false)'
      }
    ]
  } else if (activeStrategy === 'recoveryA') {
    cards = [
      {
        key: 'term',
        label: 'Terminated',
        value: m.terminatedCount || 0,
        icon: Scissors,
        color: 'rose',
        formula: 'Number of least-cost processes aborted'
      },
      {
        key: 'overhead',
        label: 'Recovery Overhead',
        value: m.overhead || 0,
        icon: Activity,
        color: 'amber',
        formula: 'Termination Cost * Terminated Count'
      }
    ]
  } else if (activeStrategy === 'recoveryB') {
    cards = [
      {
        key: 'preempt',
        label: 'Preempted',
        value: m.preemptedCount || 0,
        icon: RefreshCw,
        color: 'sky',
        formula: 'Number of processes stripped of resources'
      },
      {
        key: 'overhead',
        label: 'Recovery Overhead',
        value: m.overhead || 0,
        icon: Activity,
        color: 'amber',
        formula: 'Preemption Cost * Preempted Count'
      }
    ]
  } else {
    // Prevention
    cards = [
      {
        key: 'guarantee',
        label: 'Safety Guarantee',
        value: m.safetyGuarantee === 100 ? 'YES' : 'NO',
        icon: ShieldCheck,
        color: m.safetyGuarantee === 100 ? 'emerald' : 'rose',
        formula: 'Condition enforced upfront? 100% : 0%'
      },
      {
        key: 'starvation',
        label: 'Starvation Risk',
        value: `${m.starvationRisk || 0}%`,
        icon: AlertCircle,
        color: 'amber',
        formula: 'Probability of a process waiting indefinitely'
      }
    ]
  }

  const colorMap = {
    indigo: 'text-accent bg-accent border-accent',
    amber: 'text-orange bg-amber-500/10 border-orange',
    emerald: 'text-green bg-emerald-500/10 border-green',
    rose: 'text-red bg-rose-500/10 border-rose-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <p className={`text-xl font-bold font-mono text-${card.color}-400`}>
                {card.value}
              </p>
            </div>
            {card.formula && (
              <div className="absolute inset-0 bg-surface p-3 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 text-center">
                <span className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-semibold">Formula</span>
                <span className="text-xs text-indigo-200 font-mono leading-relaxed">{card.formula}</span>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
