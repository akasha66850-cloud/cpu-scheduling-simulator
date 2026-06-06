import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Save, Download, FileText, ChevronDown, ToggleLeft, ToggleRight,
  Footprints, AlertCircle, X, History,
} from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import ProcessForm from '@/components/ProcessForm'
import ProcessTable from '@/components/ProcessTable'
import GanttChart from '@/components/GanttChart'
import MetricsTable from '@/components/MetricsTable'
import MetricCards from '@/components/MetricCards'
import AlgorithmInfoPanel from '@/components/AlgorithmInfoPanel'
import StepModeControls from '@/components/StepModeControls'
import StateTransitionDiagram from '@/components/StateTransitionDiagram'
import HistoryDrawer from '@/components/HistoryDrawer'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import EmptyState from '@/components/EmptyState'
import FormulaLegend from '@/components/FormulaLegend'
import { exportToPDF, exportToCSV } from '@/utils/exportHelpers'
import { BarChart2 } from 'lucide-react'

// ─── Algorithm options ────────────────────────────────────────
const ALGORITHMS = [
  { value: 'FCFS', label: 'FCFS' },
  { value: 'SJF', label: 'SJF (Non-Preemptive)' },
  { value: 'SRTF', label: 'SRTF (Preemptive)' },
  { value: 'Priority', label: 'Priority (Non-Preemptive)' },
  { value: 'PriorityPreemptive', label: 'Priority (Preemptive)' },
  { value: 'RoundRobin', label: 'Round Robin' },
]

// ─── Error Toast ──────────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 bg-red-900/90 border border-red-600 rounded-xl px-5 py-3 shadow-xl backdrop-blur-md max-w-sm w-full mx-4"
    >
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <span className="text-red-100 text-sm flex-1">{message}</span>
      <button onClick={onClose} className="text-red-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// ─── Success Toast ────────────────────────────────────────────
function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 bg-emerald-900/90 border border-emerald-600 rounded-xl px-5 py-3 shadow-xl backdrop-blur-md"
    >
      <span className="text-emerald-300 text-sm">{message}</span>
    </motion.div>
  )
}

