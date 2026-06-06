import React from 'react'
import { Info, Zap, Shield, Activity } from 'lucide-react'

const ALGO_INFO = {
  FCFS: {
    name: 'First Come First Served',
    type: 'Non-Preemptive',
    bestCase: 'O(n log n)',
    avgCase: 'O(n log n)',
    useCase: 'Simple batch systems where arrival order matters.',
    starvation: false,
    overhead: 'Low',
    color: 'indigo',
    desc: 'Processes are served in arrival order. Simplest scheduling policy.',
  },
  SJF: {
    name: 'Shortest Job First',
    type: 'Non-Preemptive',
    bestCase: 'O(n log n)',
    avgCase: 'O(n²)',
    useCase: 'Minimizing average waiting time when burst times are known.',
    starvation: true,
    overhead: 'Low',
    color: 'amber',
    desc: 'Selects the process with the shortest burst time at each decision point.',
  },
  SRTF: {
    name: 'Shortest Remaining Time First',
    type: 'Preemptive',
    bestCase: 'O(n log n)',
    avgCase: 'O(n²)',
    useCase: 'Optimal average turnaround time in interactive systems.',
    starvation: true,
    overhead: 'High',
    color: 'emerald',
    desc: 'Preemptive SJF — runs the process with least remaining burst time.',
  },
  Priority: {
    name: 'Priority Scheduling',
    type: 'Non-Preemptive',
    bestCase: 'O(n log n)',
    avgCase: 'O(n²)',
    useCase: 'Real-time systems with known process importance levels.',
    starvation: true,
    overhead: 'Low',
    color: 'red',
    desc: 'Processes with lower priority numbers get CPU first (1 = highest).',
  },
  PriorityPreemptive: {
    name: 'Priority Preemptive',
    type: 'Preemptive',
    bestCase: 'O(n log n)',
    avgCase: 'O(n²)',
    useCase: 'Hard real-time systems requiring immediate response to high-priority tasks.',
    starvation: true,
    overhead: 'High',
    color: 'violet',
    desc: 'Higher-priority processes preempt running ones immediately on arrival.',
  },
  RoundRobin: {
    name: 'Round Robin',
    type: 'Preemptive',
    bestCase: 'O(n)',
    avgCase: 'O(n × T/q)',
    useCase: 'Time-sharing systems requiring fair CPU distribution.',
    starvation: false,
    overhead: 'Medium',
    color: 'sky',
    desc: 'Each process gets equal CPU time slices. No starvation possible.',
  },
}

const overheadColor = {
  Low: 'badge-green',
  Medium: 'badge-yellow',
  High: 'badge-red',
}

export default function AlgorithmInfoPanel({ algorithm }) {
  const info = ALGO_INFO[algorithm]
  if (!info) return null

  return (
    <div className="card p-4 space-y-3 border-l-2 border-indigo-500">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">{info.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{info.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Type:</span>
            <span className={`badge ${info.type === 'Preemptive' ? 'badge-indigo' : 'badge-slate'}`}>
              {info.type}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Overhead:</span>
            <span className={`badge ${overheadColor[info.overhead]}`}>{info.overhead}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Starvation:</span>
            <span className={`badge ${info.starvation ? 'badge-red' : 'badge-green'}`}>
              {info.starvation ? 'Possible' : 'None'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div>
            <span className="text-slate-400">Best case:</span>
            <span className="ml-1 font-mono text-indigo-300">{info.bestCase}</span>
          </div>
          <div>
            <span className="text-slate-400">Avg case:</span>
            <span className="ml-1 font-mono text-indigo-300">{info.avgCase}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 border-t border-slate-800 pt-2">
        <span className="text-slate-300 font-medium">Best for: </span>
        {info.useCase}
      </p>
    </div>
  )
}
