import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, Cpu, Database, LayoutTemplate, ShieldAlert, HardDrive, 
  RefreshCcw, Folder, BarChart2, GitCompare, FileText, History, 
  Sparkles, Settings, FileCode2, Info, ChevronDown, ChevronRight, LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'
import useAiAssistantStore from '../store/useAiAssistantStore'

const MODULES = [
  { id: 'cpu', label: 'CPU Scheduling', icon: Cpu, basePath: '/simulator', routes: [
      { to: '/simulator', label: 'Simulator' },
      { to: '/compare', label: 'Comparison' },
      { to: '/analytics', label: 'Analytics' }
  ]},
  { id: 'memory', label: 'Memory Management', icon: Database, basePath: '/memory-simulator', routes: [
      { to: '/memory-simulator', label: 'Simulator' },
      { to: '/memory-compare', label: 'Comparison' },
  ]},
  { id: 'page', label: 'Page Replacement', icon: LayoutTemplate, basePath: '/page-replacement', routes: [
      { to: '/page-replacement', label: 'Simulator' },
      { to: '/page-replacement-compare', label: 'Comparison' },
      { to: '/page-replacement-analytics', label: 'Analytics' }
  ]},
  { id: 'deadlock', label: 'Deadlock Handling', icon: ShieldAlert, basePath: '/deadlock', routes: [
      { to: '/deadlock', label: 'Simulator' },
      { to: '/deadlock-compare', label: 'Comparison' },
      { to: '/deadlock-analytics', label: 'Analytics' }
  ]},
  { id: 'disk', label: 'Disk Scheduling', icon: HardDrive, basePath: '/disk', routes: [
      { to: '/disk', label: 'Simulator' },
      { to: '/disk-compare', label: 'Comparison' },
      { to: '/disk-analytics', label: 'Analytics' }
  ]},
  { id: 'sync', label: 'Process Synchronization', icon: RefreshCcw, basePath: '/sync', routes: [
      { to: '/sync', label: 'Simulator' },
      { to: '/sync-compare', label: 'Comparison' },
      { to: '/sync-analytics', label: 'Analytics' }
  ]},
  { id: 'file', label: 'File Allocation', icon: Folder, basePath: '/file', routes: [
      { to: '/file', label: 'Simulator' },
      { to: '/file-compare', label: 'Comparison' },
      { to: '/file-analytics', label: 'Analytics' }
  ]},
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, basePath: '/ai-assistant', routes: [
      { to: '/ai-assistant', label: 'Chat Interface' }
  ]},
]