// ─── Main Simulator Page ──────────────────────────────────────
export default function Simulator() {
  const algorithm = useSchedulerStore((s) => s.algorithm)
  const setAlgorithm = useSchedulerStore((s) => s.setAlgorithm)
  const quantum = useSchedulerStore((s) => s.quantum)
  const setQuantum = useSchedulerStore((s) => s.setQuantum)
  const agingEnabled = useSchedulerStore((s) => s.agingEnabled)
  const setAgingEnabled = useSchedulerStore((s) => s.setAgingEnabled)
  const results = useSchedulerStore((s) => s.results)
  const ganttData = useSchedulerStore((s) => s.ganttData)
  const processes = useSchedulerStore((s) => s.processes)
  const runSimulation = useSchedulerStore((s) => s.runSimulation)
  const saveSimulation = useSchedulerStore((s) => s.saveSimulation)
  const error = useSchedulerStore((s) => s.error)
  const clearError = useSchedulerStore((s) => s.clearError)
  const isStepMode = useSchedulerStore((s) => s.isStepMode)
  const setStepMode = useSchedulerStore((s) => s.setStepMode)
  const stepIndex = useSchedulerStore((s) => s.stepIndex)
  const stepForward = useSchedulerStore((s) => s.stepForward)
  const stepBackward = useSchedulerStore((s) => s.stepBackward)
  const runStep = useSchedulerStore((s) => s.runStep)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [selectedPid, setSelectedPid] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  const isRR = algorithm === 'RoundRobin'
  const isPriority = algorithm === 'Priority' || algorithm === 'PriorityPreemptive'

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'r' || e.key === 'R') {
        if (isStepMode) { runStep(); return }
        runSimulation()
      }
      if (e.key === 'c' || e.key === 'C') {
        useSchedulerStore.getState().clearProcesses()
      }
      if (e.key === 's' || e.key === 'S') {
        if (results) {
          saveSimulation()
          setSuccessMsg('Simulation saved!')
        }
      }
      if (e.key === '?') {
        setShortcutsOpen(true)
      }
      if (e.key === 'Escape') {
        setShortcutsOpen(false)
        setHistoryOpen(false)
      }
      if (e.key === 'ArrowRight' && isStepMode) {
        stepForward()
      }
      if (e.key === 'ArrowLeft' && isStepMode) {
        stepBackward()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isStepMode, results, runSimulation, runStep, stepForward, stepBackward, saveSimulation])

  const handleExportPDF = async () => {
    if (!results) return
    setExportLoading(true)
    try {
      await exportToPDF(results, ganttData, algorithm, processes, quantum)
      setSuccessMsg('PDF exported successfully!')
    } catch (err) {
      console.error(err)
    } finally {
      setExportLoading(false)
    }
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

  const visibleGantt = isStepMode && results
    ? ganttData.slice(0, stepIndex)
    : ganttData

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">CPU Scheduler Simulator</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure processes and run scheduling algorithms</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="btn-secondary text-sm px-3 py-2 font-mono"
            title="Keyboard shortcuts"
          >
            ?
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 simulator-layout">
        {/* ── LEFT PANEL ─────────────────────────────── */}
        <div className="lg:w-[420px] shrink-0 space-y-4">
          {/* Algorithm Selector */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">
              <Play className="w-4 h-4 text-indigo-400" />
              Algorithm
            </h2>

            <div className="relative">
              <select
                id="algorithm-select"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="input-field appearance-none pr-8 cursor-pointer"
              >
                {ALGORITHMS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Quantum */}
            <AnimatePresence>
              {isRR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="label">Time Quantum</label>
                  <input
                    id="quantum-input"
                    type="number"
                    min="1"
                    max="20"
                    className="input-field"
                    value={quantum}
                    onChange={(e) => setQuantum(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aging toggle */}
            <AnimatePresence>
              {isPriority && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <label className="text-sm font-medium text-slate-300">Enable Aging</label>
                    <p className="text-xs text-slate-500">Boost waiting process priority every 5t</p>
                  </div>
                  <button
                    onClick={() => setAgingEnabled(!agingEnabled)}
                    className={`transition-colors ${agingEnabled ? 'text-indigo-400' : 'text-slate-500'}`}
                  >
                    {agingEnabled
                      ? <ToggleRight className="w-7 h-7" />
                      : <ToggleLeft className="w-7 h-7" />
                    }
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step mode */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <div>
                <label className="text-sm font-medium text-slate-300">Step Mode</label>
                <p className="text-xs text-slate-500">Advance one block at a time</p>
              </div>
              <button
                onClick={() => setStepMode(!isStepMode)}
                className={`transition-colors ${isStepMode ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                {isStepMode
                  ? <ToggleRight className="w-7 h-7" />
                  : <ToggleLeft className="w-7 h-7" />
                }
              </button>
            </div>
          </div>

          {/* Algorithm info */}
          <AlgorithmInfoPanel algorithm={algorithm} />

          {/* Process Form */}
          <div className="card p-4 space-y-3">
            <h2 className="section-title">
              <Footprints className="w-4 h-4 text-indigo-400" />
              Add Process
            </h2>
            <ProcessForm />
          </div>

          {/* Process Table */}
          {processes.length > 0 && (
            <div className="card p-4 space-y-3">
              <h2 className="section-title">
                Process List
                <span className="ml-auto badge badge-indigo">{processes.length}/20</span>
              </h2>
              <ProcessTable />
            </div>
          )}

          {/* Run button */}
          <button
            id="run-simulation-btn"
            onClick={isStepMode ? runStep : runSimulation}
            disabled={processes.length === 0}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-glow"
          >
            <Play className="w-5 h-5" />
            {isStepMode ? 'Initialize Step Mode' : 'Run Simulation'}
          </button>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {results ? (
            <>
              {/* Step mode controls */}
              {isStepMode && <StepModeControls />}

              {/* Gantt Chart */}
              <div className="card p-5 space-y-3">
                <h2 className="section-title">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Gantt Chart
                  <span className="ml-2 badge badge-indigo text-xs">
                    {algorithm} {isRR ? `q=${quantum}` : ''}
                  </span>
                </h2>
                <GanttChart
                  ganttData={results.ganttData}
                  stepIndex={isStepMode ? stepIndex : undefined}
                />
              </div>

              {/* State transition (for selected process) */}
              {isStepMode && (
                <div className="card p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-300">Process State:</label>
                    <select
                      value={selectedPid || ''}
                      onChange={(e) => setSelectedPid(e.target.value)}
                      className="input-field w-auto text-sm py-1 px-2"
                    >
                      <option value="">Select process</option>
                      {processes.map((p) => (
                        <option key={p.id} value={p.id}>{p.id}</option>
                      ))}
                    </select>
                  </div>
                  {selectedPid && (
                    <StateTransitionDiagram
                      pid={selectedPid}
                      ganttData={results.ganttData}
                      processResults={results.processResults}
                      stepIndex={stepIndex}
                    />
                  )}
                </div>
              )}

              {/* Metric cards */}
              <MetricCards metrics={results.metrics} />

              {/* Formula legend */}
              <FormulaLegend />

              {/* Results table */}
              <div className="card p-5 space-y-3">
                <h2 className="section-title">Detailed Results</h2>
                <MetricsTable processResults={results.processResults} />
              </div>

              {/* Export & save row */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Simulation
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exportLoading}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {exportLoading ? 'Generating...' : 'Export PDF'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
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
        {error && <ErrorToast key="error" message={error} onClose={clearError} />}
        {successMsg && (
          <SuccessToast key="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
