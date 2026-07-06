import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Clock, CheckCircle2, Hourglass } from 'lucide-react'
import { getPIDColor } from '@/components/GanttChart'

// ─── Queue labels for MLQ / MLFQ ─────────────────────────────
const QUEUE_LABELS = {
  MLQ:  ['Q0 – RR (Hi)', 'Q1 – RR (Med)', 'Q2 – FCFS (Lo)'],
  MLFQ: ['Q0 – RR q=2', 'Q1 – RR q=4',   'Q2 – FCFS'],
}

// ─── Helpers ──────────────────────────────────────────────────
/**
 * Given a simulation time T, compute the state of each process.
 * Returns { running: string|null, ready: string[], notArrived: string[], done: string[] }
 */
function computeQueueSnapshot(time, processes, ganttData, processResults) {
  if (!processes || !ganttData || !processResults) {
    return { running: null, ready: [], notArrived: [], done: [] }
  }

  // Which block is active at this exact time?
  const activeBlock = ganttData.find(
    (b) => b.pid !== 'IDLE' && b.start <= time && b.end > time
  )
  const runningPid = activeBlock?.pid ?? null

  const running    = runningPid
  const ready      = []
  const notArrived = []
  const done       = []

  for (const p of processes) {
    const res = processResults.find((r) => r.pid === p.id)
    if (!res) { notArrived.push(p.id); continue }

    if (p.arrivalTime > time) {
      notArrived.push(p.id)
    } else if (res.completionTime <= time) {
      done.push(p.id)
    } else if (p.id === runningPid) {
      // already captured
    } else {
      ready.push(p.id)
    }
  }

  return { running, ready, notArrived, done, activeBlock }
}

// ─── Process chip ─────────────────────────────────────────────
function ProcessChip({ pid, size = 'md', pulse = false, dim = false, done = false, queueNum }) {
  const color = getPIDColor(pid)
  const sz = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: dim ? 0.35 : 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative inline-flex items-center gap-1.5 rounded-full font-mono font-bold border select-none ${sz} ${
        done ? 'line-through opacity-40' : ''
      }`}
      style={{
        borderColor: color + '60',
        color: done ? '#475569' : color,
        backgroundColor: done ? 'transparent' : color + '15',
        boxShadow: pulse ? `0 0 10px ${color}50` : undefined,
      }}
      title={pid}
    >
      {pulse && (
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
      )}
      {done && <CheckCircle2 className="w-3 h-3 opacity-60" />}
      {pid}
      {queueNum !== undefined && (
        <span className="text-[9px] opacity-60">Q{queueNum}</span>
      )}
    </motion.div>
  )
}

// ─── Queue lane (for MLQ / MLFQ) ─────────────────────────────
function QueueLane({ label, pids, processResults, color }) {
  const queueMap = {}
  for (const r of (processResults || [])) {
    if (r.queue !== undefined) queueMap[r.pid] = r.queue
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className="shrink-0 text-xs font-mono font-semibold px-2 py-1 rounded border"
        style={{ color, borderColor: color + '50', backgroundColor: color + '10' }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
        {pids.length === 0 ? (
          <span className="text-xs text-text-muted italic">empty</span>
        ) : (
          pids.map((pid) => (
            <ProcessChip key={pid} pid={pid} size="sm" />
          ))
        )}
      </div>
    </div>
  )
}

const QUEUE_COLORS = ['#6366f1', '#f59e0b', '#10b981']

// ─── Main Component ───────────────────────────────────────────
export default function ReadyQueuePanel({ ganttData, processResults, processes, algorithm, stepIndex }) {
  // Derive simulation time from stepIndex (or full end if no step mode)
  const simTime = useMemo(() => {
    if (!ganttData || ganttData.length === 0) return 0
    if (stepIndex === undefined || stepIndex >= ganttData.length) {
      return ganttData[ganttData.length - 1].end
    }
    return ganttData[Math.max(0, stepIndex - 1)]?.end ?? 0
  }, [ganttData, stepIndex])

  const { running, ready, notArrived, done, activeBlock } = useMemo(
    () => computeQueueSnapshot(simTime, processes, ganttData, processResults),
    [simTime, processes, ganttData, processResults]
  )

  const isMultiQueue = algorithm === 'MLQ' || algorithm === 'MLFQ'
  const queueLabels  = QUEUE_LABELS[algorithm] || []

  // For MLQ/MLFQ, bucket ready processes by their queue assignment
  const byQueue = useMemo(() => {
    if (!isMultiQueue) return null
    const buckets = [[], [], []]
    for (const pid of ready) {
      const res = processResults?.find((r) => r.pid === pid)
      // Use the `queue` from the last ganttData block for this pid
      const lastBlock = [...(ganttData || [])].reverse().find(
        (b) => b.pid === pid && b.end <= simTime
      )
      const q = lastBlock?.queue ?? res?.queue ?? 0
      const qIdx = Math.max(0, Math.min(2, q))
      buckets[qIdx].push(pid)
    }
    return buckets
  }, [isMultiQueue, ready, processResults, ganttData, simTime])

  if (!ganttData || ganttData.length === 0) return null

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="section-title text-sm">
          <Hourglass className="w-4 h-4 text-accent" />
          Ready Queue
          {stepIndex !== undefined && (
            <span className="ml-2 font-mono text-xs text-text-muted">t = {simTime}</span>
          )}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{done.length} done</span>
          <span>·</span>
          <span>{ready.length} waiting</span>
          {notArrived.length > 0 && <><span>·</span><span>{notArrived.length} pending</span></>}
        </div>
      </div>

      {/* CPU section */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-elevated rounded-[5px] border border-border-muted">
        <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
          <Cpu className="w-3.5 h-3.5 text-green" />
          <span>CPU</span>
        </div>
        <div className="h-4 w-px bg-overlay shrink-0" />
        <AnimatePresence mode="wait">
          {running ? (
            <ProcessChip key={running} pid={running} pulse size="md" />
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-text-muted italic"
            >
              IDLE
            </motion.span>
          )}
        </AnimatePresence>
        {activeBlock && running && (
          <span className="ml-auto text-xs text-text-muted font-mono">
            [{activeBlock.start} → {activeBlock.end}]
          </span>
        )}
      </div>

      {/* Ready queue section */}
      {isMultiQueue && byQueue ? (
        /* Multi-level queue display */
        <div className="space-y-1 divide-y divide-slate-800">
          {queueLabels.map((label, qi) => (
            <QueueLane
              key={qi}
              label={label}
              pids={byQueue[qi]}
              processResults={processResults}
              color={QUEUE_COLORS[qi]}
            />
          ))}
        </div>
      ) : (
        /* Flat ready queue */
        <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
          <span className="text-xs text-text-muted shrink-0">Queue →</span>
          <AnimatePresence>
            {ready.length === 0 ? (
              <span className="text-xs text-text-muted italic">empty</span>
            ) : (
              ready.map((pid, i) => (
                <ProcessChip key={pid} pid={pid} size="sm" />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Not arrived + done row */}
      {(notArrived.length > 0 || done.length > 0) && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs">
          {notArrived.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-text-muted" />
              <span className="text-text-muted">Not arrived:</span>
              <div className="flex gap-1 flex-wrap">
                {notArrived.map((pid) => (
                  <ProcessChip key={pid} pid={pid} size="sm" dim />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <div className="flex gap-1 flex-wrap">
                {done.map((pid) => (
                  <ProcessChip key={pid} pid={pid} size="sm" done />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
