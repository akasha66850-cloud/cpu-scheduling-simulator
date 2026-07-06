import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runDiskAlgorithm } from '../utils/diskAlgorithms'

const DEFAULT_STATE = {
  requestQueueInput: '82 170 43 140 24 16 190',
  initialHead: 50,
  diskSize: 200,
  direction: 'up', // 'up' means towards diskSize - 1, 'down' means towards 0
  activeAlgorithm: 'fcfs', // 'fcfs', 'sstf', 'scan', 'cscan', 'look', 'clook'
  
  results: null,
  stepIndex: 0,
  isStepMode: false,
}

const useDiskStore = create(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setRequestQueueInput: (input) => set({ requestQueueInput: input, results: null, stepIndex: 0 }),
      setInitialHead: (head) => set({ initialHead: head, results: null, stepIndex: 0 }),
      setDiskSize: (size) => set({ diskSize: size, results: null, stepIndex: 0 }),
      setDirection: (dir) => set({ direction: dir, results: null, stepIndex: 0 }),
      setActiveAlgorithm: (algo) => set({ activeAlgorithm: algo, results: null, stepIndex: 0 }),

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
      name: 'disk-store'
    }
  )
)

export default useDiskStore
