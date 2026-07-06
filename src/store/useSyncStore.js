import { create } from 'zustand'
import { runSyncAlgorithm } from '../utils/syncAlgorithms'

const useSyncStore = create((set, get) => ({
  activeProblem: 'mutex',
  params: {
    threads: 5,
    ops: 5,
    pool_size: 3,
    producers: 3,
    consumers: 3,
    buffer_size: 10,
    items: 20,
    readers: 4,
    writers: 2,
    preference: 0, // 0 = readers, 1 = writers
    philosophers: 5,
    meals: 3
  },
  results: null,
  stepIndex: 0,
  isStepMode: false,
  isRunning: false,

  setProblem: (prob) => set({ activeProblem: prob, results: null, stepIndex: 0, isStepMode: false }),
  
  setParam: (key, val) => set((state) => ({
    params: { ...state.params, [key]: val }
  })),

  togglePreference: async () => {
    const newPref = get().params.preference === 0 ? 1 : 0
    set((state) => ({ params: { ...state.params, preference: newPref } }))
    // If results already exist, rerun automatically to show the change
    if (get().results && get().activeProblem === 'reader_writer') {
      await get().runSimulation()
    }
  },

  setStepMode: (mode) => set({ isStepMode: mode }),

  stepForward: () => set((state) => {
    if (!state.results || !state.results.timeline) return state
    return { stepIndex: Math.min(state.stepIndex + 1, state.results.timeline.length) }
  }),

  stepBackward: () => set((state) => {
    return { stepIndex: Math.max(state.stepIndex - 1, 0) }
  }),

  clearAll: () => set({ results: null, stepIndex: 0, isStepMode: false, isRunning: false }),

  runSimulation: async () => {
    set({ isRunning: true })
    const state = get()
    
    // Slight artificial delay for UX
    await new Promise(r => setTimeout(r, 100))

    try {
      const payload = {
        problem: state.activeProblem,
        ...state.params
      }
      
      const out = await runSyncAlgorithm(payload)
      
      set({ 
        results: out, 
        isRunning: false,
        stepIndex: state.isStepMode ? 0 : (out.timeline ? out.timeline.length : 0)
      })
    } catch (err) {
      console.error(err)
      set({ isRunning: false })
    }
  }
}))

export default useSyncStore
