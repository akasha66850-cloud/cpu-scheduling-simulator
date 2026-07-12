import React, { useState, useCallback, useRef } from 'react'
import { Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react'
import useMemoryStore from '@/store/useMemoryStore'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4',
]

export default function MemoryForm() {
  const blocks = useMemoryStore(s => s.blocks)
  const addBlock = useMemoryStore(s => s.addBlock)
  const removeBlock = useMemoryStore(s => s.removeBlock)
  const clearBlocks = useMemoryStore(s => s.clearBlocks)

  const processes = useMemoryStore(s => s.processes)
  const addProcess = useMemoryStore(s => s.addProcess)
  const removeProcess = useMemoryStore(s => s.removeProcess)
  const clearProcesses = useMemoryStore(s => s.clearProcesses)

  const loadSample = useMemoryStore(s => s.loadSample)

  const [blockSize, setBlockSize] = useState('')
  const [processSize, setProcessSize] = useState('')
  const [processColor, setProcessColor] = useState(COLORS[0])
  const [errors, setErrors] = useState({})

  const blockInputRef = useRef()
  const processInputRef = useRef()

  const handleAddBlock = (e) => {
    e.preventDefault()
    const size = parseInt(blockSize, 10)
    if (isNaN(size) || size <= 0) {
      setErrors({ ...errors, block: 'Must be > 0' })
      return
    }
    if (blocks.length >= 20) {
      setErrors({ ...errors, block: 'Max 20 blocks reached' })
      return
    }
    const num = blocks.map(b => parseInt(b.id.replace(/\D/g, ''), 10) || 0)
    const id = `B${blocks.length === 0 ? 1 : Math.max(...num) + 1}`
    addBlock({ id, size })
    setBlockSize('')
    setErrors({ ...errors, block: null })
  }

  const handleAddProcess = (e) => {
    e.preventDefault()
    const size = parseInt(processSize, 10)
    if (isNaN(size) || size <= 0) {
      setErrors({ ...errors, process: 'Must be > 0' })
      return
    }
    if (processes.length >= 20) {
      setErrors({ ...errors, process: 'Max 20 processes reached' })
      return
    }
    const num = processes.map(p => parseInt(p.id.replace(/\D/g, ''), 10) || 0)
    const id = `P${processes.length === 0 ? 1 : Math.max(...num) + 1}`
    addProcess({ id, size, color: processColor })
    
    const nextColor = COLORS[(processes.length + 1) % COLORS.length]
    setProcessColor(nextColor)
    setProcessSize('')
    setErrors({ ...errors, process: null })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button onClick={loadSample} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Sample Data
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Memory Blocks Form */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">Memory Blocks ({blocks.length})</h3>
            <button onClick={clearBlocks} className="text-xs text-red hover:text-red-300">Clear All</button>
          </div>
          
          <form onSubmit={handleAddBlock} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                ref={blockInputRef}
                type="number"
                min="1"
                placeholder="Block Size"
                className={`input-field w-full ${errors.block ? 'input-error' : ''}`}
                value={blockSize}
                onChange={(e) => setBlockSize(e.target.value)}
              />
              <AnimatePresence>
                {errors.block && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red mt-1">{errors.block}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <button type="submit" className="btn-primary p-2 shrink-0"><Plus className="w-5 h-5" /></button>
          </form>

          <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-elevated p-2 rounded-[5px] border border-border-muted">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-text-secondary font-bold w-6">{b.id}</span>
                  <span className="text-xs text-text-muted">{b.size} units</span>
                </div>
                <button onClick={() => removeBlock(b.id)} className="text-text-muted hover:text-red transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {blocks.length === 0 && <p className="text-xs text-text-muted text-center py-4">No blocks added</p>}
          </div>
        </div>

        {/* Processes Form */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">Processes ({processes.length})</h3>
            <button onClick={clearProcesses} className="text-xs text-red hover:text-red-300">Clear All</button>
          </div>
          
          <form onSubmit={handleAddProcess} className="flex gap-2 items-start">
            <input
              type="color"
              className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent shrink-0"
              value={processColor}
              onChange={(e) => setProcessColor(e.target.value)}
            />
            <div className="flex-1">
              <input
                ref={processInputRef}
                type="number"
                min="1"
                placeholder="Process Size"
                className={`input-field w-full ${errors.process ? 'input-error' : ''}`}
                value={processSize}
                onChange={(e) => setProcessSize(e.target.value)}
              />
              <AnimatePresence>
                {errors.process && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red mt-1">{errors.process}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <button type="submit" className="btn-primary p-2 shrink-0"><Plus className="w-5 h-5" /></button>
          </form>

          <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {processes.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-elevated p-2 rounded-[5px] border border-border-muted">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-mono text-sm text-text-secondary font-bold w-6">{p.id}</span>
                  <span className="text-xs text-text-muted">{p.size} units</span>
                </div>
                <button onClick={() => removeProcess(p.id)} className="text-text-muted hover:text-red transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {processes.length === 0 && <p className="text-xs text-text-muted text-center py-4">No processes added</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
