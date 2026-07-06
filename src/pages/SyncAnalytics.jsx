import React, { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import useSyncStore from '@/store/useSyncStore'
import { AlertCircle } from 'lucide-react'

export default function SyncAnalytics() {
  const { results, activeProblem } = useSyncStore()

  const { stateChartData, histogramData, heatmapData } = useMemo(() => {
    if (!results || !results.timeline) return { stateChartData: [], histogramData: [], heatmapData: [] }

    // 1. Thread State Area Chart
    const maxTime = results.timeline[results.timeline.length - 1]?.time || 0
    const resolution = Math.max(1, Math.floor(maxTime / 50))
    const timePoints = []
    
    // Evaluate state at each time bucket
    const currentStates = Array(results.threads.length).fill('idle')
    let evIdx = 0
    
    for (let t = 0; t <= maxTime; t += resolution) {
      // Process events up to t
      while(evIdx < results.timeline.length && results.timeline[evIdx].time <= t) {
        const ev = results.timeline[evIdx]
        if (ev.event_type.includes('waiting') || ev.event_type === 'hungry') {
          currentStates[ev.thread_id] = 'waiting'
        } else if (['acquire', 'produce', 'consume', 'read_start', 'write_start', 'eat'].includes(ev.event_type)) {
          currentStates[ev.thread_id] = 'blocked' // critical
        } else if (['release', 'produce_done', 'consume_done', 'read_end', 'write_end', 'think'].includes(ev.event_type)) {
          currentStates[ev.thread_id] = 'running'
        }
        evIdx++
      }
      
      let running = 0, waiting = 0, blocked = 0
      currentStates.forEach(s => {
        if (s === 'running') running++
        else if (s === 'waiting') waiting++
        else if (s === 'blocked') blocked++
      })
      
      timePoints.push({ time: t, running, waiting, blocked })
    }

    // 2. Wait-time Histogram
    let allWaits = []
    results.threads.forEach(t => {
       allWaits = allWaits.concat(t.wait_samples)
    })
    
    let hist = []
    if (allWaits.length > 0) {
       const maxW = Math.max(...allWaits)
       const minW = Math.min(...allWaits)
       const binSize = Math.max(1, (maxW - minW) / 10)
       
       for(let i=0; i<10; i++) {
         hist.push({ 
            range: `${Math.floor(minW + i*binSize)}-${Math.floor(minW + (i+1)*binSize)}`, 
            count: 0,
            min: minW + i*binSize,
            max: minW + (i+1)*binSize
         })
       }
       
       allWaits.forEach(w => {
         let bin = Math.floor((w - minW) / binSize)
         if (bin >= 10) bin = 9
         hist[bin].count++
       })
    }

    // 3. Heatmap for Dining Philosophers
    let heat = []
    if (activeProblem === 'dining' && results.contention_heatmap) {
      heat = results.contention_heatmap
    }

    return { stateChartData: timePoints, histogramData: hist, heatmapData: heat }
  }, [results, activeProblem])

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-surface border border-border rounded-[8px] p-12 text-center">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">No Analytics Data</h2>
          <p className="text-text-muted">Run a simulation first to view analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Sync <span className="text-accent">Analytics</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Evolution Area Chart */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl">
           <h3 className="text-lg font-bold text-text-primary mb-6">Global Thread States Over Time</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stateChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                 <XAxis dataKey="time" stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                 <YAxis stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                 <Legend />
                 <Area type="monotone" dataKey="running" stackId="1" stroke="var(--border)" fill="var(--text-muted)" fillOpacity={0.3} />
                 <Area type="monotone" dataKey="waiting" stackId="1" stroke="var(--border)" fill="var(--text-muted)" fillOpacity={0.3} />
                 <Area type="monotone" dataKey="blocked" stackId="1" stroke="var(--border)" fill="var(--text-muted)" fillOpacity={0.3} name="In Critical Section" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Wait Time Histogram */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl">
           <h3 className="text-lg font-bold text-text-primary mb-6">Wait Time Distribution</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={histogramData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                 <XAxis dataKey="range" stroke="var(--border)" tick={{fill: '#94a3b8', fontSize: 12}} angle={-45} textAnchor="end" height={60} />
                 <YAxis stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} cursor={{fill: '#1e293b'}} />
                 <Bar dataKey="count" name="Frequency" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Heatmap (Only Dining Philosophers) */}
        {activeProblem === 'dining' && heatmapData.length > 0 && (
          <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl lg:col-span-2">
            <h3 className="text-lg font-bold text-text-primary mb-6">Fork Contention Heatmap</h3>
            <div className="flex justify-center">
              <div className="grid grid-cols-5 gap-1 p-4 bg-base rounded-[5px]">
                {/* Find max contention for scaling */}
                {(() => {
                   const maxCont = Math.max(...heatmapData.map(h => h.count), 1)
                   const cells = []
                   for(let i=0; i<5; i++){
                     for(let j=0; j<5; j++){
                        const entry = heatmapData.find(h => (h.p1 === Math.min(i,j) && h.p2 === Math.max(i,j)))
                        const val = entry ? entry.count : 0
                        const intensity = val / maxCont
                        cells.push(
                          <div key={`${i}-${j}`} className="w-16 h-16 flex items-center justify-center rounded text-sm font-bold border border-border transition-colors"
                               style={{ backgroundColor: i === j ? '#0f172a' : `rgba(239, 68, 68, ${intensity * 0.8})` }}
                               title={`P${i} vs P${j}: ${val} contention events`}>
                             {i === j ? '-' : val}
                          </div>
                        )
                     }
                   }
                   return cells
                })()}
              </div>
            </div>
            <p className="text-center text-text-muted mt-4 text-sm">Number of times philosopher pairs collided while acquiring forks.</p>
          </div>
        )}
      </div>
    </div>
  )
}
