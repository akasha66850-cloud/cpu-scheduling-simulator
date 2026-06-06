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
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-semibold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">{s.description}</span>
                    <kbd className="shrink-0 px-2.5 py-1 text-xs font-mono bg-slate-800 border border-slate-600 rounded text-slate-200 shadow-sm">
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
