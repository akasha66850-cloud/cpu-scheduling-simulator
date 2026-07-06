import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Save, Download, FileText, ChevronDown, ToggleLeft, ToggleRight,
  Footprints, AlertCircle, X, History, Layers, Loader2,
} from 'lucide-react'
import { BarChart2 } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import ProcessForm from '@/components/ProcessForm'
import ProcessTable from '@/components/ProcessTable'
import GanttChart from '@/components/GanttChart'
import MetricsTable from '@/components/MetricsTable'
import MetricCards from '@/components/MetricCards'
import AlgorithmInfoPanel from '@/components/AlgorithmInfoPanel'
import StepModeControls from '@/components/StepModeControls'
import HistoryDrawer from '@/components/HistoryDrawer'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import EmptyState from '@/components/EmptyState'
import FormulaLegend from '@/components/FormulaLegend'
import ReadyQueuePanel from '@/components/ReadyQueuePanel'
import ProcessStatePanel from '@/components/ProcessStatePanel'
import { exportToPDF, exportToCSV } from '@/utils/exportHelpers'
import useSettingsStore from '@/store/useSettingsStore'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
import HintTooltip from '@/components/HintTooltip'

// ─── Algorithm list ───────────────────────────────────────────
const ALGORITHMS = [
  { value: 'FCFS',               label: 'FCFS',                       group: 'Classic' },
  { value: 'SJF',                label: 'SJF (Non-Preemptive)',        group: 'Classic' },
  { value: 'SRTF',               label: 'SRTF (Preemptive)',           group: 'Classic' },
  { value: 'Priority',           label: 'Priority (Non-Preemptive)',   group: 'Classic' },
  { value: 'PriorityPreemptive', label: 'Priority (Preemptive)',       group: 'Classic' },
  { value: 'RoundRobin',         label: 'Round Robin',                 group: 'Classic' },
  { value: 'MLQ',                label: 'Multilevel Queue (MLQ)',       group: 'Advanced' },
  { value: 'MLFQ',               label: 'Multilevel Feedback Queue',   group: 'Advanced' },
]

// ─── Toasts ───────────────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 bg-red-900/90 border border-red-600 rounded-[8px] px-5 py-3 shadow-xl backdrop-blur-md max-w-sm w-full mx-4"
    >
      <AlertCircle className="w-5 h-5 text-red shrink-0" />
      <span className="text-red-100 text-sm flex-1">{message}</span>
      <button onClick={onClose} className="text-red hover:text-text-primary"><X className="w-4 h-4" /></button>
    </motion.div>
  )
}

function SuccessToast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 bg-emerald-900/90 border border-emerald-600 rounded-[8px] px-5 py-3 shadow-xl backdrop-blur-md"
    >
      <span className="text-green text-sm">{message}</span>
    </motion.div>
  )
}

