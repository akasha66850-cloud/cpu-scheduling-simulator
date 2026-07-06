import React, { useState } from 'react'
import { Play } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { runFileAlgorithm } from '@/utils/fileAlgorithms'
import { exportFileComparisonToPDF } from '@/utils/exportHelpers'

export default function FileComparison() {
  const [diskSize, setDiskSize] = useState(64)
  const [numFiles, setNumFiles] = useState(10)
  const [results, setResults] = useState([])
  const [isCalculating, setIsCalculating] = useState(false)

  const handleRunAll = async () => {
    setIsCalculating(true)
    try {
      const algorithms = [
        { id: 'contiguous', name: 'Contiguous' },
        { id: 'linked', name: 'Linked' },
        { id: 'indexed', name: 'Indexed' }
      ]

      // Generate random workload (file sizes between 2 and 8 blocks)
      const workload = Array.from({length: numFiles}, () => Math.floor(Math.random() * 7) + 2)

      const completed = []
      
      for (const algo of algorithms) {
         let currentBlocks = Array(diskSize).fill(0)
         let totalUsed = 0
         let failedAllocations = 0
         let extFrag = 0
         let totalDistance = 0
         let distanceLinks = 0

         for (const size of workload) {
             const payload = {
                action: "allocate",
                algo: algo.id,
                size: size,
                blocks: currentBlocks
             }
             const res = await runFileAlgorithm(payload)
             if (res.success) {
                // Apply blocks
                if (algo.id === 'contiguous') {
                    res.allocated_indices.forEach(idx => currentBlocks[idx] = 1)
                    totalDistance += size - 1 // Contiguous is adjacent
                    distanceLinks += size - 1
                } 
                else if (algo.id === 'linked') {
                    res.allocated_indices.forEach(idx => currentBlocks[idx] = 1)
                    for(let i=0; i<res.allocated_indices.length - 1; i++){
                       totalDistance += Math.abs(res.allocated_indices[i+1] - res.allocated_indices[i])
                       distanceLinks++
                   }
                }
                else if (algo.id === 'indexed') {
                    currentBlocks[res.index_block] = 1
                    res.allocated_indices.forEach(idx => currentBlocks[idx] = 1)
                    res.allocated_indices.forEach(idx => {
                       totalDistance += Math.abs(idx - res.index_block)
                       distanceLinks++
                    })
                }
                extFrag = res.external_frag
             } else {
                failedAllocations++
             }
         }
         
         const used = currentBlocks.filter(b => b === 1).length
         const avgDistance = distanceLinks > 0 ? (totalDistance / distanceLinks) : 0
         
         completed.push({
            name: algo.name,
            usedBlocks: used,
            fragmentation: extFrag,
            avgSeek: avgDistance,
            successRate: ((workload.length - failedAllocations) / workload.length) * 100
         })
      }

      setResults(completed)
    } catch (err) {
      console.error(err)
      alert("Error calculating comparison")
    } finally {
      setIsCalculating(false)
    }
  }

  const exportPDF = () => {
      exportFileComparisonToPDF(results, { diskSize, numFiles })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Allocation <span className="text-accent">Comparison</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Race Contiguous, Linked, and Indexed algorithms against the same file workload to expose disk utilization efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportPDF} disabled={results.length === 0} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
            Export PDF
          </button>
          <button onClick={handleRunAll} disabled={isCalculating} className="btn-primary px-6 py-2.5 text-base flex items-center gap-2 shadow-glow disabled:opacity-50">
            <Play className="w-5 h-5" /> {isCalculating ? 'Simulating...' : 'Race Algorithms'}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 flex gap-6 shadow-md">
         <div className="flex flex-col">
            <label className="text-xs text-text-muted mb-1">Disk Size (Blocks)</label>
            <input type="number" value={diskSize} onChange={e=>setDiskSize(parseInt(e.target.value))} className="bg-base border border-border-muted rounded px-3 py-1 text-text-primary text-sm" />
         </div>
         <div className="flex flex-col">
            <label className="text-xs text-text-muted mb-1">Random Workload (Files)</label>
            <input type="number" value={numFiles} onChange={e=>setNumFiles(parseInt(e.target.value))} className="bg-base border border-border-muted rounded px-3 py-1 text-text-primary text-sm" />
         </div>
      </div>

      {results.length > 0 && (
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-xl space-y-8" id="comparison-content">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                <YAxis yAxisId="left" stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--border)" tick={{fill: '#94a3b8'}} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="usedBlocks" name="Blocks Utilized" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="fragmentation" name="Ext Fragmentation %" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgSeek" name="Avg Spread Distance" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase bg-base">Algorithm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase bg-base">Success Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase bg-base">Used Blocks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase bg-base">Ext Frag %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase bg-base">Avg Block Spread</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-surface">
                {results.map((r, i) => {
                   const bestSuccess = Math.max(...results.map(res => res.successRate))
                   const lowestFrag = Math.min(...results.map(res => res.fragmentation))
                   const lowestSpread = Math.min(...results.map(res => res.avgSeek))
                   return (
                     <tr key={i} className="hover:bg-elevated transition-colors">
                       <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{r.name}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                          {r.successRate.toFixed(1)}% {r.successRate === bestSuccess && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-green">Best</span>}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{r.usedBlocks}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                          {r.fragmentation.toFixed(1)}% {r.fragmentation === lowestFrag && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-green">Best</span>}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                          {r.avgSeek.toFixed(1)} {r.avgSeek === lowestSpread && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-green">Best</span>}
                       </td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
