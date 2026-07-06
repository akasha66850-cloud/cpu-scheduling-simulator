import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runCPUScheduling } from '@/utils/cpuAlgorithms'
import useSettingsStore from './useSettingsStore'

// ─── Constants ────────────────────────────────────────────────
const MAX_HISTORY  = 10
const API_BASE     = '/api/v1'

const SAMPLE_PROCESSES = [
  { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: '#6366f1' },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: '#f59e0b' },
  { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 2, color: '#10b981' },
  { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4, color: '#ef4444' },
  { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 2, color: '#8b5cf6' },
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
      results: null,
      ganttData: [],
      darkMode: true,
      history: [],
      isLoading: false,

      // MLQ options
      mlqQ0Quantum: 2,
      mlqQ1Quantum: 4,

      // MLFQ options
      mlfqQ0: 2,
      mlfqQ1: 4,
      mlfqBoost: 20,

      // Step mode
      isStepMode: false,
      stepIndex: 0,
      agingEnabled: false,

      // UI state (not persisted)
      error: null,

      // ── Process CRUD ───────────────────────────────────────
      addProcess: (process) => set((state) => {
        if (state.processes.length >= 20) return state
        const ids = state.processes.map((p) => p.id)
        if (ids.includes(process.id)) return state
        return { processes: [...state.processes, process] }
      }),

      removeProcess: (id) => set((state) => ({
        processes: state.processes.filter((p) => p.id !== id),
      })),

      updateProcess: (id, fields) => set((state) => ({
        processes: state.processes.map((p) => p.id === id ? { ...p, ...fields } : p),
      })),

      clearProcesses: () => set({ processes: [], results: null, ganttData: [], stepIndex: 0 }),

      loadSampleProcesses: () => set(() => {
        const { defaultProcessCount } = useSettingsStore.getState()
        const nextColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']
        const samples = []
        for (let i = 0; i < defaultProcessCount; i++) {
          samples.push({
            id: `P${i+1}`,
            arrivalTime: Math.floor(Math.random() * 5),
            burstTime: Math.floor(Math.random() * 8) + 2,
            priority: Math.floor(Math.random() * 5) + 1,
            color: nextColors[i % nextColors.length]
          })
        }
        return { processes: samples, results: null, ganttData: [] }
      }),

      // ── Algorithm & Options ────────────────────────────────
      setAlgorithm: (name) => set({ algorithm: name, results: null }),

      setQuantum: (value) => set({ quantum: Math.max(1, parseInt(value) || 1) }),

      setAgingEnabled: (val) => set({ agingEnabled: val }),

      // MLQ options
      setMlqQ0Quantum: (v) => set({ mlqQ0Quantum: Math.max(1, parseInt(v) || 1) }),
      setMlqQ1Quantum: (v) => set({ mlqQ1Quantum: Math.max(1, parseInt(v) || 1) }),

      // MLFQ options
      setMlfqQ0:    (v) => set({ mlfqQ0:    Math.max(1, parseInt(v) || 1) }),
      setMlfqQ1:    (v) => set({ mlfqQ1:    Math.max(1, parseInt(v) || 1) }),
      setMlfqBoost: (v) => set({ mlfqBoost: Math.max(5, parseInt(v) || 20) }),

      // ── Simulation (Native JS) ─────────────────────
      runSimulation: () => {
        const {
          processes, algorithm, quantum, agingEnabled,
          mlqQ0Quantum, mlqQ1Quantum, mlfqQ0, mlfqQ1, mlfqBoost,
        } = get()

        if (processes.length === 0) {
          set({ error: 'Please add at least one process before running.' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const { ganttData, processResults, metrics } = runCPUScheduling(algorithm, processes, {
            quantum, agingEnabled,
            mlqQ0Quantum, mlqQ1Quantum,
            mlfqQ0, mlfqQ1, mlfqBoost,
          })

          set({
            results: { ganttData, processResults, metrics },
            ganttData,
            stepIndex: ganttData.length,
            error: null,
            isLoading: false,
          })
          
          if (useSettingsStore.getState().autoSaveLastRun) {
            get().saveSimulation(true)
          }
        } catch (err) {
          set({ error: `Simulation failed: ${err.message}`, isLoading: false })
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
        const {
          processes, algorithm, quantum, agingEnabled,
          mlqQ0Quantum, mlqQ1Quantum, mlfqQ0, mlfqQ1, mlfqBoost,
        } = get()

        if (processes.length === 0) {
          set({ error: 'Please add at least one process before stepping.' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const { ganttData, processResults, metrics } = runCPUScheduling(algorithm, processes, {
            quantum, agingEnabled,
            mlqQ0Quantum, mlqQ1Quantum,
            mlfqQ0, mlfqQ1, mlfqBoost,
          })

          set({
            results: { ganttData, processResults, metrics },
            ganttData,
            stepIndex: 1,
            error: null,
            isLoading: false,
          })
        } catch (err) {
          set({ error: `Step mode failed: ${err.message}`, isLoading: false })
        }
      },

      // ── Save / Load ────────────────────────────────────────
      saveSimulation: (autoSaved = false) => {
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
          autoSaved: autoSaved === true
        }

        const maxHistory = useSettingsStore.getState().maxSavedSimulations
        const updated = [newEntry, ...history].slice(0, maxHistory === 999 ? undefined : maxHistory)
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

      clearHistory: () => set({ history: [] }),

      // ── Theme ──────────────────────────────────────────────
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // ── Error ──────────────────────────────────────────────
      clearError: () => set({ error: null }),
    }),
    {
      name: 'cpu-scheduler-store',
      partialize: (state) => ({
        darkMode:     state.darkMode,
        history:      state.history,
        processes:    state.processes,
        algorithm:    state.algorithm,
        quantum:      state.quantum,
        mlqQ0Quantum: state.mlqQ0Quantum,
        mlqQ1Quantum: state.mlqQ1Quantum,
        mlfqQ0:       state.mlfqQ0,
        mlfqQ1:       state.mlfqQ1,
        mlfqBoost:    state.mlfqBoost,
      }),
    }
  )
)

export default useSchedulerStore
