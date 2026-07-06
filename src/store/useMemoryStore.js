import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { runMemoryAlgorithm } from '../utils/memoryAlgorithms'

const INITIAL_BLOCKS = [
  { id: 'B1', size: 100, initialSize: 100 },
  { id: 'B2', size: 500, initialSize: 500 },
  { id: 'B3', size: 200, initialSize: 200 },
  { id: 'B4', size: 300, initialSize: 300 },
  { id: 'B5', size: 600, initialSize: 600 },
]

const INITIAL_PROCESSES = [
  { id: 'P1', size: 212, color: '#6366f1' },
  { id: 'P2', size: 417, color: '#f59e0b' },
  { id: 'P3', size: 112, color: '#10b981' },
  { id: 'P4', size: 426, color: '#ef4444' },
]

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

const useMemoryStore = create(
  persist(
    (set, get) => ({
      blocks: INITIAL_BLOCKS,
      processes: INITIAL_PROCESSES,
      algorithm: 'FirstFit',

      results: null,
      error: null,
      isLoading: false,

      isStepMode: false,
      stepIndex: 0,
      allocationSteps: [],

      history: [],

      setAlgorithm: (algorithm) => set({ algorithm }),

      addBlock: (block) => set((state) => ({
        blocks: [...state.blocks, { ...block, initialSize: block.size }]
      })),
      removeBlock: (id) => set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id)
      })),
      updateBlock: (id, newBlock) => set((state) => ({
        blocks: state.blocks.map((b) => b.id === id ? { ...newBlock, initialSize: newBlock.size } : b)
      })),
      clearBlocks: () => set({ blocks: [] }),

      addProcess: (process) => set((state) => ({ processes: [...state.processes, process] })),
      removeProcess: (id) => set((state) => ({ processes: state.processes.filter((p) => p.id !== id) })),
      updateProcess: (id, newProcess) => set((state) => ({
        processes: state.processes.map((p) => p.id === id ? newProcess : p)
      })),
      clearProcesses: () => set({ processes: [] }),

      loadSample: () => set({ blocks: INITIAL_BLOCKS, processes: INITIAL_PROCESSES, results: null }),

      runSimulation: async () => {
        const { blocks, processes, algorithm } = get()
        if (blocks.length === 0 || processes.length === 0) {
          set({ error: 'Please add at least one block and one process.' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const startTime = performance.now()
          
          let algoName = 'firstFit'
          if (algorithm === 'BestFit') algoName = 'bestFit'
          else if (algorithm === 'WorstFit') algoName = 'worstFit'
          else if (algorithm === 'NextFit') algoName = 'nextFit'

          const payload = {
            algorithm: algoName,
            blocks,
            processes
          }

          const results = await runMemoryAlgorithm(payload)

          const endTime = performance.now()
          results.metrics.executionTime = (endTime - startTime) * 1000 // microseconds

          set({
            results,
            allocationSteps: results.steps,
            stepIndex: results.steps.length,
            error: null,
            isLoading: false
          })
        } catch (err) {
          set({ error: err.message, isLoading: false })
        }
      },

      setStepMode: (val) => set({ isStepMode: val, stepIndex: 0 }),
      stepForward: () => {
        const { allocationSteps, stepIndex } = get()
        if (!allocationSteps) return
        set({ stepIndex: Math.min(stepIndex + 1, allocationSteps.length) })
      },
      stepBackward: () => {
        const { stepIndex } = get()
        set({ stepIndex: Math.max(0, stepIndex - 1) })
      },
      runStep: () => {
        get().runSimulation()
        set({ stepIndex: 1 })
      },
      resetResults: () => set({ results: null, allocationSteps: [], stepIndex: 0, error: null }),

      saveSimulation: () => {
        const { algorithm, blocks, processes, results, history } = get()
        if (!results) return
        
        const newEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'memory',
          algorithm,
          blocksCount: blocks.length,
          processesCount: processes.length,
          successRate: results.metrics.successRate
        }
        
        set({ history: [newEntry, ...history].slice(0, 10) })
      },
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'memory-scheduler-storage',
      partialize: (state) => ({ history: state.history })
    }
  )
)

export default useMemoryStore
