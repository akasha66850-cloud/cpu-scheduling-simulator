import React from 'react'
import useSettingsStore from '../../store/useSettingsStore'

export default function ToggleRow({ label, sublabel, storeKey }) {
  const value = useSettingsStore(s => s[storeKey])
  const setValue = useSettingsStore(s => {
    // Determine the setter name dynamically (e.g., 'showStarvationWarnings' -> 'setShowStarvationWarnings')
    const setterName = `set${storeKey.charAt(0).toUpperCase() + storeKey.slice(1)}`
    return s[setterName]
  })

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-4">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        {sublabel && <div className="text-xs text-text-muted mt-1">{sublabel}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => setValue(!value)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
          focus-visible:ring-accent focus-visible:ring-opacity-75
          ${value ? 'bg-accent' : 'bg-surface-elevated border-border'}
        `}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${value ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}
