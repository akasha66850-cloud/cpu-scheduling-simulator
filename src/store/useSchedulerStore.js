import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import runFCFS from '@/algorithms/fcfs'
import runSJF from '@/algorithms/sjf'
import runSRTF from '@/algorithms/srtf'
import runPriority from '@/algorithms/priority'
import runPriorityPreemptive from '@/algorithms/priorityPreemptive'
import runRoundRobin from '@/algorithms/roundRobin'
import { computeAggregateMetrics } from '@/utils/metrics'

// ─── Constants ───────────────────────────────────────────────
const MAX_HISTORY = 10
const ALGORITHM_MAP = {
  FCFS: runFCFS,
  SJF: runSJF,
  SRTF: runSRTF,
  Priority: runPriority,
  PriorityPreemptive: runPriorityPreemptive,
  RoundRobin: runRoundRobin,
}

const SAMPLE_PROCESSES = [
  { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3 },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 2 },
  { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4 },
  { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 2 },
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// ─── Store Definition ─────────────────────────────────────────
const useSchedulerStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────
      processes: [],
      algorithm: 'FCFS',
      quantum: 2,
      results: null,         // { ganttData, processResults, metrics }
      ganttData: [],
      darkMode: true,
      history: [],
      
      // Step mode
      isStepMode: false,
      stepIndex: 0,
      agingEnabled: false,
      
      // UI state (not persisted)
      error: null,

      // ── Process CRUD ───────────────────────────────────────
      addProcess: (process) => set((state) => {
        if (state.processes.length >= 20) return state
        // Deduplicate ID
        const ids = state.processes.map((p) => p.id)
        if (ids.includes(process.id)) return state
        return { processes: [...state.processes, process] }
      }),

      removeProcess: (id) => set((state) => ({
        processes: state.processes.filter((p) => p.id !== id),
      })),

      updateProcess: (id, fields) => set((state) => ({
        processes: state.processes.map((p) =>
          p.id === id ? { ...p, ...fields } : p
        ),
      })),

      clearProcesses: () => set({ processes: [], results: null, ganttData: [], stepIndex: 0 }),

      loadSampleProcesses: () => set({ processes: SAMPLE_PROCESSES, results: null, ganttData: [] }),

      // ── Algorithm & Options ────────────────────────────────
      setAlgorithm: (name) => set({ algorithm: name, results: null }),

      setQuantum: (value) => set({ quantum: Math.max(1, parseInt(value) || 1) }),

      setAgingEnabled: (val) => set({ agingEnabled: val }),

      // ── Simulation ─────────────────────────────────────────
      runSimulation: () => {
        const { processes, algorithm, quantum, agingEnabled } = get()
        
        if (processes.length === 0) {
          set({ error: 'Please add at least one process before running.' })
          return
        }

        try {
          const algoFn = ALGORITHM_MAP[algorithm]
          if (!algoFn) throw new Error(`Unknown algorithm: ${algorithm}`)

          const { ganttData, processResults } = algoFn(processes, {
            quantum,
            agingEnabled,
          })

          const metrics = computeAggregateMetrics(processResults, ganttData)

          set({
            results: { ganttData, processResults, metrics },
            ganttData,
            stepIndex: ganttData.length,
            error: null,
          })
        } catch (err) {
          set({ error: `Simulation error: ${err.message}` })
          console.error(err)
        }
      },

      resetResults: () => set({ results: null, ganttData: [], stepIndex: 0, error: null }),

      // ── Step Mode ──────────────────────────────────────────
      setStepMode: (val) => set({ isStepMode: val, stepIndex: 0 }),

      stepForward: () => {
        const { results, stepIndex } = get()
        if (!results) return
        set({ stepIndex: Math.min(stepIndex + 1, results.ganttData.length) })
      },

      stepBackward: () => {
        const { stepIndex } = get()
        set({ stepIndex: Math.max(0, stepIndex - 1) })
      },

      runStep: () => {
        const { processes, algorithm, quantum, agingEnabled } = get()
        if (processes.length === 0) {
          set({ error: 'Please add at least one process before stepping.' })
          return
        }
        try {
          const algoFn = ALGORITHM_MAP[algorithm]
          const { ganttData, processResults } = algoFn(processes, { quantum, agingEnabled })
          const metrics = computeAggregateMetrics(processResults, ganttData)
          set({
            results: { ganttData, processResults, metrics },
            ganttData,
            stepIndex: 1,
            error: null,
          })
        } catch (err) {
          set({ error: `Simulation error: ${err.message}` })
        }
      },

      // ── Save / Load ────────────────────────────────────────
      saveSimulation: () => {
        const { processes, algorithm, quantum, results, history } = get()
        if (!results) return

        const newEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          algorithm,
          quantum,
          processes: [...processes],
          results,
          ganttData: results.ganttData,
        }

        const updated = [newEntry, ...history].slice(0, MAX_HISTORY)
        set({ history: updated })
      },

      loadSimulation: (id) => {
        const { history } = get()
        const entry = history.find((h) => h.id === id)
        if (!entry) return

        set({
          processes: entry.processes,
          algorithm: entry.algorithm,
          quantum: entry.quantum,
          results: entry.results,
          ganttData: entry.ganttData,
          stepIndex: entry.ganttData.length,
        })
      },

      deleteHistoryEntry: (id) => set((state) => ({
        history: state.history.filter((h) => h.id !== id),
      })),

      // ── Theme ──────────────────────────────────────────────
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // ── Error ──────────────────────────────────────────────
      clearError: () => set({ error: null }),
    }),
    {
      name: 'cpu-scheduler-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        history: state.history,
        processes: state.processes,
        algorithm: state.algorithm,
        quantum: state.quantum,
      }),
    }
  )
)

export default useSchedulerStore
