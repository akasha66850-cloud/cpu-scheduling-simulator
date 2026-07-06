import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runDeadlockAlgorithm } from '../utils/deadlockAlgorithms'

const DEFAULT_STATE = {
  numProcesses: 3,
  numResources: 3,
  // matrices are [processIndex][resourceIndex]
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2]
  ],
  maxDemand: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2]
  ],
  // request matrix for detection/recovery
  request: [
    [0, 0, 0],
    [2, 0, 2],
    [0, 0, 0]
  ],
  available: [3, 3, 2],
  
  // Results
  activeStrategy: 'bankers', // 'bankers', 'detection', 'recoveryA', 'recoveryB', 'preventionHoldWait', 'preventionCircWait'
  results: null,
  stepIndex: 0,
  isStepMode: false,
}

const useDeadlockStore = create(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setDimensions: (p, r) => set((state) => {
        const allocation = Array(p).fill(0).map((_, i) => Array(r).fill(0).map((_, j) => state.allocation[i]?.[j] || 0))
        const maxDemand = Array(p).fill(0).map((_, i) => Array(r).fill(0).map((_, j) => state.maxDemand[i]?.[j] || 0))
        const request = Array(p).fill(0).map((_, i) => Array(r).fill(0).map((_, j) => state.request[i]?.[j] || 0))
        const available = Array(r).fill(0).map((_, j) => state.available[j] || 0)
        return { numProcesses: p, numResources: r, allocation, maxDemand, request, available, results: null, stepIndex: 0 }
      }),

      setAllocation: (i, j, val) => set((state) => {
        const next = [...state.allocation]
        next[i] = [...next[i]]
        next[i][j] = val
        return { allocation: next, results: null, stepIndex: 0 }
      }),

      setMaxDemand: (i, j, val) => set((state) => {
        const next = [...state.maxDemand]
        next[i] = [...next[i]]
        next[i][j] = val
        return { maxDemand: next, results: null, stepIndex: 0 }
      }),

      setRequest: (i, j, val) => set((state) => {
        const next = [...state.request]
        next[i] = [...next[i]]
        next[i][j] = val
        return { request: next, results: null, stepIndex: 0 }
      }),

      setAvailable: (j, val) => set((state) => {
        const next = [...state.available]
        next[j] = val
        return { available: next, results: null, stepIndex: 0 }
      }),

      setActiveStrategy: (strategy) => set({ activeStrategy: strategy, results: null, stepIndex: 0 }),

      setResults: (results, isStepMode = false) => set({ results, isStepMode, stepIndex: 0 }),
      
      stepForward: () => set((state) => {
        if (!state.results || !state.results.steps) return state
        return { stepIndex: Math.min(state.stepIndex + 1, state.results.steps.length - 1) }
      }),
      
      stepBackward: () => set((state) => ({ stepIndex: Math.max(state.stepIndex - 1, 0) })),
      
      resetSimulation: () => set({ results: null, stepIndex: 0, isStepMode: false }),
      resetAll: () => set({ ...DEFAULT_STATE })
    }),
    {
      name: 'deadlock-store'
    }
  )
)

export default useDeadlockStore
