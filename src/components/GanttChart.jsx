import React, { memo, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

import useSchedulerStore from '@/store/useSchedulerStore'

// ─── Color Palette ────────────────────────────────────────────
const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4',
]

/**
 * Get consistent color for a process ID.
 * @param {string} pid
 * @param {Array} processes
 * @returns {string} hex color
 */
export function getPIDColor(pid, processes = []) {
  if (pid === 'IDLE') return '#475569'
  const proc = processes.find((p) => p.id === pid)
  if (proc && proc.color) return proc.color
  const num = parseInt(pid.replace(/\D/g, ''), 10) || 0
  return COLORS[num % COLORS.length]
}

// ─── Tooltip ──────────────────────────────────────────────────
function BlockTooltip({ block }) {
  return (
    <div className="tooltip">
      <div className="font-bold text-text-primary">{block.pid}</div>
      <div className="text-text-secondary">Start: {block.start}</div>
      <div className="text-text-secondary">End: {block.end}</div>
      <div className="text-text-secondary">Duration: {block.end - block.start}</div>
    </div>
  )
}

// ─── Single Gantt Block ───────────────────────────────────────
function GanttBlock({ block, totalTime, index, isActive, isFuture, processes }) {
  const [hovered, setHovered] = useState(false)
  const duration = block.end - block.start
  const widthPct = (duration / totalTime) * 100
  const leftPct = (block.start / totalTime) * 100
  const color = getPIDColor(block.pid, processes)
  const isIdle = block.pid === 'IDLE'
  const tooNarrow = widthPct < 3

  return (
    <div
      className="absolute top-0 h-full"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFuture ? 0 : 1, opacity: isFuture ? 0.2 : 1 }}
        transition={{
          delay: index * 0.05,
          duration: 0.35,
          ease: 'easeOut',
        }}
        style={{
          transformOrigin: 'left center',
          backgroundColor: isIdle ? undefined : color,
          border: `1px solid ${isIdle ? 'rgba(148,163,184,0.3)' : color}88`,
          boxShadow: isActive && !isIdle ? `0 0 12px ${color}60` : undefined,
        }}
        className={`h-full rounded-sm relative cursor-pointer transition-all duration-200
          ${isIdle ? 'gantt-idle' : ''}
          ${isActive ? 'ring-2 ring-white/40' : ''}
          hover:brightness-110`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Label */}
        {!tooNarrow && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary select-none"
            style={{ fontSize: widthPct < 6 ? '9px' : '11px' }}
          >
            {block.pid}
          </span>
        )}

        {/* Tooltip */}
        {hovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <BlockTooltip block={block} />
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Time Axis ────────────────────────────────────────────────
function TimeAxis({ totalTime }) {
  const tickStep = totalTime > 40 ? 5 : totalTime > 20 ? 2 : 1
  const ticks = []
  for (let t = 0; t <= totalTime; t += tickStep) {
    ticks.push(t)
  }

  return (
    <div className="relative h-6 mt-1">
      {ticks.map((t) => {
        const leftPct = (t / totalTime) * 100
        return (
          <div
            key={t}
            className="absolute flex flex-col items-center"
            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-2 bg-overlay" />
            <span className="text-xs text-text-muted font-mono mt-0.5" style={{ fontSize: '10px' }}>
              {t}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────
function GanttLegend({ ganttData, processes }) {
  const unique = [...new Set(ganttData.map((b) => b.pid))]
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {unique.map((pid) => (
        <div key={pid} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded-sm ${pid === 'IDLE' ? 'gantt-idle' : ''}`}
            style={{
              backgroundColor: pid === 'IDLE' ? undefined : getPIDColor(pid, processes),
              border: `1px solid ${getPIDColor(pid, processes)}80`,
            }}
          />
          <span className="text-xs text-text-muted font-mono">{pid}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main GanttChart Component ────────────────────────────────
const GanttChart = memo(function GanttChart({ ganttData, stepIndex }) {
  const containerRef = useRef()
  const processes = useSchedulerStore((s) => s.processes)

  if (!ganttData || ganttData.length === 0) return null

  const totalTime = ganttData[ganttData.length - 1].end
  const activeIndex = stepIndex !== undefined ? stepIndex - 1 : ganttData.length - 1
  const visibleBlocks = stepIndex !== undefined ? ganttData.slice(0, stepIndex) : ganttData

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2">
        <div ref={containerRef} style={{ minWidth: `${Math.max(totalTime * 20, 400)}px` }}>
          {/* Main timeline */}
          <div className="relative h-12 bg-elevated rounded-[5px] border border-border-muted overflow-visible">
            {ganttData.map((block, idx) => (
              <GanttBlock
                key={`${block.pid}-${block.start}`}
                block={block}
                totalTime={totalTime}
                index={idx}
                isActive={stepIndex !== undefined && idx === activeIndex}
                isFuture={stepIndex !== undefined && idx >= stepIndex}
                processes={processes}
              />
            ))}
          </div>

          {/* Time axis */}
          <TimeAxis totalTime={totalTime} />
        </div>
      </div>

      {/* Legend */}
      <GanttLegend ganttData={ganttData} processes={processes} />
    </div>
  )
})

export default GanttChart
