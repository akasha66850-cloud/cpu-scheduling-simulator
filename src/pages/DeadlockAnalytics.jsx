import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, ArrowRightCircle } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'
import { runDeadlockAlgorithm } from '@/utils/deadlockAlgorithms'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

export default function DeadlockAnalytics() {
  const { numProcesses, numResources, allocation, request, available } = useDeadlockStore()

  // Generate heatmap data for Allocation vs Max vs Request
  // Actually, let's just do a Resource Utilization Heatmap based on Allocation
  
  // Generate Wait-for graph reduction step chart
  const [reductionStepsData, setReductionStepsData] = React.useState([])

  React.useEffect(() => {
    const fetchDetection = async () => {
      try {
        const payload = {
          action: 'runDetection',
          allocation,
          request,
          available
        }
        const detect = await runDeadlockAlgorithm(payload)
        if (!detect || !detect.steps) return

        const data = []
        let stepCount = 1
        for (const step of detect.steps) {
          if (step.type === 'init' || step.type === 'reduce') {
            const unfinishedCount = step.finish.filter(f => !f).length
            data.push({
              step: `Step ${stepCount}`,
              remainingProcesses: unfinishedCount
            })
            stepCount++
          }
        }
        setReductionStepsData(data)
      } catch (err) {
        console.error("Failed to run detection for analytics", err)
      }
    }
    fetchDetection()
  }, [allocation, request, available])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-accent" />
          Deadlock Analytics
        </h1>
        <p className="mt-2 text-text-muted text-sm">
          Deep dive into wait-for graph reduction and resource utilization.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-red" />
            <h2 className="text-xl font-bold text-text-primary">Resource Allocation Heatmap</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 px-2"></th>
                  {Array(numResources).fill(0).map((_, j) => (
                    <th key={j} className="pb-3 px-2 text-xs font-semibold text-text-muted">R{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allocation.map((row, i) => (
                  <tr key={i}>
                    <td className="pr-3 py-2 text-xs font-semibold text-text-muted">P{i}</td>
                    {row.map((val, j) => {
                      // Determine heat intensity (0 to 1) based on value vs max overall allocation
                      const maxVal = Math.max(...allocation.flat(), 1)
                      const intensity = val / maxVal
                      const bgOpacity = 0.1 + (intensity * 0.9)
                      
                      return (
                        <td key={j} className="p-1">
                          <div 
                            className="w-full h-12 rounded flex items-center justify-center font-mono font-bold text-sm border border-border-muted"
                            style={{ 
                              backgroundColor: `rgba(244, 63, 94, ${val === 0 ? 0 : bgOpacity})`, // rose color
                              color: val === 0 ? '#64748b' : '#fff'
                            }}
                            title={`P${i} holds ${val} units of R${j}`}
                          >
                            {val}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Graph Reduction Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightCircle className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Graph Reduction Rate</h2>
          </div>
          <p className="text-sm text-text-muted mb-6">
            Shows how many processes are remaining in the wait-for graph during iterative reduction. If it does not reach 0, the system is deadlocked.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reductionStepsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="step" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{ stroke: '#475569' }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="remainingProcesses" 
                  name="Remaining Processes" 
                  stroke="var(--border)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
