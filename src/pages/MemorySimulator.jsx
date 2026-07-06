import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Save, Download, AlertCircle, ToggleLeft, ToggleRight, Layers, FileText } from 'lucide-react'
import useMemoryStore from '@/store/useMemoryStore'
import MemoryForm from '@/components/memory/MemoryForm'
import MemoryMap from '@/components/memory/MemoryMap'
import MemoryMetrics from '@/components/memory/MemoryMetrics'
import MemoryStepControls from '@/components/memory/MemoryStepControls'
import { exportMemoryToPDF, exportMemoryToCSV } from '@/utils/exportHelpers'

const ALGORITHMS = [
  { value: 'FirstFit', label: 'First Fit', description: 'Allocates the first hole that is big enough. Fast, but can leave small unusable fragments at the beginning of memory.' },
  { value: 'BestFit', label: 'Best Fit', description: 'Allocates the smallest hole that is big enough. Minimizes wasted space but leaves tiny, unusable leftover fragments.' },
  { value: 'WorstFit', label: 'Worst Fit', description: 'Allocates the largest available hole. Leaves large fragments that can be useful for future requests.' },
  { value: 'NextFit', label: 'Next Fit', description: 'Similar to First Fit, but starts searching from the location of the last placement rather than the beginning.' },
]

export default function MemorySimulator() {
  const algorithm = useMemoryStore(s => s.algorithm)
  const setAlgorithm = useMemoryStore(s => s.setAlgorithm)
  
  const blocks = useMemoryStore(s => s.blocks)
  const processes = useMemoryStore(s => s.processes)
  
  const results = useMemoryStore(s => s.results)
  const runSimulation = useMemoryStore(s => s.runSimulation)
  const saveSimulation = useMemoryStore(s => s.saveSimulation)
  const error = useMemoryStore(s => s.error)
  const isLoading = useMemoryStore(s => s.isLoading)
  
  const isStepMode = useMemoryStore(s => s.isStepMode)
  const setStepMode = useMemoryStore(s => s.setStepMode)
  const stepIndex = useMemoryStore(s => s.stepIndex)
  const runStep = useMemoryStore(s => s.runStep)
  const allocationSteps = useMemoryStore(s => s.allocationSteps)

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'm' || e.key === 'M') { isStepMode ? runStep() : runSimulation() }
      if (e.key === 'n' || e.key === 'N') { if (isStepMode) useMemoryStore.getState().stepForward() }
      if (e.key === 'p' || e.key === 'P') { if (isStepMode) useMemoryStore.getState().stepBackward() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isStepMode, runSimulation, runStep])

  const handleExportPDF = async () => {
    if (!results) return
    try {
      await exportMemoryToPDF(results, algorithm, blocks, processes)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  // Which blocks state to show based on stepIndex
  const currentBlocksState = isStepMode && stepIndex > 0 && allocationSteps[stepIndex - 1]
    ? allocationSteps[stepIndex - 1].blocksState
    : (results ? results.finalBlocks : blocks)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent rounded-[8px]"><Layers className="w-6 h-6 text-accent" /></div>
            Memory Simulator
          </h1>
          <p className="mt-2 text-text-muted max-w-2xl text-sm">
            Simulate contiguous memory allocation with fixed partitions. Compare First Fit, Best Fit, Worst Fit, and Next Fit.
          </p>
        </div>
        
        {results && (
          <div className="flex items-center gap-2">
            <button onClick={() => exportMemoryToCSV(results, algorithm)} className="btn-secondary px-4 py-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleExportPDF} className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={saveSimulation} className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red rounded-[5px] flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="card p-5 h-full flex flex-col">
            <h2 className="section-title mb-5"><Layers className="w-4 h-4" /> Algorithm</h2>
            <div className="space-y-2">
              {ALGORITHMS.map((alg) => (
                <label key={alg.value} className={`relative flex items-center p-3 cursor-pointer rounded-[5px] border transition-all ${algorithm === alg.value ? 'bg-accent border-accent' : 'bg-surface border-border-muted hover:bg-elevated'}`}>
                  <input type="radio" name="algorithm" value={alg.value} className="sr-only" checked={algorithm === alg.value} onChange={() => setAlgorithm(alg.value)} />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${algorithm === alg.value ? 'border-accent' : 'border-slate-500'}`}>
                    {algorithm === alg.value && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                  <span className={`text-sm font-medium ${algorithm === alg.value ? 'text-indigo-200' : 'text-text-secondary'}`}>{alg.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[5px] flex-1 overflow-y-auto">
              <p className="text-xs text-indigo-200 leading-relaxed">
                {ALGORITHMS.find(a => a.value === algorithm)?.description}
              </p>
            </div>

            <div className="pt-4 mt-5 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Enable Step Mode</span>
              <button onClick={() => setStepMode(!isStepMode)} className="text-text-muted hover:text-text-primary transition-colors">
                {isStepMode ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <button onClick={isStepMode ? runStep : runSimulation} disabled={blocks.length === 0 || processes.length === 0 || isLoading} className="btn-primary w-full py-3 mt-5">
              <Play className="w-5 h-5 mr-2 inline" /> {isStepMode ? 'Initialize Step Mode' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          <MemoryForm />

          {results && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {isStepMode && <MemoryStepControls />}

              <div className="card p-5 space-y-4">
                <h2 className="section-title"><Layers className="w-4 h-4" /> Memory Map</h2>
                <MemoryMap blocks={currentBlocksState} processes={processes} stepIndex={stepIndex} isStepMode={isStepMode} />
              </div>

              {!isStepMode && (
                <>
                  <MemoryMetrics metrics={results.metrics} />
                  
                  <div className="card p-5 space-y-4">
                    <h2 className="section-title"><FileText className="w-4 h-4" /> Allocation Results</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-muted text-xs uppercase tracking-wider text-text-muted">
                            <th className="pb-3 font-semibold px-2">Process</th>
                            <th className="pb-3 font-semibold px-2">Size</th>
                            <th className="pb-3 font-semibold px-2">Status</th>
                            <th className="pb-3 font-semibold px-2">Block</th>
                            <th className="pb-3 font-semibold px-2 text-right">Internal Frag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {results.processResults.map((pr) => (
                            <tr key={pr.id} className="text-sm">
                              <td className="py-3 px-2 font-mono font-medium text-text-primary">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pr.color }} /> {pr.id}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-text-secondary">{pr.size}u</td>
                              <td className="py-3 px-2">
                                {pr.isAllocated ? <span className="badge badge-emerald">Allocated</span> : <span className="badge badge-rose">Failed</span>}
                              </td>
                              <td className="py-3 px-2 text-text-secondary">{pr.isAllocated ? pr.blockId : '-'}</td>
                              <td className="py-3 px-2 text-right text-text-secondary">{pr.isAllocated ? pr.internalFrag : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
