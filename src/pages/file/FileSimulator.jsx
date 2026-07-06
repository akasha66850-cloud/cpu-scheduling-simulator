import React, { useEffect } from 'react'
import { RotateCcw, Play, SkipBack, SkipForward } from 'lucide-react'
import useFileStore from '@/store/useFileStore'

import DirectoryPanel from '@/components/file/DirectoryPanel'
import DiskGrid from '@/components/file/DiskGrid'
import FileMetrics from '@/components/file/FileMetrics'

export default function FileSimulator() {
  const { 
    selectedAlgorithm, setAlgorithm, 
    diskSize, setDiskSize, 
    resetDisk,
    stepForward, stepBackward, historyIndex, history
  } = useFileStore()

  // Keyboard shortcuts (F, N, B, Del)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input') return

      // F for full reset/run is tough here because it's interactive, but we can bind F to random allocation for fun, or just keep it minimal.
      if (e.key.toLowerCase() === 'n') {
        stepForward()
      }
      if (e.key.toLowerCase() === 'b') {
        stepBackward()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stepForward, stepBackward])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            File <span className="text-accent">Allocation</span>
          </h1>
          <p className="mt-2 text-text-muted text-sm max-w-2xl">
            Interactive native simulation of Contiguous, Linked, and Indexed file allocation algorithms with a logical directory tree.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={resetDisk} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Clear Disk
          </button>
        </div>
      </div>

      {/* Config Panel */}
      <div className="bg-surface border border-border rounded-[8px] p-4 flex flex-wrap gap-6 items-center shadow-md">
         <div className="flex items-center gap-3">
           <label className="text-sm font-semibold text-text-secondary">Algorithm:</label>
           <select 
              value={selectedAlgorithm} 
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-base border border-border-muted rounded-[5px] px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
           >
              <option value="contiguous">Contiguous Allocation</option>
              <option value="linked">Linked Allocation</option>
              <option value="indexed">Indexed Allocation</option>
           </select>
         </div>

         <div className="flex items-center gap-3">
           <label className="text-sm font-semibold text-text-secondary">Disk Size:</label>
           <input 
              type="range" min="16" max="128" step="16"
              value={diskSize}
              onChange={(e) => setDiskSize(parseInt(e.target.value))}
              className="w-32 accent-indigo-500"
           />
           <span className="text-sm font-bold text-text-primary w-8">{diskSize}</span>
         </div>
         
         <div className="ml-auto flex items-center gap-2 bg-base rounded-[5px] p-1 border border-border">
           <button onClick={stepBackward} disabled={historyIndex <= 0} className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded hover:bg-elevated transition-colors">
              <SkipBack className="w-4 h-4" />
           </button>
           <div className="text-xs font-mono text-text-muted px-2">Step {historyIndex+1}/{history.length}</div>
           <button onClick={stepForward} disabled={historyIndex >= history.length - 1} className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded hover:bg-elevated transition-colors">
              <SkipForward className="w-4 h-4" />
           </button>
         </div>
      </div>

      <FileMetrics />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DirectoryPanel />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <DiskGrid />
        </div>
      </div>
      
    </div>
  )
}
