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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-accent" />
            Page Replacement
          </h1>
          <p className="mt-2 text-text-muted text-sm">
            Simulate and visualize memory paging algorithms step-by-step.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap mt-4 md:mt-0">
          {results && currentStepIndex === results.steps.length - 1 && (
            <>
              <button 
                onClick={() => exportPageReplacementToCSV(results, algorithm, referenceString, frameCount)} 
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Export CSV
              </button>
              <button 
                onClick={() => exportPageReplacementToPDF(results, algorithm, referenceString, frameCount)} 
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={handleSave} className="btn-secondary px-4 py-2 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </>
          )}
          <button
            onClick={handleRun}
            className="btn-primary px-6 py-2 flex items-center gap-2 shadow-glow"
          >
            <Play className="w-4 h-4" /> Run Simulation
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PageReplacementForm algorithm={algorithm} setAlgorithm={setAlgorithm} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <PageFramesVisualization 
            frames={displayFrames}
            frameCount={frameCount}
            currentPage={displayPage}
            isHit={isHit}
            evictedPage={evictedPage}
          />
          
          {results && (
            <>
              <PageReplacementStepControls 
                currentStepIndex={currentStepIndex}
                totalSteps={results.steps.length}
                isPlaying={isPlaying}
                onStepChange={setCurrentStepIndex}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
              />
              <PageReplacementMetrics metrics={liveMetrics} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
