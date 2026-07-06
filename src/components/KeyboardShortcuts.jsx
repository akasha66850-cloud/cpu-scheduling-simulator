import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { key: 'R', description: 'Run simulation' },
  { key: 'C', description: 'Clear all processes' },
  { key: 'S', description: 'Save current simulation' },
  { key: 'Ctrl+Z', description: 'Undo last process addition' },
  { key: '→', description: 'Step forward (step mode)' },
  { key: '←', description: 'Step backward (step mode)' },
  { key: 'M', description: 'Run memory simulation' },
  { key: 'N', description: 'Next step (memory)' },
  { key: 'P', description: 'Run PR simulation' },
  { key: 'D', description: 'Run Deadlock simulation' },
  { key: 'K', description: 'Run Disk simulation' },
  { key: '?', description: 'Show this cheatsheet' },
  { key: 'Esc', description: 'Close dialogs' },
]

export default function KeyboardShortcuts({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="card w-full max-w-sm p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-accent" />
                  <h2 className="font-semibold text-text-primary">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-elevated rounded-[5px] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-text-secondary">{s.description}</span>
                    <kbd className="shrink-0 px-2.5 py-1 text-xs font-mono bg-elevated border border-border-muted rounded text-text-primary shadow-sm">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
