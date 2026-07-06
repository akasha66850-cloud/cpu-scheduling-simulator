import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAiAssistantStore from '../../store/useAiAssistantStore'
import ChatPanel from './ChatPanel'
import { Maximize2, Minimize2, X, PanelRightClose } from 'lucide-react'

export default function FloatingChatWindow() {
  const { 
    isFloating, setFloating, setOpen,
    floatingPosition, setFloatingPosition,
    floatingSize, setFloatingSize,
    isMinimized, toggleMinimized,
    isMaximized, toggleMaximized 
  } = useAiAssistantStore()

  const windowRef = useRef(null)
  
  if (!isFloating) return null

  // Ensure window stays within bounds on resize
  const safePosition = isMaximized ? { x: 0, y: 0 } : floatingPosition
  const safeSize = isMaximized ? { width: '100vw', height: '100vh' } : (isMinimized ? { width: 300, height: 48 } : { ...floatingSize, width: Math.min(floatingSize.width, window.innerWidth - 20) })

  const handleDragEnd = (e, info) => {
    if (isMaximized) return
    const newX = floatingPosition.x + info.offset.x
    const newY = floatingPosition.y + info.offset.y
    setFloatingPosition({ 
      x: Math.max(0, Math.min(newX, window.innerWidth - 300)), 
      y: Math.max(0, Math.min(newY, window.innerHeight - 48)) 
    })
  }

  const handlePopIn = () => {
    setFloating(false)
    setOpen(true)
  }

  const handleClose = () => {
    setFloating(false)
    setOpen(false)
  }

  return (
    <motion.div
      ref={windowRef}
      drag={!isMaximized}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      dragElastic={0}
      initial={safePosition}
      animate={{ 
        x: safePosition.x, 
        y: safePosition.y,
        width: safeSize.width,
        height: safeSize.height
      }}
      transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
      className={`fixed z-[9999] flex flex-col bg-[#161b27] border border-border rounded-lg shadow-2xl overflow-hidden`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
      }}
    >
      {/* Draggable Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#13171f] border-b border-border cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
           <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] text-white font-bold">
             OS
           </div>
           <span className="text-xs font-semibold text-text-primary">OSBot Floating</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={handlePopIn} 
            title="Dock to side panel"
            className="p-1 text-text-muted hover:text-text-primary hover:bg-elevated rounded transition-colors"
          >
            <PanelRightClose size={14} />
          </button>
          <button 
            onClick={toggleMinimized} 
            title={isMinimized ? "Restore" : "Minimize"}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-elevated rounded transition-colors"
          >
             <Minimize2 size={14} className={isMinimized ? "rotate-180" : ""} />
          </button>
          <button 
            onClick={toggleMaximized} 
            title={isMaximized ? "Restore" : "Maximize"}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-elevated rounded transition-colors hidden md:block"
          >
             <Maximize2 size={14} className={isMaximized ? "rotate-180" : ""} />
          </button>
          <button 
            onClick={handleClose} 
            title="Close"
            className="p-1 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
          >
             <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100%' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 min-h-0 relative bg-[#161b27]"
            onPointerDownCapture={(e) => e.stopPropagation()} // Prevent drag on content
          >
            <ChatPanel isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle (Bottom Right) */}
      {!isMinimized && !isMaximized && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const startWidth = floatingSize.width
            const startHeight = floatingSize.height
            const startX = e.clientX
            const startY = e.clientY

            const handlePointerMove = (moveEvent) => {
              const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX))
              const newHeight = Math.max(400, startHeight + (moveEvent.clientY - startY))
              setFloatingSize({ width: newWidth, height: newHeight })
            }

            const handlePointerUp = () => {
              window.removeEventListener('pointermove', handlePointerMove)
              window.removeEventListener('pointerup', handlePointerUp)
            }

            window.addEventListener('pointermove', handlePointerMove)
            window.addEventListener('pointerup', handlePointerUp)
          }}
        >
          {/* Subtle resize grip dots */}
          <div className="absolute bottom-1 right-1 w-2 h-2">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/0.w3.org/2000/svg">
              <path d="M8 8H6V6H8V8ZM4 8H2V6H4V8ZM8 4H6V2H8V4Z" fill="#475569" fillOpacity="0.5"/>
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  )
}
