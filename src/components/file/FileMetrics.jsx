import React from 'react'
import useFileStore from '@/store/useFileStore'
import { HardDrive, Search, Maximize2, AlertTriangle, Layers, FileIcon } from 'lucide-react'

export default function FileMetrics() {
  const { metrics, diskSize } = useFileStore()

  const formatFrag = (val) => isNaN(val) ? "0.0%" : val.toFixed(1) + "%"

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md group relative">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <HardDrive className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Used Blocks</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{metrics.usedBlocks} <span className="text-sm font-normal text-text-muted">/ {diskSize}</span></div>
        <div className="text-xs text-accent mt-1">{((metrics.usedBlocks / diskSize) * 100).toFixed(1)}% Utilized</div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <Search className="w-4 h-4 text-green" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Free Blocks</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{metrics.freeBlocks}</div>
        <div className="text-xs text-green mt-1">{((metrics.freeBlocks / diskSize) * 100).toFixed(1)}% Free</div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md group relative">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <Maximize2 className="w-4 h-4 text-orange" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Max Contiguous</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{metrics.maxContiguous}</div>
        
        {/* Tooltip */}
        <div className="absolute opacity-0 group-hover:opacity-100 bg-base text-text-secondary text-xs p-3 rounded-[5px] border border-border-muted shadow-xl -top-16 left-1/2 transform -translate-x-1/2 w-48 pointer-events-none z-50 transition-opacity">
          <div className="font-bold text-orange mb-1">Largest Free Run</div>
          The largest continuous sequence of free blocks available for allocation.
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md group relative">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <AlertTriangle className="w-4 h-4 text-red" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Ext. Frag %</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{formatFrag(metrics.externalFrag)}</div>
        
        <div className="absolute opacity-0 group-hover:opacity-100 bg-base text-text-secondary text-xs p-3 rounded-[5px] border border-border-muted shadow-xl -top-16 left-1/2 transform -translate-x-1/2 w-64 pointer-events-none z-50 transition-opacity">
          <div className="font-bold text-red mb-1">External Fragmentation</div>
          Formula: <code className="bg-elevated px-1 rounded">(1 - max_contiguous / total_free) * 100</code>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md group relative">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <Layers className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Int. Frag</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{metrics.internalFrag} <span className="text-sm font-normal text-text-muted">blks</span></div>
        <div className="absolute opacity-0 group-hover:opacity-100 bg-base text-text-secondary text-xs p-3 rounded-[5px] border border-border-muted shadow-xl -top-16 left-1/2 transform -translate-x-1/2 w-56 pointer-events-none z-50 transition-opacity">
          <div className="font-bold text-purple-400 mb-1">Internal Fragmentation</div>
          Wasted space inside allocated blocks (Zero in this 1:1 discrete simulation model).
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[8px] p-4 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-text-muted">
          <FileIcon className="w-4 h-4 text-cyan" />
          <h4 className="text-xs font-semibold uppercase tracking-wider">Avg File Size</h4>
        </div>
        <div className="text-2xl font-bold text-text-primary">{metrics.avgFileSize.toFixed(1)} <span className="text-sm font-normal text-text-muted">blks</span></div>
      </div>
    </div>
  )
}
