import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'


export default function BankersMatrix() {
  const { numProcesses, numResources, allocation, maxDemand, available, results } = useDeadlockStore()

  const need = maxDemand.map((row, i) =>
    row.map((maxVal, j) => Math.max(0, maxVal - allocation[i][j]))
  )

  const renderTable = (matrix, title) => (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">{title}</span>
      <table className="border-collapse">
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => (
                <td key={j} className="p-1.5">
                  <div className="w-8 h-8 rounded bg-elevated border border-border-muted flex items-center justify-center text-sm font-mono text-text-secondary">
                    {val}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderVectorRow = (vector, title) => (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">{title}</span>
      <div className="flex">
        {vector.map((val, j) => (
          <div key={j} className="p-1.5">
            <div className="w-8 h-8 rounded bg-accent border border-accent flex items-center justify-center text-sm font-mono text-indigo-300 font-bold">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Safe sequence pill chain
  const isSafe = results?.isSafe
  const safeSequence = results?.safeSequence || []

  return (
    <div className="card p-6 space-y-6">
      <h2 className="section-title">Banker's State Matrix</h2>
      
      <div className="flex flex-col lg:flex-row gap-8 justify-center overflow-x-auto pb-4">
        <div className="flex flex-col items-center justify-center pr-4 border-r border-border">
          <div className="h-6 mb-2"></div>
          {Array(numProcesses).fill(0).map((_, i) => (
            <div key={i} className="h-[44px] flex items-center justify-center font-mono text-sm text-text-muted">
              P{i}
            </div>
          ))}
        </div>

        {renderTable(maxDemand, 'Max')}
        {renderTable(allocation, 'Allocation')}
        {renderTable(need, 'Need')}
        
        <div className="flex flex-col justify-between">
          {renderVectorRow(available, 'Available')}
        </div>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-[8px] border ${isSafe ? 'bg-emerald-500/10 border-green' : 'bg-rose-500/10 border-rose-500/20'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              {isSafe ? <CheckCircle2 className="w-6 h-6 text-green" /> : <XCircle className="w-6 h-6 text-red" />}
              <span className={`font-bold text-lg ${isSafe ? 'text-green' : 'text-red'}`}>
                {isSafe ? 'Safe State Detected' : 'Unsafe State Detected'}
              </span>
            </div>

            {isSafe && safeSequence.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted">Safe Sequence:</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {safeSequence.map((p, idx) => (
                    <React.Fragment key={idx}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="px-3 py-1 bg-emerald-500/20 border border-green text-green font-mono rounded-full text-sm font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      >
                        P{p}
                      </motion.div>
                      {idx < safeSequence.length - 1 && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 + 0.05 }}
                          className="text-text-muted"
                        >
                          →
                        </motion.span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
            
            {!isSafe && (
              <p className="text-sm text-rose-300/80 mt-2">
                The system cannot guarantee that all processes will be able to complete their execution without entering a deadlock.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
