import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { AlertTriangle, Activity } from 'lucide-react'
import { runPageAlgorithm } from '@/utils/pageAlgorithms'
import useSettingsStore from '@/store/useSettingsStore'

export default function BeladyAnomalyDetector({ referenceString }) {
  const [data, setData] = React.useState([])
  const [hasAnomaly, setHasAnomaly] = React.useState(false)

  React.useEffect(() => {
    const checkAnomaly = async () => {
      try {
        const payload = {
          algorithm: 'FIFO',
          referenceString,
          frameCount: 3 // frame count doesn't matter for the anomaly check since the C++ does 1 to 8 internally
        }
        const res = await runPageAlgorithm(payload)
        if (res.belady) {
          setData(res.belady.data)
          setHasAnomaly(res.belady.hasAnomaly)
        }
      } catch (err) {
        console.error("Failed to detect belady anomaly", err)
      }
    }
    checkAnomaly()
  }, [referenceString])

  return (
    <div className="card p-6 relative overflow-hidden">
      {useSettingsStore.getState().showBeladyAlerts && hasAnomaly && (
        <div className="absolute top-0 right-0 p-4">
          <div className="animate-pulse bg-rose-500/20 text-red border border-rose-500/50 px-4 py-2 rounded-[5px] flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold tracking-wide">Anomaly Detected!</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent rounded-[8px]">
          <Activity className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Belady's Anomaly Detector</h2>
          <p className="text-text-muted text-sm">
            FIFO algorithm faults as physical frames increase (1 to 8 frames)
          </p>
        </div>
      </div>

      {!hasAnomaly && (
        <p className="text-green text-sm mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          No anomaly detected for this reference string. More frames = fewer faults.
        </p>
      )}

      <div className="h-80 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="frames" 
              stroke="var(--border)" 
              label={{ value: 'Number of Frames', position: 'bottom', fill: '#94a3b8' }} 
            />
            <YAxis 
              stroke="var(--border)" 
              label={{ value: 'Page Faults', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(val) => [val, 'Faults']}
              labelFormatter={(val) => `${val} Frames`}
            />
            <Line 
              type="monotone" 
              dataKey="faults" 
              stroke="var(--border)" 
              strokeWidth={3}
              activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.isAnomaly) {
                  return (
                    <circle cx={cx} cy={cy} r={6} fill="var(--text-muted)" stroke="var(--border)" strokeWidth={2} key={`dot-${payload.frames}`} />
                  )
                }
                return <circle cx={cx} cy={cy} r={4} fill="var(--text-muted)" stroke="none" key={`dot-${payload.frames}`} />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {hasAnomaly && (
        <p className="text-xs text-text-muted text-center mt-2">
          * Red dots indicate points where increasing frames caused MORE page faults (Belady's Anomaly).
        </p>
      )}
    </div>
  )
}
