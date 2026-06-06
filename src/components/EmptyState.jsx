import React from 'react'
import { Cpu } from 'lucide-react'

export default function EmptyState({ title, description, icon: Icon = Cpu }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-600" />
      </div>
      <div>
        <h3 className="text-slate-300 font-semibold mb-1">{title}</h3>
        <p className="text-slate-500 text-sm max-w-xs">{description}</p>
      </div>
    </div>
  )
}
