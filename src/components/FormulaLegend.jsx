import React, { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

const FORMULAS = [
  {
    abbr: 'CT',
    name: 'Completion Time',
    formula: 'Time at which process finishes execution',
    color: 'text-sky-400',
  },
  {
    abbr: 'TAT',
    name: 'Turnaround Time',
    formula: 'CT − Arrival Time',
    color: 'text-violet-400',
  },
  {
    abbr: 'WT',
    name: 'Waiting Time',
    formula: 'TAT − Burst Time',
    color: 'text-amber-400',
  },
  {
    abbr: 'RT',
    name: 'Response Time',
    formula: 'First CPU Time − Arrival Time',
    color: 'text-emerald-400',
  },
]

export default function FormulaLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">Formula Reference</span>
          <span className="text-xs text-slate-600">CT · TAT · WT · RT</span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {/* Formula rows */}
      {open && (
        <div className="border-t border-slate-800 divide-y divide-slate-800/60">
          {FORMULAS.map((f) => (
            <div key={f.abbr} className="flex items-center gap-3 px-4 py-2.5">
              {/* Abbreviation badge */}
              <span className={`font-mono font-bold text-sm w-10 shrink-0 ${f.color}`}>
                {f.abbr}
              </span>

              {/* Name */}
              <span className="text-slate-300 text-sm w-36 shrink-0">{f.name}</span>

              {/* Divider */}
              <span className="text-slate-700 text-xs">=</span>

              {/* Formula */}
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                {f.formula}
              </span>
            </div>
          ))}

          {/* Average formulas */}
          <div className="px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1 bg-slate-800/30">
            <span className="font-mono text-xs text-slate-500">
              Avg WT = Σ(WT) / n
            </span>
            <span className="font-mono text-xs text-slate-500">
              Avg TAT = Σ(TAT) / n
            </span>
            <span className="font-mono text-xs text-slate-500">
              CPU Util = (Total − Idle) / Total × 100
            </span>
            <span className="font-mono text-xs text-slate-500">
              Throughput = n / Total Time
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
