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
    color: 'text-orange',
  },
  {
    abbr: 'RT',
    name: 'Response Time',
    formula: 'First CPU Time − Arrival Time',
    color: 'text-green',
  },
]

export default function FormulaLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[8px] border border-border bg-surface overflow-hidden w-[330px] -ml-[15px]">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <BookOpen className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium">Formula Reference</span>
          <span className="text-xs text-text-muted">CT · TAT · WT · RT</span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
          : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>

      {/* Formula rows */}
      {open && (
        <div className="border-t border-border divide-y divide-slate-800/60">
          {FORMULAS.map((f) => (
            <div key={f.abbr} className="flex items-center gap-3 px-3 py-2.5">
              {/* Abbreviation badge */}
              <span className={`font-mono font-bold text-sm w-9 shrink-0 ${f.color}`}>
                {f.abbr}
              </span>

              {/* Name */}
              <span className="text-text-secondary text-sm w-[115px] shrink-0">{f.name}</span>

              {/* Divider */}
              <span className="text-slate-700 text-xs shrink-0">=</span>

              {/* Formula */}
              <div className="font-mono text-[11px] text-text-muted bg-elevated px-2 py-1 rounded-md flex-1 break-words leading-snug">
                {f.formula}
              </div>
            </div>
          ))}

          {/* Average formulas */}
          <div className="px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1 bg-elevated">
            <span className="font-mono text-xs text-text-muted">
              Avg WT = Σ(WT) / n
            </span>
            <span className="font-mono text-xs text-text-muted">
              Avg TAT = Σ(TAT) / n
            </span>
            <span className="font-mono text-xs text-text-muted">
              CPU Util = (Total − Idle) / Total × 100
            </span>
            <span className="font-mono text-xs text-text-muted">
              Throughput = n / Total Time
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
