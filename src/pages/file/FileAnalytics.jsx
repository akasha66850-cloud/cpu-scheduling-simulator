import React, { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useFileStore from '@/store/useFileStore'
import { AlertCircle } from 'lucide-react'

export default function FileAnalytics() {
  const { files, diskBlocks, history, diskSize } = useFileStore()

  const { sizeDistributionData, heatMapData, timelineData } = useMemo(() => {
    if (Object.keys(files).length === 0 && history.length === 0) return { sizeDistributionData: [], heatMapData: [], timelineData: [] }

    // 1. File Size Distribution
    const sizes = Object.values(files).map(f => f.size)
    const dist = []
    if (sizes.length > 0) {
       for(let i=1; i<=10; i++) {
          const count = sizes.filter(s => s === i).length
          dist.push({ size: `${i} Blks`, count })
       }
       const count11plus = sizes.filter(s => s > 10).length
       dist.push({ size: `11+ Blks`, count: count11plus })
    }

    // 2. Block Utilization Heatmap (density of block allocation over history)
    const heatmap = Array(diskSize).fill(0)
    history.forEach(snap => {
       snap.diskBlocks.forEach((b, i) => {
          if (b !== null) heatmap[i]++
       })
    })

    // 3. Efficiency Over Time (Utilization %)
    const timeline = history.map((snap, i) => {
       const used = snap.diskBlocks.filter(b => b !== null).length
       const util = (used / diskSize) * 100
       return { step: i, utilization: util, extFrag: snap.metrics.externalFrag }
    })

    return { sizeDistributionData: dist, heatMapData: heatmap, timelineData: timeline }
  }, [files, diskBlocks, history, diskSize])

  if (history.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-surface border border-border rounded-[8px] p-12 text-center">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">No Analytics Data</h2>
          <p className="text-text-muted">Allocate and delete some files in the simulator to view analytics over time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            File <span className="text-accent">Analytics</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline Area Chart */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl lg:col-span-2">
           <h3 className="text-lg font-bold text-text-primary mb-6">Disk Utilization & Fragmentation Timeline</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                 <XAxis dataKey="step" stroke="var(--border)" tick={{fill: '#94a3b8'}} label={{ value: 'Operation Steps', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                 <YAxis stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                 <Area type="monotone" dataKey="utilization" name="Disk Utilization %" stroke="var(--border)" fill="var(--text-muted)" fillOpacity={0.3} />
                 <Area type="monotone" dataKey="extFrag" name="External Frag %" stroke="var(--border)" fill="var(--text-muted)" fillOpacity={0.3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Size Distribution */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl">
           <h3 className="text-lg font-bold text-text-primary mb-6">File Size Distribution</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sizeDistributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                 <XAxis dataKey="size" stroke="var(--border)" tick={{fill: '#94a3b8', fontSize: 12}} />
                 <YAxis stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} cursor={{fill: '#1e293b'}} />
                 <Bar dataKey="count" name="Number of Files" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Hotness Heatmap */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl">
           <h3 className="text-lg font-bold text-text-primary mb-6">Block Allocation Heatmap</h3>
           <p className="text-xs text-text-muted mb-4">Color intensity indicates how frequently a specific block was occupied during your historical simulation steps.</p>
           <div className="flex flex-wrap gap-1">
             {heatMapData.map((count, i) => {
                const maxCount = Math.max(...heatMapData, 1)
                const intensity = count / maxCount
                return (
                  <div 
                     key={i} 
                     className="w-8 h-8 rounded text-[10px] flex items-center justify-center font-bold text-text-primary transition-colors"
                     style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})`, border: '1px solid #1e293b' }}
                     title={`Block ${i}: Occupied in ${count} steps`}
                  >
                     {i}
                  </div>
                )
             })}
           </div>
        </div>

      </div>
    </div>
  )
}
