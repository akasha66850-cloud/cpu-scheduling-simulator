import React, { useEffect, useRef } from 'react'
import { FastForward, Pause, Play, SkipBack, SkipForward, ArrowRight, ArrowLeft } from 'lucide-react'
import useSyncStore from '@/store/useSyncStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function SyncStepView() {
  const { results, isStepMode, setStepMode, stepIndex, stepForward, stepBackward, setProblem } = useSyncStore()
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [stepIndex])

  if (!results) return null

  const maxSteps = results.timeline ? results.timeline.length : 0
  const currentEvents = results.timeline?.slice(0, stepIndex) || []
  const latestEvent = currentEvents.length > 0 ? currentEvents[currentEvents.length - 1] : null

  return (
    <div className="bg-surface border border-border rounded-[8px] p-5 md:p-6 shadow-xl flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          Step-by-Step Viewer
        </h2>
        <button
          onClick={() => setStepMode(!isStepMode)}
          className={`px-3 py-1.5 rounded-[5px] text-sm font-medium transition-colors ${
            isStepMode ? 'bg-amber-500/20 text-orange border border-orange' : 'bg-elevated text-text-muted hover:bg-overlay'
          }`}
        >
          {isStepMode ? 'Exit Step Mode' : 'Enter Step Mode'}
        </button>
      </div>

      {isStepMode ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 bg-base rounded-[5px] border border-border mb-4">
            <button onClick={stepBackward} disabled={stepIndex === 0} className="p-2 text-text-muted hover:text-text-primary disabled:opacity-50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="text-lg font-bold text-text-primary">Step {stepIndex} <span className="text-text-muted text-sm font-normal">/ {maxSteps}</span></div>
              {latestEvent && (
                <div className="text-sm text-accent font-medium mt-1">
                  t={latestEvent.time}ms: Thread {latestEvent.thread_id} {latestEvent.event_type} {latestEvent.resource_id > 0 ? `(Res: ${latestEvent.resource_id})` : ''}
                </div>
              )}
            </div>
            <button onClick={stepForward} disabled={stepIndex === maxSteps} className="p-2 text-text-muted hover:text-text-primary disabled:opacity-50">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div 
            ref={logRef}
            className="flex-1 overflow-y-auto bg-base rounded-[5px] border border-border p-4 space-y-2 font-mono text-sm"
          >
            {currentEvents.length === 0 ? (
              <div className="text-text-muted text-center py-4">Timeline log is empty. Step forward to begin.</div>
            ) : (
              <AnimatePresence initial={false}>
                {currentEvents.map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded ${i === stepIndex - 1 ? 'bg-accent text-indigo-300 border border-accent' : 'text-text-muted border border-transparent'}`}
                  >
                    <span className="text-text-muted mr-2">[{ev.time}ms]</span>
                    <span className="text-text-secondary font-semibold mr-2">T{ev.thread_id}</span>
                    {ev.event_type} {ev.resource_id > 0 ? `resource ${ev.resource_id}` : ''}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-muted bg-base rounded-[5px] border border-border">
          <div className="text-center">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Simulation complete. Toggle step mode to rewind and view logs.</p>
          </div>
        </div>
      )}
    </div>
  )
}
