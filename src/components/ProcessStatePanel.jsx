import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { getPIDColor } from '@/components/GanttChart'

// ─── State definitions ────────────────────────────────────────
const STATES = ['New', 'Ready', 'Running', 'Terminated']

const STATE_STYLE = {
  New:        'border-border-muted   bg-elevated   text-text-muted',
  Ready:      'border-orange   bg-amber-500/10   text-orange',
  Running:    'border-green bg-emerald-500/10 text-green',
  Terminated: 'border-border-muted   bg-surface   text-text-muted',
}

const STATE_DOT = {
  New:        'bg-overlay',
  Ready:      'bg-amber-400 animate-pulse',
  Running:    'bg-emerald-400 animate-ping',
  Terminated: 'bg-overlay',
}

// ─── Helpers ──────────────────────────────────────────────────
/**
 * Determine the current state of `pid` at simulation time `time`.
 */
export function getStateAt(pid, time, ganttData, processResults, processes) {
  const proc = processes?.find((p) => p.id === pid)
  const res  = processResults?.find((r) => r.pid === pid)

  if (!proc || !res) return 'New'

  if (proc.arrivalTime > time)            return 'New'
  if (res.completionTime <= time)         return 'Terminated'

  const running = ganttData?.find(
    (b) => b.pid === pid && b.start <= time && b.end > time
  )
  if (running) return 'Running'

  return 'Ready'
}

// ─── Single process card ──────────────────────────────────────
function ProcessCard({ pid, state, result, isMLFQ }) {
  const color = getPIDColor(pid)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[8px] border p-3 space-y-2 transition-all duration-300 ${
        state === 'Running'
          ? 'border-green bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : state === 'Ready'
          ? 'border-orange bg-amber-500/5'
          : state === 'Terminated'
          ? 'border-border bg-surface opacity-60'
          : 'border-border bg-surface'
      }`}
    >
      {/* PID row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: state === 'Terminated' ? '#334155' : color }}
          />
          <span
            className="font-mono font-bold text-sm"
            style={{ color: state === 'Terminated' ? '#475569' : color }}
          >
            {pid}
          </span>
          {isMLFQ && result?.demotions > 0 && (
            <span className="badge badge-yellow text-xs" title="Demoted between queues">
              ↓{result.demotions}
            </span>
          )}
          {result?.queue !== undefined && (result?.algorithm === 'MLQ' || result?.algorithm === 'MLFQ') && (
            <span className="badge badge-indigo text-xs">Q{result.queue}</span>
          )}
        </div>
        {state === 'Terminated' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        )}
      </div>

      {/* State transition strip */}
      <div className="flex items-center gap-0.5">
        {STATES.map((s, i) => {
          const isActive  = s === state
          const isPast    = STATES.indexOf(state) > i
          const isFuture  = STATES.indexOf(state) < i

          return (
            <React.Fragment key={s}>
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                className={`flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold border transition-all duration-300 ${
                  isActive
                    ? STATE_STYLE[s]
                    : isPast
                    ? 'border-border-muted bg-elevated text-text-muted'
                    : 'border-transparent text-slate-700'
                }`}
              >
                {isActive && (
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${STATE_DOT[s]}`} />
                )}
                {s === 'Terminated' ? 'Term.' : s}
              </motion.div>
              {i < STATES.length - 1 && (
                <ArrowRight className={`w-2.5 h-2.5 shrink-0 ${isPast ? 'text-text-muted' : 'text-slate-800'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mini metrics */}
      {result && state !== 'New' && (
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border">
          {[
            { label: 'AT', value: result.arrivalTime },
            { label: 'BT', value: result.burstTime },
            { label: state === 'Terminated' ? 'WT' : 'Pri', value: state === 'Terminated' ? result.waitingTime : result.priority },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-[9px] text-text-muted">{label}</div>
              <div className="text-xs font-mono font-semibold text-text-muted">{value}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function ProcessStatePanel({ ganttData, processResults, processes, algorithm, stepIndex }) {
  const simTime = useMemo(() => {
    if (!ganttData || ganttData.length === 0) return 0
    if (stepIndex === undefined || stepIndex >= ganttData.length) {
      return ganttData[ganttData.length - 1].end
    }
    return ganttData[Math.max(0, stepIndex - 1)]?.end ?? 0
  }, [ganttData, stepIndex])

  const processStates = useMemo(() => {
    if (!processes) return []
    return processes.map((p) => ({
      pid: p.id,
      state: getStateAt(p.id, simTime, ganttData, processResults, processes),
      result: processResults?.find((r) => r.pid === p.id),
    }))
  }, [processes, simTime, ganttData, processResults])

  if (!ganttData || ganttData.length === 0 || !processes) return null

  const isMLFQ = algorithm === 'MLFQ'

  // Sort: Running first, then Ready, New, Terminated
  const ORDER = { Running: 0, Ready: 1, New: 2, Terminated: 3 }
  const sorted = [...processStates].sort((a, b) => ORDER[a.state] - ORDER[b.state])

  // State counts for summary
  const counts = processStates.reduce((acc, { state }) => {
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {})

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="section-title text-sm">
          <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          Process States
          {stepIndex !== undefined && (
            <span className="ml-2 font-mono text-xs text-text-muted">t = {simTime}</span>
          )}
        </h3>
        <div className="flex gap-2 text-xs">
          {Object.entries(counts).map(([s, n]) => (
            <span key={s} className={`badge ${
              s === 'Running' ? 'badge-green' :
              s === 'Ready'   ? 'badge-yellow' :
              'badge-slate'
            }`}>
              {n} {s}
            </span>
          ))}
        </div>
      </div>

      {/* Process cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {sorted.map(({ pid, state, result }) => (
          <ProcessCard
            key={pid}
            pid={pid}
            state={state}
            result={result}
            isMLFQ={isMLFQ}
          />
        ))}
      </div>

      {/* State legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs text-text-muted">
        {STATES.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm border ${STATE_STYLE[s]}`} />
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
