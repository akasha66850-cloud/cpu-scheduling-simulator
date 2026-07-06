import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import useDeadlockStore from '@/store/useDeadlockStore'
import { Network } from 'lucide-react'

export default function RAGVisualizer() {
  const { numProcesses, numResources, allocation, request, activeStrategy, results } = useDeadlockStore()

  // For Deadlock Detection & Recovery, highlight deadlocked processes
  const deadlockedProcesses = useMemo(() => {
    if (!results || activeStrategy === 'bankers') return []
    return results.deadlockedProcesses || []
  }, [results, activeStrategy])

  // Nodes positioning
  const P_X = 100
  const R_X = 400
  const VERTICAL_SPACING = 80
  const SVG_HEIGHT = Math.max(numProcesses, numResources) * VERTICAL_SPACING + 40
  const SVG_WIDTH = 500

  const pNodes = Array(numProcesses).fill(0).map((_, i) => ({
    id: `P${i}`,
    x: P_X,
    y: 40 + i * VERTICAL_SPACING,
    isDeadlocked: deadlockedProcesses.includes(i)
  }))

  const rNodes = Array(numResources).fill(0).map((_, j) => ({
    id: `R${j}`,
    x: R_X,
    y: 40 + j * VERTICAL_SPACING
  }))

  const edges = []
  
  // Create Allocation Edges (Resource -> Process)
  for (let i = 0; i < numProcesses; i++) {
    for (let j = 0; j < numResources; j++) {
      if (allocation[i][j] > 0) {
        edges.push({
          id: `alloc-R${j}-P${i}`,
          x1: rNodes[j].x - 20, // left side of resource square
          y1: rNodes[j].y,
          x2: pNodes[i].x + 20, // right side of process circle
          y2: pNodes[i].y,
          type: 'allocation',
          label: allocation[i][j],
          isDeadlocked: deadlockedProcesses.includes(i)
        })
      }
    }
  }

  // Create Request Edges (Process -> Resource)
  if (activeStrategy !== 'bankers') {
    for (let i = 0; i < numProcesses; i++) {
      for (let j = 0; j < numResources; j++) {
        if (request[i][j] > 0) {
          // Adjust lines slightly so they don't overlap perfectly with allocation lines
          edges.push({
            id: `req-P${i}-R${j}`,
            x1: pNodes[i].x + 20, // right side of process
            y1: pNodes[i].y + 5,
            x2: rNodes[j].x - 20, // left side of resource
            y2: rNodes[j].y + 5,
            type: 'request',
            label: request[i][j],
            isDeadlocked: deadlockedProcesses.includes(i)
          })
        }
      }
    }
  }

  // Draw arrow marker
  const MarkerDef = () => (
    <defs>
      <marker id="arrow-alloc" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
      </marker>
      <marker id="arrow-req" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
      </marker>
      <marker id="arrow-deadlock" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
      </marker>
    </defs>
  )

  return (
    <div className="card p-6 flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-6">
        <Network className="w-5 h-5 text-accent" />
        <h2 className="section-title !mb-0">Resource Allocation Graph (RAG)</h2>
      </div>

      <div className="w-full overflow-x-auto flex justify-center">
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="min-w-[500px]">
          <MarkerDef />
          
          {/* Edges */}
          {edges.map(edge => {
            const isAlloc = edge.type === 'allocation'
            let stroke = isAlloc ? '#10b981' : '#f59e0b'
            let marker = isAlloc ? 'url(#arrow-alloc)' : 'url(#arrow-req)'
            
            if (edge.isDeadlocked) {
              stroke = '#f43f5e'
              marker = 'url(#arrow-deadlock)'
            }

            // Curve the path slightly
            const cx = (edge.x1 + edge.x2) / 2
            const cy = (edge.y1 + edge.y2) / 2 - (isAlloc ? 15 : -15)

            return (
              <g key={edge.id}>
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  d={`M ${edge.x1} ${edge.y1} Q ${cx} ${cy} ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2"
                  strokeDasharray={isAlloc ? 'none' : '5,5'}
                  markerEnd={marker}
                  className="opacity-70"
                />
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  x={cx}
                  y={cy - 5}
                  fill={stroke}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {edge.label}
                </motion.text>
              </g>
            )
          })}

          {/* Process Nodes */}
          {pNodes.map((p, i) => (
            <motion.g 
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: i * 0.1 }}
            >
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="20" 
                fill="#1e293b" 
                stroke={p.isDeadlocked ? '#f43f5e' : '#6366f1'} 
                strokeWidth="3" 
                className={p.isDeadlocked ? 'animate-pulse' : ''}
              />
              <text x={p.x} y={p.y + 5} fill="#e2e8f0" fontSize="14" fontWeight="bold" textAnchor="middle">{p.id}</text>
            </motion.g>
          ))}

          {/* Resource Nodes */}
          {rNodes.map((r, j) => (
            <motion.g 
              key={r.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: j * 0.1 }}
            >
              <rect 
                x={r.x - 20} 
                y={r.y - 20} 
                width="40" 
                height="40" 
                rx="8"
                fill="#1e293b" 
                stroke="#8b5cf6" 
                strokeWidth="3" 
              />
              <text x={r.x} y={r.y + 5} fill="#e2e8f0" fontSize="14" fontWeight="bold" textAnchor="middle">{r.id}</text>
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-accent"></div> Process
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md border-2 border-violet-500"></div> Resource
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-green border-solid"></div> Allocation (R→P)
        </div>
        {activeStrategy !== 'bankers' && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-orange border-dashed"></div> Request (P→R)
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-rose-500 animate-pulse"></div> Deadlocked
        </div>
      </div>
    </div>
  )
}
