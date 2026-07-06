import React from 'react'
import { Play, Square, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PageReplacementStepControls({
  currentStepIndex,
  totalSteps,
  isPlaying,
  onStepChange,
  onTogglePlay,
  onStop
}) {
  const isFirst = currentStepIndex === -1
  const isLast = currentStepIndex === totalSteps - 1

  return (
    <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-l-indigo-500">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-[5px] bg-elevated border border-border-muted">
          <span className="text-sm font-medium text-text-secondary">
            Step: <span className="text-text-primary font-mono">{currentStepIndex + 1}</span>
            <span className="text-text-muted"> / {totalSteps}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onStepChange(-1)}
          disabled={isFirst || isPlaying}
          className="btn-secondary p-2"
          title="Reset (Home)"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStepChange(currentStepIndex - 1)}
          disabled={isFirst || isPlaying}
          className="btn-secondary p-2"
          title="Previous Step (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLast && !isPlaying}
          className={`px-6 py-2 rounded-[5px] font-medium flex items-center gap-2 transition-all ${
            isPlaying
              ? 'bg-amber-500/20 text-orange border border-orange hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-green border border-green hover:bg-emerald-500/30'
          } ${isLast && !isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Auto Play'}
        </button>

        <button
          onClick={() => onStepChange(currentStepIndex + 1)}
          disabled={isLast || isPlaying}
          className="btn-secondary p-2"
          title="Next Step (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => onStepChange(totalSteps - 1)}
          disabled={isLast || isPlaying}
          className="btn-secondary p-2"
          title="Skip to End (End)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full sm:w-auto flex-1 max-w-xs">
        <div className="h-2 w-full bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
