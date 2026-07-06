import React from 'react'
import { motion } from 'framer-motion'
import { Settings2, Database, AlertCircle } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'

export const DEADLOCK_STRATEGIES = [
  { id: 'bankers', label: 'Avoidance (Banker\'s)', desc: 'Banker\'s Algorithm: Avoids deadlock by simulating allocation and ensuring the system will remain in a Safe State before granting resources.' },
  { id: 'detection', label: 'Detection (RAG)', desc: 'Resource Allocation Graph (RAG): Detects existing deadlocks by finding cycles in the resource-wait graph.' },
  { id: 'recoveryA', label: 'Recovery (Terminate)', desc: 'Process Termination: Breaks a deadlock by forcibly terminating one of the involved processes and reclaiming its resources.' },
  { id: 'recoveryB', label: 'Recovery (Preempt)', desc: 'Resource Preemption: Breaks a deadlock by forcibly taking resources away from a process without terminating it.' },
  { id: 'preventionHoldWait', label: 'Prevention (Hold & Wait)', desc: 'Hold & Wait Prevention: Requires a process to request all its resources at once, or drop existing resources before requesting new ones.' },
  { id: 'preventionCircWait', label: 'Prevention (Circ Wait)', desc: 'Circular Wait Prevention: Assigns a global order to resources and forces processes to request resources in increasing order only.' }
]

export default function DeadlockInput() {
  const {
    numProcesses, numResources,
    allocation, maxDemand, available,
    setDimensions, setAllocation, setMaxDemand, setAvailable,
    activeStrategy, setActiveStrategy
  } = useDeadlockStore()

  // Calculate Need Matrix
  const needMatrix = maxDemand.map((row, i) => 
    row.map((maxVal, j) => Math.max(0, maxVal - allocation[i][j]))
  )

  const handleDimChange = (type, val) => {
    let p = numProcesses
    let r = numResources
    if (type === 'p') p = parseInt(val, 10)
    if (type === 'r') r = parseInt(val, 10)
    setDimensions(p, r)
  }

  const renderMatrix = (matrix, setter, title) => (
    <div className="card p-4 overflow-x-auto min-w-[250px]">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">{title}</h3>
      <table className="w-full text-center">
        <thead>
          <tr>
            <th className="w-10"></th>
            {Array(numResources).fill(0).map((_, j) => (
              <th key={j} className="text-xs text-text-muted font-mono pb-2">R{j}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="text-xs text-text-muted font-mono pr-2 pb-2">P{i}</td>
              {row.map((val, j) => {
                // Validation styling
                let isInvalid = false
                if (title === 'Allocation') {
                  isInvalid = val > maxDemand[i][j]
                } else if (title === 'Max Demand') {
                  isInvalid = val < allocation[i][j]
                }
                
                return (
                  <td key={j} className="pb-2 px-1">
                    <input
                      type="number"
                      min="0"
                      value={val}
                      onChange={(e) => setter(i, j, parseInt(e.target.value) || 0)}
                      className={`w-full bg-surface border rounded px-2 py-1.5 text-sm focus:outline-none transition-colors ${
                        isInvalid ? 'border-rose-500 text-red focus:border-rose-400' : 'border-border-muted text-text-primary focus:border-accent'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderReadOnlyMatrix = (matrix, title) => (
    <div className="card p-4 overflow-x-auto min-w-[250px] bg-surface">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">{title}</h3>
      <table className="w-full text-center">
        <thead>
          <tr>
            <th className="w-10"></th>
            {Array(numResources).fill(0).map((_, j) => (
              <th key={j} className="text-xs text-text-muted font-mono pb-2">R{j}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="text-xs text-text-muted font-mono pr-2 pb-2">P{i}</td>
              {row.map((val, j) => (
                <td key={j} className="pb-2 px-1">
                  <div className="w-full bg-base border border-border rounded px-2 py-1.5 text-sm font-mono text-indigo-300">
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

  const renderVector = (vector, setter, title) => (
    <div className="card p-4 overflow-x-auto min-w-[250px]">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">{title}</h3>
      <table className="w-full text-center">
        <thead>
          <tr>
            {Array(numResources).fill(0).map((_, j) => (
              <th key={j} className="text-xs text-text-muted font-mono pb-2">R{j}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {vector.map((val, j) => (
              <td key={j} className="pb-2 px-1">
                <input
                  type="number"
                  min="0"
                  value={val}
                  onChange={(e) => setter(j, parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border-muted rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )

  // Validate overall state
  let hasErrors = false
  for(let i=0; i<numProcesses; i++) {
    for(let j=0; j<numResources; j++) {
      if (allocation[i][j] > maxDemand[i][j]) hasErrors = true
    }
  }

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
            <Settings2 className="w-4 h-4 text-accent" />
            System Dimensions
          </label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Processes (P)</span>
                <span>{numProcesses}</span>
              </div>
              <input type="range" min="1" max="6" value={numProcesses} onChange={(e) => handleDimChange('p', e.target.value)} className="w-full accent-indigo-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Resources (R)</span>
                <span>{numResources}</span>
              </div>
              <input type="range" min="1" max="5" value={numResources} onChange={(e) => handleDimChange('r', e.target.value)} className="w-full accent-indigo-500" />
            </div>
          </div>
        </div>

        <div className="card p-4 lg:col-span-2 flex flex-col">
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
            <Database className="w-4 h-4 text-accent" />
            Active Strategy
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEADLOCK_STRATEGIES.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveStrategy(s.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeStrategy === s.id 
                    ? 'bg-accent text-text-primary shadow-md shadow-indigo-500/20' 
                    : 'bg-elevated text-text-muted hover:bg-overlay hover:text-text-primary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[5px] flex-1 flex items-center">
            <p className="text-xs text-indigo-200 leading-relaxed">
              {DEADLOCK_STRATEGIES.find(s => s.id === activeStrategy)?.desc}
            </p>
          </div>
        </div>
      </div>

      {hasErrors && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[5px] flex items-center gap-3 text-red text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Validation Error: Allocation cannot exceed Max Demand for any process/resource.</p>
        </motion.div>
      )}

      {/* Matrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {renderMatrix(allocation, setAllocation, 'Allocation Matrix')}
        {renderMatrix(maxDemand, setMaxDemand, 'Max Demand Matrix')}
        {renderReadOnlyMatrix(needMatrix, 'Need Matrix (Max - Alloc)')}
        {renderVector(available, setAvailable, 'Available Vector')}
      </div>
    </div>
  )
}
