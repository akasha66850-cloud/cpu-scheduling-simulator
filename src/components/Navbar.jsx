import React from 'react'
import { NavLink } from 'react-router-dom'
import { Cpu, Moon, Sun, Menu, X, History } from 'lucide-react'
import useSchedulerStore from '@/store/useSchedulerStore'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { to: '/simulator', label: 'Simulator' },
  { to: '/compare', label: 'Compare' },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar({ onHistoryOpen }) {
  const darkMode = useSchedulerStore((s) => s.darkMode)
  const toggleDarkMode = useSchedulerStore((s) => s.toggleDarkMode)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-md bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-white text-lg">
              CPU <span className="text-indigo-400">Scheduler</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'nav-link-active' : 'nav-link'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {onHistoryOpen && (
              <button
                onClick={onHistoryOpen}
                className="btn-secondary p-2 text-slate-400 hover:text-white"
                title="History"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800 bg-slate-950"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? 'nav-link-active' : 'nav-link'
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
