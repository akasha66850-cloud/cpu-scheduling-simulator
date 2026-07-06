import React from 'react'

export default function SettingSlider({ label, sublabel, min = 1, max = 10, value, onChange, formatValue = (v) => v }) {
  return (
    <div className="py-2">
      <div className="flex justify-between items-end mb-3">
        <div>
          <div className="text-sm font-medium text-text-primary">{label}</div>
          {sublabel && <div className="text-xs text-text-muted mt-1">{sublabel}</div>}
        </div>
        <div className="text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded">
          {formatValue(value)}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
      />
      <div className="flex justify-between text-xs text-text-muted mt-2">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
