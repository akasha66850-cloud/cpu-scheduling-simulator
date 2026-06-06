import React, { useState, useCallback, useRef } from 'react'
import { Plus, RefreshCw, Wand2, AlertCircle } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { motion, AnimatePresence } from 'framer-motion'

const INITIAL_FORM = { arrivalTime: '', burstTime: '', priority: '' }

function getNextPID(processes) {
  if (processes.length === 0) return 'P1'
  const nums = processes.map((p) => parseInt(p.id.replace(/\D/g, ''), 10) || 0)
  return `P${Math.max(...nums) + 1}`
}

function validate(form) {
  const errors = {}
  const at = Number(form.arrivalTime)
  const bt = Number(form.burstTime)
  const pr = Number(form.priority)

  if (form.arrivalTime === '' || isNaN(at) || at < 0) {
    errors.arrivalTime = 'Must be a non-negative integer'
  }
  if (form.burstTime === '' || isNaN(bt) || bt <= 0) {
    errors.burstTime = 'Must be a positive integer (> 0)'
  }
  if (form.priority === '' || isNaN(pr) || pr < 1) {
    errors.priority = 'Must be ≥ 1 (1 = highest priority)'
  }
  return errors
}

export default function ProcessForm() {
  const processes = useSchedulerStore((s) => s.processes)
  const addProcess = useSchedulerStore((s) => s.addProcess)
  const loadSampleProcesses = useSchedulerStore((s) => s.loadSampleProcesses)
  const clearProcesses = useSchedulerStore((s) => s.clearProcesses)
  const algorithm = useSchedulerStore((s) => s.algorithm)

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const burstRef = useRef()
  const priorityRef = useRef()

  const isPriorityAlgo = algorithm === 'Priority' || algorithm === 'PriorityPreemptive'

  const handleChange = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (touched[field]) {
      const errs = validate({ ...form, [field]: value })
      setErrors((e) => ({ ...e, [field]: errs[field] }))
    }
  }, [form, touched])

  const handleBlur = useCallback((field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    const errs = validate(form)
    setErrors((e) => ({ ...e, [field]: errs[field] }))
  }, [form])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setTouched({ arrivalTime: true, burstTime: true, priority: true })

    if (Object.keys(errs).length > 0) return
    if (processes.length >= 20) return

    const pid = getNextPID(processes)
    addProcess({
      id: pid,
      arrivalTime: parseInt(form.arrivalTime, 10),
      burstTime: parseInt(form.burstTime, 10),
      priority: parseInt(form.priority, 10),
    })

    setForm(INITIAL_FORM)
    setErrors({})
    setTouched({})
  }

  const atMax = processes.length >= 20

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3" id="process-form">
        {/* PID preview */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Next PID:</span>
          <span className="font-mono font-bold text-indigo-400 text-base">
            {getNextPID(processes)}
          </span>
          <span className="ml-auto text-xs">
            {processes.length}/20 processes
          </span>
        </div>

        {/* Arrival Time */}
        <div>
          <label htmlFor="arrival-time" className="label">Arrival Time</label>
          <input
            id="arrival-time"
            type="number"
            min="0"
            step="1"
            className={`input-field ${errors.arrivalTime && touched.arrivalTime ? 'input-error' : ''}`}
            placeholder="e.g. 0"
            value={form.arrivalTime}
            onChange={(e) => handleChange('arrivalTime', e.target.value)}
            onBlur={() => handleBlur('arrivalTime')}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); burstRef.current?.focus() } }}
          />
          <AnimatePresence>
            {errors.arrivalTime && touched.arrivalTime && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-red-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.arrivalTime}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Burst Time */}
        <div>
          <label htmlFor="burst-time" className="label">Burst Time</label>
          <input
            id="burst-time"
            ref={burstRef}
            type="number"
            min="1"
            step="1"
            className={`input-field ${errors.burstTime && touched.burstTime ? 'input-error' : ''}`}
            placeholder="e.g. 5"
            value={form.burstTime}
            onChange={(e) => handleChange('burstTime', e.target.value)}
            onBlur={() => handleBlur('burstTime')}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); priorityRef.current?.focus() } }}
          />
          <AnimatePresence>
            {errors.burstTime && touched.burstTime && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-red-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.burstTime}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="label">
            Priority
            {!isPriorityAlgo && (
              <span className="ml-2 text-xs text-slate-500">(ignored for {algorithm})</span>
            )}
          </label>
          <input
            id="priority"
            ref={priorityRef}
            type="number"
            min="1"
            step="1"
            className={`input-field ${!isPriorityAlgo ? 'opacity-50' : ''} ${errors.priority && touched.priority ? 'input-error' : ''}`}
            placeholder="e.g. 1 (highest)"
            value={form.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            onBlur={() => handleBlur('priority')}
          />
          <AnimatePresence>
            {errors.priority && touched.priority && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-red-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.priority}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Add button */}
        <button
          type="submit"
          id="add-process-btn"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={atMax}
        >
          <Plus className="w-4 h-4" />
          {atMax ? 'Max 20 processes reached' : 'Add Process'}
        </button>
      </form>

      {/* Utility buttons */}
      <div className="flex gap-2">
        <button
          id="load-sample-btn"
          onClick={loadSampleProcesses}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
        >
          <Wand2 className="w-4 h-4" />
          Load Sample
        </button>
        <button
          id="clear-all-btn"
          onClick={clearProcesses}
          className="btn-danger flex items-center gap-2 text-sm"
          disabled={processes.length === 0}
        >
          <RefreshCw className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  )
}
