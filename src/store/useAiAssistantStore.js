import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAiAssistantStore = create(
  persist(
    (set, get) => ({
      // --- Chat / Core State ---
      isOpen: false, // Docked side panel
      showWelcome: false,
      messages: [],
      isTyping: false,
      apiKey: '',
      apiProvider: 'groq',
      hasOpenedBefore: false,

      setOpen: (val) => set({ isOpen: val }),
      setShowWelcome: (val) => set({ showWelcome: val }),
      setApiKey: (key) => set({ apiKey: key }),
      setApiProvider: (provider) => set({ apiProvider: provider }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastMessage: (content) =>
        set((state) => {
          const messages = [...state.messages]
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content
          }
          return { messages }
        }),

      setTyping: (val) => set({ isTyping: val }),
      clearChat: () => set({ messages: [] }),

      openWithWelcome: () => {
        const { hasOpenedBefore } = get()
        if (!hasOpenedBefore) {
          set({
            isOpen: true,
            hasOpenedBefore: true,
            messages: [{
              role: 'assistant',
              content: "👋 Hi! I'm OSBot, your OS tutor assistant!\n\nI can help you:\n• Understand CPU scheduling algorithms\n• Interpret your simulation results\n• Explain memory, deadlock, disk scheduling\n• Guide you through using OSLabX\n\nWhat would you like to learn today?",
              id: Date.now()
            }]
          })
        }
      },

      // --- Floating Window State ---
      isFloating: false,
      floatingPosition: { x: 50, y: 50 },
      floatingSize: { width: 400, height: 500 },
      isMinimized: false,
      isMaximized: false,

      setFloating: (val) => set({ isFloating: val }),
      setFloatingPosition: (pos) => set({ floatingPosition: pos }),
      setFloatingSize: (size) => set({ floatingSize: size }),
      toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
      toggleMaximized: () => set((state) => ({ isMaximized: !state.isMaximized })),

      // --- File Upload State (Ephemeral, excluded from persist) ---
      stagedFiles: [],
      isExtracting: false,
      setExtracting: (val) => set({ isExtracting: val }),
      addStagedFile: (fileMeta) => set((state) => ({ stagedFiles: [...state.stagedFiles, fileMeta] })),
      updateStagedFileText: (id, text, status) => set((state) => ({
        stagedFiles: state.stagedFiles.map(f => f.id === id ? { ...f, extractedText: text, status: status } : f)
      })),
      removeStagedFile: (id) => set((state) => ({ stagedFiles: state.stagedFiles.filter(f => f.id !== id) })),
      clearStagedFiles: () => set({ stagedFiles: [] })
    }),
    {
      name: 'oslab-ai-assistant',
      partialize: (state) => ({
        hasOpenedBefore: state.hasOpenedBefore,
        apiKey: state.apiKey,
        apiProvider: state.apiProvider,
        messages: state.messages,
        isFloating: state.isFloating,
        floatingPosition: state.floatingPosition,
        floatingSize: state.floatingSize,
        isMinimized: state.isMinimized,
        isMaximized: state.isMaximized,
      })
    }
  )
)

export default useAiAssistantStore
