import React from 'react'
import { X, History, Trash2, Clock, Cpu, ChevronRight } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const ALGO_LABELS = {
  FCFS: 'FCFS',
  SJF: 'SJF',
  SRTF: 'SRTF',
  Priority: 'Priority',
  PriorityPreemptive: 'Priority Pre.',
  RoundRobin: 'Round Robin',
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryDrawer({ isOpen, onClose }) {
  const history = useSchedulerStore((s) => s.history)
  const loadSimulation = useSchedulerStore((s) => s.loadSimulation)
  const deleteHistoryEntry = useSchedulerStore((s) => s.deleteHistoryEntry)
  const navigate = useNavigate()

  const handleLoad = (id) => {
    loadSimulation(id)
    onClose()
    navigate('/simulator')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                <h2 className="font-semibold text-text-primary">Simulation History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-elevated rounded-[5px] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No saved simulations yet.</p>
                  <p className="text-xs mt-1">Run a simulation and save it.</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="card p-3 hover:border-border-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="badge badge-indigo text-xs">
                          {ALGO_LABELS[entry.algorithm] || entry.algorithm}
                        </span>
                        {entry.algorithm === 'RoundRobin' && (
                          <span className="ml-1 text-xs text-text-muted">q={entry.quantum}</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteHistoryEntry(entry.id)}
                        className="p-1 text-text-muted hover:text-red transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {entry.processes.length} processes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLoad(entry.id)}
                      className="btn-secondary w-full text-xs flex items-center justify-center gap-1"
                    >
                      Restore Simulation
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
