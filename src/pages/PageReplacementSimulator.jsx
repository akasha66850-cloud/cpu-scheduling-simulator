import React, { useState, useEffect, useCallback } from 'react'
import { Save, Download, Play, RefreshCw, FileText } from 'lucide-react'
import PageReplacementForm from '@/components/pageReplacement/PageReplacementForm'
import PageFramesVisualization from '@/components/pageReplacement/PageFramesVisualization'
import PageReplacementStepControls from '@/components/pageReplacement/PageReplacementStepControls'
import PageReplacementMetrics from '@/components/pageReplacement/PageReplacementMetrics'
import usePageReplacementStore from '@/store/usePageReplacementStore'
import { runPageAlgorithm } from '@/utils/pageAlgorithms'
import { exportPageReplacementToPDF, exportPageReplacementToCSV } from '@/utils/exportHelpers'

const ALGORITHMS = {
  FIFO: 'FIFO',
  LRU: 'LRU',
  Optimal: 'Optimal',
  SecondChance: 'SecondChance'
}

export default function PageReplacementSimulator() {
  const referenceString = usePageReplacementStore((s) => s.referenceString)
  const frameCount = usePageReplacementStore((s) => s.frameCount)
  const saveSimulation = usePageReplacementStore((s) => s.saveSimulation)

  const [algorithm, setAlgorithm] = useState('FIFO')
  const [results, setResults] = useState(null)
  
  // Step state
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)

  // Run simulation
  const handleRun = useCallback(async () => {
    if (!referenceString) return
    setIsPlaying(false)
    setCurrentStepIndex(-1)
    
    try {
      const payload = {
        algorithm,
        referenceString,
        frameCount
      }
      const out = await runPageAlgorithm(payload)
      setResults(out)
    } catch (err) {
      console.error("Failed to run Page Replacement WASM", err)
      alert("Failed to run WebAssembly module. Check console.")
    }
  }, [algorithm, referenceString, frameCount])

  // Handle play/pause
  useEffect(() => {
    let timer
    if (isPlaying && results && currentStepIndex < results.steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1)
      }, 800)
    } else if (currentStepIndex >= (results?.steps.length || 0) - 1) {
      setIsPlaying(false)
    }
    return () => clearTimeout(timer)
  }, [isPlaying, currentStepIndex, results])

  // Current step data
  const currentStep = results && currentStepIndex >= 0 ? results.steps[currentStepIndex] : null

  // Frame state to show
  const displayFrames = currentStep ? currentStep.frames : []
  const displayPage = currentStep ? currentStep.page : null
  const isHit = currentStep ? currentStep.isHit : false
  const evictedPage = currentStep ? currentStep.evicted : null

  // Compute live metrics if mid-step
  const liveMetrics = React.useMemo(() => {
    if (!results) return null
    if (currentStepIndex === results.steps.length - 1) return results.metrics // full
    
    // Calculate live up to current index
    const stepsUpToNow = results.steps.slice(0, currentStepIndex + 1)
    const hits = stepsUpToNow.filter(s => s.isHit).length
    const faults = stepsUpToNow.length - hits
    const total = stepsUpToNow.length
    
    return {
      pageFaults: faults,
      pageHits: hits,
      faultRate: total > 0 ? (faults / total) * 100 : 0,
      hitRate: total > 0 ? (hits / total) * 100 : 0
    }
  }, [results, currentStepIndex])

  const handleSave = () => {
    if (!results) return
    saveSimulation({
      algorithm,
      referenceString,
      frameCount,
      metrics: results.metrics
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-[20px] items-start">
        
        {/* ── LEFT COLUMN (Primary Content) ── */}
        <div className="flex flex-col gap-[20px] min-w-0 w-full">
          <PageFramesVisualization 
            frames={displayFrames}
            frameCount={frameCount}
            currentPage={displayPage}
            isHit={isHit}
            evictedPage={evictedPage}
          />
          
          {results ? (
            <div className="space-y-6">
              <PageReplacementStepControls 
                currentStepIndex={currentStepIndex}
                totalSteps={results.steps.length}
                isPlaying={isPlaying}
                onStepChange={setCurrentStepIndex}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
              />
              <PageReplacementMetrics metrics={liveMetrics} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 card border-dashed border-border-muted mt-4">
              <RefreshCw className="w-12 h-12 text-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-text-secondary">No Simulation Results</h3>
              <p className="text-sm text-text-muted mt-2 text-center max-w-sm">
                Configure your reference string and frame count on the right, then run the simulation.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (Secondary/Context) ── */}
        <div className="flex flex-col gap-[20px] w-full">
          
          <PageReplacementForm algorithm={algorithm} setAlgorithm={setAlgorithm} />

          <button
            onClick={handleRun}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-glow"
          >
            <Play className="w-5 h-5" /> Run Simulation
          </button>

          {results && currentStepIndex === results.steps.length - 1 && (
            <div className="flex flex-col gap-3 mt-2">
              <button onClick={handleSave} className="btn-secondary w-full py-2 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => exportPageReplacementToPDF(results, algorithm, referenceString, frameCount)} 
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => exportPageReplacementToCSV(results, algorithm, referenceString, frameCount)} 
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
