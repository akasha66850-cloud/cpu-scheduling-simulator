import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, BarChart2, Activity } from 'lucide-react'
import usePageReplacementStore from '@/store/usePageReplacementStore'
import BeladyAnomalyDetector from '@/components/pageReplacement/BeladyAnomalyDetector'
import { runPageAlgorithm } from '@/utils/pageAlgorithms'

export default function PageReplacementAnalytics() {
  const referenceString = usePageReplacementStore(s => s.referenceString)
  const frameCount = usePageReplacementStore(s => s.frameCount)

  const [activeTab, setActiveTab] = useState('belady')

  const [heatmapData, setHeatmapData] = React.useState(null)

  React.useEffect(() => {
    const fetchHeatmap = async () => {
      if (!referenceString) return
      try {
        const payload = {
          algorithm: 'LRU',
          referenceString,
          frameCount
        }
        const res = await runPageAlgorithm(payload)
        setHeatmapData(res.steps)
      } catch (err) {
        console.error("Failed to fetch heatmap data", err)
      }
    }
    fetchHeatmap()
  }, [referenceString, frameCount])

  if (!referenceString) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-text-muted">
        Please configure the reference string in the Simulator first.
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-accent" />
          Page Replacement Analytics
        </h1>
        <p className="mt-2 text-text-muted text-sm">
          Deep dive into anomalies and reference string fault distributions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-muted mb-6">
        <button
          onClick={() => setActiveTab('belady')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'belady' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          Belady's Anomaly
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'heatmap' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          LRU Fault Heatmap
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'belady' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <BeladyAnomalyDetector referenceString={referenceString} />
        </motion.div>
      )}

      {activeTab === 'heatmap' && heatmapData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Reference String Hit/Fault Map</h2>
          </div>
          
          <p className="text-text-muted text-sm mb-4">
            Visualizing exactly where page faults (red) and hits (green) occurred during LRU simulation with {frameCount} frames.
          </p>

          <div className="flex flex-wrap gap-2">
            {heatmapData.map((step, idx) => (
              <div 
                key={idx} 
                className={`w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm ${
                  step.isHit 
                    ? 'bg-emerald-500/20 text-green border border-green' 
                    : 'bg-rose-500/20 text-red border border-rose-500/30'
                }`}
                title={`Request: ${step.page} | ${step.isHit ? 'HIT' : 'FAULT'}`}
              >
                {step.page}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-green" /> Page Hit
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" /> Page Fault
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
