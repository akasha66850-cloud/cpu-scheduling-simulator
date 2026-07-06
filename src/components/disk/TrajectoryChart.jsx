import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'

export default function TrajectoryChart() {
  const { diskSize, results, stepIndex, isStepMode, activeAlgorithm } = useDiskStore()

  const data = useMemo(() => {
    if (!results || !results.sequence) return []
    
    // In step mode, only show up to current step
    // Note: sequence length is steps.length + 1
    const limit = isStepMode ? stepIndex + 1 : results.sequence.length
    
    return results.sequence.slice(0, limit).map((cyl, idx) => ({
      step: idx,
      cylinder: cyl
    }))
  }, [results, stepIndex, isStepMode])

  if (!results) return null

  // Assign color based on algorithm for visual consistency in comparisons later
  const colors = {
    fcfs: '#6366f1', // indigo
    sstf: '#10b981', // emerald
    scan: '#f59e0b', // amber
    cscan: '#8b5cf6', // violet
    look: '#ec4899', // pink
    clook: '#0ea5e9'  // sky
  }
  const color = colors[activeAlgorithm] || '#6366f1'

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-surface border border-border-muted p-3 rounded-[5px] shadow-xl">
          <p className="text-sm font-semibold text-text-secondary mb-1">Step {data.step}</p>
          <p className="text-xs text-accent font-mono">Cylinder: {data.cylinder}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6 border-accent">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h2 className="section-title !mb-0">Seek Trajectory</h2>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            layout="vertical" 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            
            <XAxis 
              type="number" 
              dataKey="cylinder" 
              domain={[0, diskSize - 1]} 
              stroke="var(--border)" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              orientation="top"
              label={{ value: 'Cylinders', position: 'insideTop', fill: '#64748b', fontSize: 12, dy: -20 }}
            />
            
            <YAxis 
              type="category" 
              dataKey="step" 
              stroke="var(--border)" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              reversed={true} // Reverse so Step 0 is at the top
              interval={0}
              label={{ value: 'Steps / Time', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12, dx: -10 }}
            />
            
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '5 5' }} />
            
            <ReferenceLine x={0} stroke="var(--border)" strokeDasharray="3 3" />
            <ReferenceLine x={diskSize - 1} stroke="var(--border)" strokeDasharray="3 3" />

            <Line 
              type="linear" 
              dataKey="cylinder" 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#0f172a' }}
              activeDot={{ r: 8, fill: color, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={!isStepMode} // Disable Recharts animation in step mode so it instantly updates
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
