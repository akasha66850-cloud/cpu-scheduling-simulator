import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useFileStore from '@/store/useFileStore'

export default function DiskGrid() {
  const { diskBlocks, diskSize, files, selectedAlgorithm } = useFileStore()
  const gridRef = useRef(null)
  const [blockPositions, setBlockPositions] = useState([])

  // Measure block positions for SVG arrows
  useEffect(() => {
    if (!gridRef.current) return
    const updatePositions = () => {
      const blocks = gridRef.current.querySelectorAll('.disk-block')
      const pos = Array.from(blocks).map(b => {
         const rect = b.getBoundingClientRect()
         const parentRect = gridRef.current.getBoundingClientRect()
         return {
            x: rect.left - parentRect.left + rect.width / 2,
            y: rect.top - parentRect.top + rect.height / 2
         }
      })
      setBlockPositions(pos)
    }
    updatePositions()
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [diskBlocks, diskSize])

  // Get arrows for Linked Allocation
  const getArrows = () => {
    if (selectedAlgorithm !== 'linked' || blockPositions.length === 0) return []
    const arrows = []
    diskBlocks.forEach((b, i) => {
      if (b && b.next !== -1 && blockPositions[b.next]) {
         arrows.push({
            id: `arrow_${i}_${b.next}`,
            startX: blockPositions[i].x,
            startY: blockPositions[i].y,
            endX: blockPositions[b.next].x,
            endY: blockPositions[b.next].y,
            color: files[b.fileId]?.color || '#cbd5e1'
         })
      }
    })
    return arrows
  }

  // Get lines for Indexed Allocation
  const getIndexLines = () => {
    if (selectedAlgorithm !== 'indexed' || blockPositions.length === 0) return []
    const lines = []
    Object.values(files).forEach(f => {
       if (f.indexBlock !== -1 && blockPositions[f.indexBlock]) {
          f.blocks.forEach(dataBlock => {
             if (blockPositions[dataBlock]) {
                lines.push({
                   id: `line_${f.indexBlock}_${dataBlock}`,
                   startX: blockPositions[f.indexBlock].x,
                   startY: blockPositions[f.indexBlock].y,
                   endX: blockPositions[dataBlock].x,
                   endY: blockPositions[dataBlock].y,
                   color: f.color
                })
             }
          })
       }
    })
    return lines
  }

  const renderBlock = (b, i) => {
     if (!b) {
        return (
          <div key={i} className="disk-block w-8 h-12 bg-elevated border-r border-b border-border-muted flex items-center justify-center text-[10px] text-text-muted font-mono transition-colors group relative">
             {i}
             <div className="absolute opacity-0 group-hover:opacity-100 bg-surface text-text-primary text-xs p-2 rounded -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none border border-border-muted">
               Block {i}: Free
             </div>
          </div>
        )
     }

     const file = files[b.fileId]
     const color = file ? file.color : '#64748b'
     const isIndex = b.type === 'index'

     return (
        <motion.div 
           key={`${i}-${b.fileId}`}
           initial={{ opacity: 0, scale: 0.5 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.5 }}
           className={`disk-block w-8 h-12 flex items-center justify-center text-[10px] font-bold text-text-primary border-r border-b transition-all group relative ${isIndex ? 'ring-2 ring-inset ring-white z-10' : ''}`}
           style={{ backgroundColor: color, borderColor: color }}
        >
           {i}
           <div className="absolute opacity-0 group-hover:opacity-100 bg-surface text-text-primary text-xs p-2 rounded -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none border border-border-muted shadow-xl">
               <div className="font-bold" style={{color}}>{file ? file.name : 'Unknown File'}</div>
               <div>Block {i} {isIndex ? '(Index Node)' : '(Data Node)'}</div>
           </div>
        </motion.div>
     )
  }

  return (
    <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl w-full">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-primary tracking-wide">Disk Block Map</h3>
          <span className="text-xs text-text-muted bg-elevated px-2 py-1 rounded">Size: {diskSize} Blocks</span>
       </div>
       
       <div className="relative" ref={gridRef}>
          {/* Disk Grid */}
          <div className="flex flex-wrap border-l border-t border-border-muted rounded overflow-hidden relative z-10 bg-base">
             <AnimatePresence>
                {diskBlocks.map((b, i) => renderBlock(b, i))}
             </AnimatePresence>
          </div>

          {/* SVG Overlay for Arrows / Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ overflow: 'visible' }}>
             {/* Linked Allocation Arrows */}
             {getArrows().map(a => (
                <motion.g key={a.id} initial={{pathLength: 0, opacity: 0}} animate={{pathLength: 1, opacity: 1}} transition={{duration: 0.5}}>
                   <defs>
                     <marker id={`arrowhead-${a.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                       <polygon points="0 0, 10 3.5, 0 7" fill={a.color} />
                     </marker>
                   </defs>
                   <path 
                      d={`M ${a.startX} ${a.startY} Q ${(a.startX + a.endX)/2} ${a.startY - 30} ${a.endX} ${a.endY}`}
                      fill="none"
                      stroke={a.color}
                      strokeWidth="2"
                      markerEnd={`url(#arrowhead-${a.id})`}
                      strokeDasharray="4 2"
                   />
                </motion.g>
             ))}

             {/* Indexed Allocation Radiating Lines */}
             {getIndexLines().map(l => (
                <motion.line 
                   key={l.id}
                   x1={l.startX} y1={l.startY} x2={l.endX} y2={l.endY}
                   stroke={l.color}
                   strokeWidth="1.5"
                   strokeDasharray="2 2"
                   initial={{opacity: 0}}
                   animate={{opacity: 0.7}}
                   transition={{duration: 0.5}}
                />
             ))}
          </svg>
       </div>
    </div>
  )
}
