import React, { useState } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { motion, AnimatePresence } from 'framer-motion'

function EditRow({ proc, onSave, onCancel }) {
  const [form, setForm] = useState({
    arrivalTime: String(proc.arrivalTime),
    burstTime: String(proc.burstTime),
    priority: String(proc.priority),
    color: proc.color || '#6366f1',
  })

  const handleSave = () => {
    const at = parseInt(form.arrivalTime, 10)
    const bt = parseInt(form.burstTime, 10)
    const pr = parseInt(form.priority, 10)
    if (isNaN(at) || at < 0 || isNaN(bt) || bt <= 0 || isNaN(pr) || pr < 1) return
    onSave({ arrivalTime: at, burstTime: bt, priority: pr, color: form.color })
  }

  return (
    <tr className="bg-accent border-t border-accent">
      <td className="px-3 py-2 font-mono text-indigo-300 text-sm">{proc.id}</td>
      {['arrivalTime', 'burstTime', 'priority'].map((field) => (
        <td key={field} className="px-2 py-1.5">
          <input
            type="number"
            min={field === 'burstTime' ? 1 : field === 'priority' ? 1 : 0}
            className="w-16 bg-elevated border border-accent text-text-primary text-sm rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={form[field]}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          />
        </td>
      ))}
      <td className="px-2 py-1.5">
        <input
          type="color"
          className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
          value={form.color}
          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
        />
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1 text-green hover:text-green">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-1 text-text-muted hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ProcessTable() {
  const processes = useSchedulerStore((s) => s.processes)
  const removeProcess = useSchedulerStore((s) => s.removeProcess)
  const updateProcess = useSchedulerStore((s) => s.updateProcess)
  const [editId, setEditId] = useState(null)

  if (processes.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-sm border border-dashed border-border-muted rounded-[8px]">
        No processes added yet. Use the form above to add processes.
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>PID</th>
            <th>AT</th>
            <th>BT</th>
            <th>Pri</th>
            <th>Color</th>
            <th className="text-right pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {processes.map((proc) =>
              editId === proc.id ? (
                <EditRow
                  key={proc.id}
                  proc={proc}
                  onSave={(fields) => {
                    updateProcess(proc.id, fields)
                    setEditId(null)
                  }}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <motion.tr
                  key={proc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="hover:bg-elevated transition-colors"
                >
                  <td className="font-mono text-indigo-300 font-semibold text-sm">{proc.id}</td>
                  <td className="font-mono text-sm">{proc.arrivalTime}</td>
                  <td className="font-mono text-sm">{proc.burstTime}</td>
                  <td className="font-mono text-sm">{proc.priority}</td>
                  <td className="px-2 py-1.5">
                    <div className="w-4 h-4 rounded-full border border-border-muted" style={{ backgroundColor: proc.color || '#6366f1' }} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditId(proc.id)}
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeProcess(proc.id)}
                        className="p-1.5 text-text-muted hover:text-red hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
