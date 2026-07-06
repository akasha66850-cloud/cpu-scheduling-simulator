import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Cpu, Bell, HardDrive, Keyboard, ChevronDown } from 'lucide-react'

const icons = {
  palette: Palette,
  cpu: Cpu,
  bell: Bell,
  'device-floppy': HardDrive,
  keyboard: Keyboard
}

export default function SettingsSection({ icon, title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const IconComponent = icons[icon]

  return (
    <div className="bg-elevated border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-elevated hover:bg-hover transition-colors text-left"
      >
        <div className="flex items-center gap-3 text-text-primary">
          {IconComponent && <IconComponent size={20} className="text-accent" />}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-6 space-y-6 bg-base">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
