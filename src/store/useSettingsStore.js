import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      // ── CATEGORY 1: APPEARANCE ──────────────────────────────
      theme: 'dark',              // 'dark' | 'light' | 'system'
      accentColor: '#6366f1',     // hex color string
      animationsEnabled: true,    // boolean

      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setAnimationsEnabled: (val) => set({ animationsEnabled: val }),

      // ── CATEGORY 2: SIMULATOR DEFAULTS ─────────────────────
      defaultAlgorithm: 'FCFS',   // algorithm name string
      defaultQuantum: 2,          // number
      defaultProcessCount: 5,     // number (3-10)
      autoRunOnLoad: false,       // boolean
      showFormulas: true,         // boolean
      starvationThreshold: 3,     // multiplier of avg burst time

      setDefaultAlgorithm: (val) => set({ defaultAlgorithm: val }),
      setDefaultQuantum: (val) => set({ defaultQuantum: Number(val) }),
      setDefaultProcessCount: (val) => set({ defaultProcessCount: Number(val) }),
      setAutoRunOnLoad: (val) => set({ autoRunOnLoad: val }),
      setShowFormulas: (val) => set({ showFormulas: val }),
      setStarvationThreshold: (val) => set({ starvationThreshold: Number(val) }),

      // ── CATEGORY 3: NOTIFICATIONS & HINTS ──────────────────
      showStarvationWarnings: true,   // boolean
      showBeladyAlerts: true,         // boolean
      showDeadlockAlerts: true,       // boolean
      showFirstTimeHints: true,       // boolean
      showKeyboardShortcutBar: true,  // boolean
      showOllamaStatusToast: true,    // boolean

      setShowStarvationWarnings: (val) => set({ showStarvationWarnings: val }),
      setShowBeladyAlerts: (val) => set({ showBeladyAlerts: val }),
      setShowDeadlockAlerts: (val) => set({ showDeadlockAlerts: val }),
      setShowFirstTimeHints: (val) => set({ showFirstTimeHints: val }),
      setShowKeyboardShortcutBar: (val) => set({ showKeyboardShortcutBar: val }),
      setShowOllamaStatusToast: (val) => set({ showOllamaStatusToast: val }),

      // ── CATEGORY 4: DATA & HISTORY ─────────────────────────
      maxSavedSimulations: 10,    // number: 5 | 10 | 20 | 999
      autoSaveLastRun: true,      // boolean

      setMaxSavedSimulations: (val) => set({ maxSavedSimulations: Number(val) }),
      setAutoSaveLastRun: (val) => set({ autoSaveLastRun: val }),

      // ── CATEGORY 5: KEYBOARD SHORTCUTS ─────────────────────
      shortcutsEnabled: true,     // boolean — master toggle
      shortcutRunSim: 'r',
      shortcutClearAll: 'c',
      shortcutSaveSim: 's',
      shortcutNextStep: 'ArrowRight',
      shortcutPrevStep: 'ArrowLeft',
      shortcutToggleTheme: 'd',

      setShortcutsEnabled: (val) => set({ shortcutsEnabled: val }),
      setShortcut: (key, value) => set((state) => ({ [key]: value })),

      // ── RESET ───────────────────────────────────────────────
      resetAllSettings: () => set({
        theme: 'dark', accentColor: '#6366f1', animationsEnabled: true,
        defaultAlgorithm: 'FCFS', defaultQuantum: 2, defaultProcessCount: 5,
        autoRunOnLoad: false, showFormulas: true, starvationThreshold: 3,
        showStarvationWarnings: true, showBeladyAlerts: true,
        showDeadlockAlerts: true, showFirstTimeHints: true,
        showKeyboardShortcutBar: true, showOllamaStatusToast: true,
        maxSavedSimulations: 10, autoSaveLastRun: true,
        shortcutsEnabled: true, shortcutRunSim: 'r',
        shortcutClearAll: 'c', shortcutSaveSim: 's',
        shortcutNextStep: 'ArrowRight', shortcutPrevStep: 'ArrowLeft',
        shortcutToggleTheme: 'd'
      }),
    }),
    { name: 'oslab-settings' }
  )
)

export default useSettingsStore
