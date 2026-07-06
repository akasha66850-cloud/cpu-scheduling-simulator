import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAiAssistantStore from '../../store/useAiAssistantStore'
import useAuthStore from '../../store/useAuthStore'
import useSettingsStore from '../../store/useSettingsStore'
import { checkOllamaRunning } from '../../utils/ollamaClient'
import ChatBubble from './ChatBubble'
import ChatPanel from './ChatPanel'
import FloatingChatWindow from './FloatingChatWindow'

export default function AiAssistant() {
  const { isOpen, showWelcome, openWithWelcome, setOllamaStatus, setShowWelcome, selectedModel } = useAiAssistantStore()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const showOllamaStatusToast = useSettingsStore(s => s.showOllamaStatusToast)
  const [toastData, setToastData] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    checkOllamaRunning().then(running => {
      setOllamaStatus(running)
      if (showOllamaStatusToast) {
        setToastData({
          msg: running ? `✓ OSBot connected — ${selectedModel} ready` : '✗ OSBot offline — run: ollama serve',
          type: running ? 'success' : 'error'
        })
        setTimeout(() => setToastData(null), 3000)
      }
    })
  }, [isAuthenticated, showOllamaStatusToast, selectedModel])

  useEffect(() => {
    if (showWelcome && isAuthenticated) {
      const timer = setTimeout(() => {
        openWithWelcome()
        setShowWelcome(false)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <>
      <AnimatePresence>
        {toastData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 left-4 z-[9999] px-4 py-2 rounded-md shadow-lg text-sm font-semibold border ${
              toastData.type === 'success' 
                ? 'bg-emerald-900/90 text-emerald-300 border-emerald-500/50' 
                : 'bg-rose-900/90 text-rose-300 border-rose-500/50'
            }`}
          >
            {toastData.msg}
          </motion.div>
        )}
      </AnimatePresence>
      <ChatBubble />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              right: 0,
              zIndex: 9999,
              width: '380px',
              height: '100vh',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <ChatPanel />
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingChatWindow />
    </>
  )
}
