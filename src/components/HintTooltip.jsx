import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

export default function HintTooltip({ moduleKey, message }) {
  const showFirstTimeHints = useSettingsStore(s => s.showFirstTimeHints)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (showFirstTimeHints) {
      const seen = localStorage.getItem(`hint_seen_${moduleKey}`)
      if (!seen) {
        setIsVisible(true)
      }
    }
  }, [showFirstTimeHints, moduleKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`hint_seen_${moduleKey}`, 'true')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-accent text-white p-3 rounded-lg shadow-xl"
        >
          <div className="flex gap-2">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm leading-snug flex-1">{message}</p>
            <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-accent" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
