import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MODULES } from '../constants/modules'

export default function ModuleTabs() {
  const location = useLocation()
  
  const activeModule = MODULES.find(m => m.routes.some(r => r.to === location.pathname))
  
  if (!activeModule || activeModule.routes.length <= 1) return null
  
  return (
    <div className="bg-surface border-b border-border px-[20px] flex gap-[24px]">
      {activeModule.routes.map(r => (
        <NavLink
          key={r.to}
          to={r.to}
          className={({ isActive }) => `
            py-[12px] text-[13px] font-medium transition-colors relative
            ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}
          `}
        >
          {({ isActive }) => (
            <>
              {r.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-[2px]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