const OTHER_LINKS = [
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedModule, setExpandedModule] = useState(null)
  const { user, logout } = useAuthStore()
  const setAIOpen = useAiAssistantStore(s => s.setOpen)

  // Auto-expand module based on active route
  React.useEffect(() => {
    const activeModule = MODULES.find(m => m.routes.some(r => r.to === location.pathname))
    if (activeModule && expandedModule !== activeModule.id) {
       setExpandedModule(activeModule.id)
    }
  }, [location.pathname])

  const toggleModule = (id) => {
    setExpandedModule(prev => prev === id ? null : id)
  }

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-base backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-[220px] bg-surface border-r border-border
        flex flex-col h-full transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Logo */}
        <div className="pt-[16px] px-[20px] shrink-0">
          <div className="flex items-center gap-[10px]">
            <div className="w-[36px] h-[36px] rounded-[8px] bg-gradient-to-br from-[#2F81F7] to-[#BC8CFF] flex items-center justify-center shrink-0">
              <Cpu className="w-[20px] h-[20px] text-text-primary" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-text-primary text-[15px] leading-tight">OSLabX</span>
              <span className="text-[10px] text-text-muted leading-tight mt-[2px]">Operating System Simulator</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-[20px] px-[12px] custom-scrollbar space-y-[24px]">
          
          {/* Main Dashboard Link */}
          <NavLink 
            to="/" 
            onClick={handleLinkClick}
            className={({ isActive }) => `
              flex items-center gap-[10px] px-[10px] py-[7px] rounded-[5px] text-[13px] font-medium transition-all
              ${isActive ? 'bg-[rgba(47,129,247,0.15)] text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'}
            `}
          >
            <Home className="w-[18px] h-[18px]" />
            Dashboard
          </NavLink>

          {/* Modules Section */}
          <div>
             <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-[8px] px-[10px]">Modules</h3>
             <div className="space-y-1">
                {MODULES.map((mod) => {
                   const isExpanded = expandedModule === mod.id
                   const isActiveModule = mod.routes.some(r => r.to === location.pathname)
                   
                   return (
                     <div key={mod.id}>
                        <button 
                           onClick={() => toggleModule(mod.id)}
                           className={`
                             w-full flex items-center justify-between px-[10px] py-[7px] rounded-[5px] text-[13px] font-medium transition-colors
                             ${isActiveModule ? 'text-accent bg-[rgba(47,129,247,0.15)]' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'}
                           `}
                        >
                           <div className="flex items-center gap-[10px]">
                              <mod.icon className="w-[18px] h-[18px]" />
                              {mod.label}
                           </div>
                           <ChevronDown className={`w-[14px] h-[14px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                           {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                 <div className="pl-[38px] pr-[10px] py-[4px] space-y-[4px] relative before:absolute before:left-[18px] before:top-0 before:bottom-[4px] before:w-px before:bg-border">
                                    {mod.routes.map(r => (
                                       <NavLink 
                                         key={r.to} 
                                         to={r.to}
                                         onClick={handleLinkClick}
                                         className={({ isActive }) => `
                                            block text-[12px] py-[4px] transition-colors relative
                                            ${isActive ? 'text-accent font-medium' : 'text-text-muted hover:text-text-primary'}
                                         `}
                                       >
                                         <span className={`absolute -left-[23px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-border transition-colors ${location.pathname === r.to ? 'bg-accent' : ''}`} />
                                         {r.label}
                                       </NavLink>
                                    ))}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                   )
                })}
             </div>
          </div>


          {/* Other Section */}
          <div>
             <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-[8px] px-[10px]">Other</h3>
              <div className="space-y-[4px]">
                {OTHER_LINKS.map((link) => {

                   return (
                     <NavLink 
                       key={link.label}
                       to={link.to} 
                       onClick={(e) => { if(link.disabled) e.preventDefault(); else handleLinkClick(); }}
                       className={({ isActive }) => `
                          flex items-center justify-between px-[10px] py-[7px] rounded-[5px] text-[13px] font-medium transition-colors
                          ${link.disabled ? 'opacity-50 cursor-not-allowed text-text-muted' : 
                            isActive ? 'text-accent bg-[rgba(47,129,247,0.15)]' : 'text-text-secondary hover:bg-elevated hover:text-text-primary'}
                       `}
                     >
                      <div className="flex items-center gap-[10px]">
                         <link.icon className="w-[18px] h-[18px]" />
                         {link.label}
                      </div>
                       {link.badge && (
                          <span className="px-[8px] py-[2px] rounded-[10px] text-[10px] font-bold bg-elevated border border-border text-text-primary">
                            {link.badge}
                          </span>
                       )}
                     </NavLink>
                   )
                })}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[12px] shrink-0 border-t border-border mt-auto">
           <div className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[5px] bg-elevated border border-border">
              <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}&backgroundColor=transparent`} alt="User" className="w-[32px] h-[32px] rounded-full bg-gradient-to-tr from-[#2F81F7] to-[#BC8CFF]" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="text-[13px] font-semibold text-text-primary leading-tight truncate">{user?.username || 'Guest'}</div>
                 <div className="text-[11px] text-text-muted mt-[2px] leading-tight truncate">Student Mode</div>
              </div>
              <button 
                onClick={() => { logout(); navigate('/login') }}
                className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
           </div>
        </div>

      </aside>
    </>
  )
}
