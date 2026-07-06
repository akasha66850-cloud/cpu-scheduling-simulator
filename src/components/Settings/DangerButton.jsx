import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function DangerButton({ label, buttonText, icon: Icon = Trash2, onConfirm, confirmText = 'Are you sure?', fullWidth = false }) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (showConfirm) {
    return (
      <div className={`py-2 ${fullWidth ? 'w-full' : ''}`}>
        {!fullWidth && label && <div className="text-sm font-medium text-text-primary mb-3">{label}</div>}
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <p className="text-sm text-rose-400 mb-3">{confirmText}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-elevated rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm()
                setShowConfirm(false)
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
            >
              Yes, confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`py-2 flex items-center justify-between ${fullWidth ? 'w-full' : ''}`}>
      {!fullWidth && label && <div className="text-sm font-medium text-text-primary">{label}</div>}
      <button
        onClick={() => setShowConfirm(true)}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 border border-rose-500/50 
          text-rose-500 hover:bg-rose-500/10 rounded-md text-sm font-medium transition-colors
          ${fullWidth ? 'w-full py-3 text-base' : ''}
        `}
      >
        <Icon size={16} />
        {buttonText}
      </button>
    </div>
  )
}