// ─── Numeric option row ───────────────────────────────────────
function NumericOption({ label, hint, value, onChange, min = 1, max = 50 }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
      <input
        type="number" min={min} max={max}
        className="input-field w-20 text-center text-sm py-1.5 shrink-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ─── Main Simulator Page ──────────────────────────────────────
export default function Simulator() {
  const algorithm           = useSchedulerStore((s) => s.algorithm)
  const setAlgorithm        = useSchedulerStore((s) => s.setAlgorithm)
  const quantum             = useSchedulerStore((s) => s.quantum)
  const setQuantum          = useSchedulerStore((s) => s.setQuantum)
  const agingEnabled        = useSchedulerStore((s) => s.agingEnabled)
  const setAgingEnabled     = useSchedulerStore((s) => s.setAgingEnabled)

  // MLQ options
  const mlqQ0Quantum    = useSchedulerStore((s) => s.mlqQ0Quantum)
  const mlqQ1Quantum    = useSchedulerStore((s) => s.mlqQ1Quantum)
  const setMlqQ0Quantum = useSchedulerStore((s) => s.setMlqQ0Quantum)
  const setMlqQ1Quantum = useSchedulerStore((s) => s.setMlqQ1Quantum)

  // MLFQ options
  const mlfqQ0      = useSchedulerStore((s) => s.mlfqQ0)
  const mlfqQ1      = useSchedulerStore((s) => s.mlfqQ1)
  const mlfqBoost   = useSchedulerStore((s) => s.mlfqBoost)
  const setMlfqQ0   = useSchedulerStore((s) => s.setMlfqQ0)
  const setMlfqQ1   = useSchedulerStore((s) => s.setMlfqQ1)
  const setMlfqBoost = useSchedulerStore((s) => s.setMlfqBoost)

  const results        = useSchedulerStore((s) => s.results)
  const ganttData      = useSchedulerStore((s) => s.ganttData)
  const processes      = useSchedulerStore((s) => s.processes)
  const runSimulation  = useSchedulerStore((s) => s.runSimulation)
  const saveSimulation = useSchedulerStore((s) => s.saveSimulation)
  const error          = useSchedulerStore((s) => s.error)
  const clearError     = useSchedulerStore((s) => s.clearError)
  const isStepMode     = useSchedulerStore((s) => s.isStepMode)
  const setStepMode    = useSchedulerStore((s) => s.setStepMode)
  const stepIndex      = useSchedulerStore((s) => s.stepIndex)
  const stepForward    = useSchedulerStore((s) => s.stepForward)
  const stepBackward   = useSchedulerStore((s) => s.stepBackward)
  const runStep        = useSchedulerStore((s) => s.runStep)
  const isLoading      = useSchedulerStore((s) => s.isLoading)

  const [historyOpen,   setHistoryOpen]   = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [successMsg,    setSuccessMsg]    = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  const isRR       = algorithm === 'RoundRobin'
  const isPriority = algorithm === 'Priority' || algorithm === 'PriorityPreemptive'
  const isMLQ      = algorithm === 'MLQ'
  const isMLFQ     = algorithm === 'MLFQ'

  const { defaultAlgorithm, defaultQuantum, autoRunOnLoad } = useSettingsStore()

  useEffect(() => {
    setAlgorithm(defaultAlgorithm)
    setQuantum(defaultQuantum)
    if (autoRunOnLoad) runSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onRun: () => isStepMode ? runStep() : runSimulation(),
    onClear: () => useSchedulerStore.getState().clearProcesses(),
    onSave: () => { if (results) { saveSimulation(); setSuccessMsg('Saved!') } },
    onNext: () => isStepMode && stepForward(),
    onPrev: () => isStepMode && stepBackward()
  })

  const handleExportPDF = async () => {
    if (!results) return
    setExportLoading(true)
    try {
      await exportToPDF(results, ganttData, algorithm, processes, quantum, isStepMode ? stepIndex : undefined)
      setSuccessMsg('PDF exported!')
    } catch (err) { console.error(err) }
    finally { setExportLoading(false) }
  }

  const handleExportCSV = () => {
    if (!results) return
    exportToCSV(results.processResults, results.metrics)
    setSuccessMsg('CSV exported!')
  }

  const handleSave = () => {
    if (!results) return
    saveSimulation()
    setSuccessMsg('Simulation saved to history!')
  }

  // Step index passed to visualization panels (undefined = show full simulation)
  const vizStepIndex = isStepMode ? stepIndex : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CPU Scheduler Simulator</h1>
          <p className="text-text-muted text-sm mt-0.5">Configure processes and run scheduling algorithms</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setHistoryOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={() => setShortcutsOpen(true)} className="btn-secondary text-sm px-3 py-2 font-mono" title="Keyboard shortcuts">
            ?
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 simulator-layout">

        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div className="lg:w-[420px] shrink-0 space-y-4">

          {/* Algorithm selector card */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">
              <Play className="w-4 h-4 text-accent" />
              Algorithm
            </h2>

            <div className="relative">
              <select
                id="algorithm-select"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="input-field appearance-none pr-8 cursor-pointer"
              >
                <optgroup label="── Classic ──">
                  {ALGORITHMS.filter((a) => a.group === 'Classic').map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </optgroup>
                <optgroup label="── Advanced ──">
                  {ALGORITHMS.filter((a) => a.group === 'Advanced').map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>

            {/* Round Robin quantum */}
            <AnimatePresence>
              {isRR && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="label">Time Quantum</label>
                  <input id="quantum-input" type="number" min="1" max="20"
                    className="input-field" value={quantum}
                    onChange={(e) => setQuantum(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* MLQ options */}
            <AnimatePresence>
              {isMLQ && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-red" /> MLQ Queue Settings
                  </p>
                  <NumericOption label="Q0 Quantum (Pri 1–2)" hint="Round Robin" value={mlqQ0Quantum} onChange={setMlqQ0Quantum} />
                  <NumericOption label="Q1 Quantum (Pri 3–4)" hint="Round Robin" value={mlqQ1Quantum} onChange={setMlqQ1Quantum} />
                  <p className="text-xs text-text-muted italic">Q2 (Pri 5+) → FCFS, no quantum</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MLFQ options */}
            <AnimatePresence>
              {isMLFQ && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan" /> MLFQ Queue Settings
                  </p>
                  <NumericOption label="Q0 Quantum (highest)" hint="New processes enter here" value={mlfqQ0} onChange={setMlfqQ0} />
                  <NumericOption label="Q1 Quantum (medium)"  hint="Demoted from Q0" value={mlfqQ1} onChange={setMlfqQ1} />
                  <NumericOption label="Boost Interval" hint="Ticks between priority boosts" value={mlfqBoost} onChange={setMlfqBoost} min={5} max={100} />
                  <p className="text-xs text-text-muted italic">Q2 → FCFS (unlimited). Boost resets all queues to Q0.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Priority aging toggle */}
            <AnimatePresence>
              {isPriority && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between pt-1 border-t border-border">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Enable Aging</label>
                    <p className="text-xs text-text-muted">Boost waiting process priority every 5t</p>
                  </div>
                  <button onClick={() => setAgingEnabled(!agingEnabled)}
                    className={`transition-colors ${agingEnabled ? 'text-accent' : 'text-text-muted'}`}>
                    {agingEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step mode toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div>
                <label className="text-sm font-medium text-text-secondary">Step Mode</label>
                <p className="text-xs text-text-muted">Advance one Gantt block at a time</p>
              </div>
              <button onClick={() => setStepMode(!isStepMode)}
                className={`transition-colors ${isStepMode ? 'text-accent' : 'text-text-muted'}`}>
                {isStepMode ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {/* Algorithm info */}
          <AlgorithmInfoPanel algorithm={algorithm} />

          {/* Process form */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">
              <Footprints className="w-4 h-4 text-accent" />
              Add Process
            </h2>
            <ProcessForm />
          </div>

          {/* Process list */}
          {processes.length > 0 && (
            <div className="card p-4 space-y-3">
              <h2 className="section-title">
                Process List
                <span className="ml-auto badge badge-indigo">{processes.length}/20</span>
              </h2>
              <ProcessTable />
            </div>
          )}

          {/* MLQ priority guide */}
          {(isMLQ) && (
            <div className="card p-3 text-xs space-y-1.5 border-l-2 border-rose-500">
              <p className="font-semibold text-text-secondary">MLQ Priority → Queue Assignment</p>
              <div className="space-y-1 text-text-muted">
                <div className="flex items-center gap-2"><span className="badge badge-indigo">Q0</span> Priority 1–2 → Round Robin (q={mlqQ0Quantum})</div>
                <div className="flex items-center gap-2"><span className="badge badge-yellow">Q1</span> Priority 3–4 → Round Robin (q={mlqQ1Quantum})</div>
                <div className="flex items-center gap-2"><span className="badge badge-slate">Q2</span> Priority 5+ → FCFS</div>
              </div>
            </div>
          )}

          {/* Run button */}
          <div className="relative">
            <HintTooltip moduleKey="cpu_sim_run" message="Add at least 3 processes and click Run Simulation →" />
            <button id="run-simulation-btn"
              onClick={isStepMode ? runStep : runSimulation}
              disabled={processes.length === 0 || isLoading}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-glow disabled:opacity-60">
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Running...</>
                : <><Play className="w-5 h-5" /> {isStepMode ? 'Initialize Step Mode' : 'Run Simulation'}</>
              }
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {results ? (
            <>
              {/* Step mode controls */}
              {isStepMode && <StepModeControls />}

              {/* Gantt Chart */}
              <div className="card p-5 space-y-3">
                <h2 className="section-title">
                  <BarChart2 className="w-4 h-4 text-accent" />
                  Gantt Chart
                  <span className="ml-2 badge badge-indigo text-xs">
                    {algorithm}
                    {isRR  ? ` q=${quantum}` : ''}
                    {isMLQ ? ` Q0q=${mlqQ0Quantum} Q1q=${mlqQ1Quantum}` : ''}
                    {isMLFQ ? ` Q0q=${mlfqQ0} Q1q=${mlfqQ1}` : ''}
                  </span>
                </h2>
                <GanttChart
                  ganttData={results.ganttData}
                  stepIndex={isStepMode ? stepIndex : undefined}
                />
              </div>

              {/* ✦ Ready Queue Panel (always visible after simulation) */}
              <ReadyQueuePanel
                ganttData={results.ganttData}
                processResults={results.processResults}
                processes={processes}
                algorithm={algorithm}
                stepIndex={vizStepIndex}
              />

              {/* Full Final Gantt Chart (visible only in Step Mode) */}
              {isStepMode && (
                <div className="card p-5 space-y-3 mt-6 border-t border-border">
                  <h2 className="section-title">
                    <BarChart2 className="w-4 h-4 text-green" />
                    Full Final Gantt Chart (Preview)
                  </h2>
                  <GanttChart
                    ganttData={results.ganttData}
                    stepIndex={undefined}
                  />
                </div>
              )}

              {/* ✦ Process State Panel (always visible after simulation) */}
              <ProcessStatePanel
                ganttData={results.ganttData}
                processResults={results.processResults}
                processes={processes}
                algorithm={algorithm}
                stepIndex={vizStepIndex}
              />

              {/* Metric summary cards */}
              <MetricCards metrics={results.metrics} />

              {/* Formula reference */}
              <FormulaLegend />

              {/* Detailed results table */}
              <div className="card p-5 space-y-3">
                <h2 className="section-title">Detailed Results</h2>
                <MetricsTable processResults={results.processResults} />

                {/* MLFQ demotion column callout */}
                {isMLFQ && results.processResults.some((r) => r.demotions > 0) && (
                  <p className="text-xs text-text-muted pt-1">
                    <span className="badge badge-yellow mr-1">↓N</span>
                    indicates the number of times a process was demoted to a lower queue.
                  </p>
                )}
              </div>

              {/* Export & save */}
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSave} className="btn-secondary flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> Save Simulation
                </button>
                <button onClick={handleExportPDF} disabled={exportLoading} className="btn-secondary flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" /> {exportLoading ? 'Generating…' : 'Export PDF'}
                </button>
                <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              title="No simulation results yet"
              description="Add processes on the left and click 'Run Simulation' to see the Gantt chart and metrics."
              icon={BarChart2}
            />
          )}
        </div>
      </div>

      {/* Drawers & Modals */}
      <HistoryDrawer isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Toasts */}
      <AnimatePresence>
        {error     && <ErrorToast   key="error"   message={error}      onClose={clearError} />}
        {successMsg && <SuccessToast key="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}
      </AnimatePresence>
    </div>
  )
}
