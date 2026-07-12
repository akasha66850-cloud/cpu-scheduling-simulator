import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_REFERENCE_STRING = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1'

const usePageReplacementStore = create(
  persist(
    (set) => ({
      referenceString: DEFAULT_REFERENCE_STRING,
      frameCount: 3,
      history: [],
      
      setReferenceString: (refStr) => set({ referenceString: refStr }),
      setFrameCount: (count) => set({ frameCount: count }),
      
      saveSimulation: (simulation) =>
        set((state) => ({
          history: [
            { id: Date.now().toString(), timestamp: Date.now(), ...simulation },
            ...state.history,
          ].slice(0, 10),
        })),
        
      deleteHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
        
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'page-replacement-storage-v2',
    }
  )
)

export default usePageReplacementStore
