import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, BarChart2, Repeat } from 'lucide-react'
import useDiskStore from '@/store/useDiskStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DiskAnalytics() {
  const { diskSize, results, requestQueueInput } = useDiskStore()

  // Generate Per-Request Seek Distance data
  const seekDistanceData = useMemo(() => {
    if (!results || !results.steps) return []
    const data = []
    for (let i = 0; i < results.steps.length; i++) {
      const step = results.steps[i]
      data.push({
        stepName: `Step ${i+1}`,
        from: step.current,
        to: step.next,
        distance: step.distance,
        type: step.type
      })
    }
    return data
  }, [results])

  // Generate Head Position Heatmap (Hot Zones)
  // Divide disk into 10 buckets
  const heatmapData = useMemo(() => {
    if (!results || !results.sequence) return []
    const numBuckets = Math.min(20, diskSize)
    const bucketSize = Math.ceil(diskSize / numBuckets)
    
    const buckets = Array(numBuckets).fill(0).map((_, i) => ({
      range: `${i * bucketSize}-${Math.min((i + 1) * bucketSize - 1, diskSize - 1)}`,
      count: 0
    }))

    // Count how many times the sequence visits each bucket
    for (const cyl of results.sequence) {
      const bucketIdx = Math.floor(cyl / bucketSize)
      if (buckets[bucketIdx]) {
        buckets[bucketIdx].count++
      }
    }

    // Also factor in "traversed" cylinders if we want a true heat map, 
    // but just mapping the requested points gives a good "hot zone" of I/O concentration.
    const allRequests = requestQueueInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n < diskSize)
    for (const req of allRequests) {
      const bucketIdx = Math.floor(req / bucketSize)
      if (buckets[bucketIdx]) {
        buckets[bucketIdx].count += 0.5 // weight original queue
      }
    }

    return buckets
  }, [results, diskSize, requestQueueInput])

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="p-8 text-center text-text-muted card">
          Run a disk simulation first to view analytics.
        </div>
      </div>
    )
  }

  const maxHeat = Math.max(...heatmapData.map(d => d.count), 1)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-accent" />
          Disk Analytics
        </h1>
        <p className="mt-2 text-text-muted text-sm">
          Deep dive into seek distances, directional reversals, and disk hot zones.
        </p>
      </div>

      {results.metrics.reversals !== undefined && results.metrics.reversals > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-4 bg-violet-500/10 border-violet-500/20">
          <div className="p-3 bg-violet-500/20 rounded-[8px]">
            <Repeat className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-300">Direction Reversals</h3>
            <p className="text-2xl font-bold font-mono text-violet-400">{results.metrics.reversals}</p>
          </div>
          <p className="text-sm text-text-muted ml-auto max-w-sm text-right">
            The disk head changed direction {results.metrics.reversals} times. Fewer reversals mean less mechanical wear and tear on the actuator arm.
          </p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Seek Distance per step */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Seek Distance per Step</h2>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seekDistanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="stepName" stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="var(--border)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#1e293b' }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} 
                />
                <Bar dataKey="distance" name="Distance" radius={[4, 4, 0, 0]}>
                  {seekDistanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'jump' || entry.type === 'boundary' ? '#f59e0b' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-muted mt-4 text-center">
            Amber bars indicate boundary jumps or sweeps without serving a request (e.g. C-SCAN jumps).
          </p>
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-red" />
            <h2 className="text-xl font-bold text-text-primary">Disk Activity Hot Zones</h2>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {heatmapData.map((bucket, i) => {
              const intensity = bucket.count / maxHeat
              const bgOpacity = 0.1 + (intensity * 0.9)
              
              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center justify-center p-2 rounded border border-border-muted transition-colors"
                  style={{ 
                    backgroundColor: `rgba(244, 63, 94, ${bucket.count === 0 ? 0 : bgOpacity})`, // rose
                  }}
                  title={`Range: ${bucket.range}\nActivity Score: ${bucket.count}`}
                >
                  <span className={`text-[10px] font-mono ${bucket.count > maxHeat/2 ? 'text-text-primary' : 'text-text-muted'}`}>
                    {bucket.range}
                  </span>
                  <span className={`text-sm font-bold ${bucket.count > maxHeat/2 ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {bucket.count > 0 ? bucket.count : '-'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-text-muted mt-6 text-center">
            Highlights regions of the disk that receive the most I/O requests. Red areas represent high concentration ("hot zones").
          </p>
        </motion.div>

      </div>
    </div>
  )
}
