import React from 'react'
import { Cpu } from 'lucide-react'

export default function EmptyState({ title, description, icon: Icon = Cpu }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-elevated border border-border-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <div>
        <h3 className="text-text-secondary font-semibold mb-1">{title}</h3>
        <p className="text-text-muted text-sm max-w-xs">{description}</p>
      </div>
    </div>
  )
}
