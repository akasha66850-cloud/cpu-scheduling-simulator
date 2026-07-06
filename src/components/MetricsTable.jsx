import React, { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { fmt2 } from '@/utils/metrics'
import useSettingsStore from '@/store/useSettingsStore'

function bestClass(val, isMin) {
  return isMin ? 'text-green font-semibold' : 'text-text-secondary'
}

const MetricsTable = memo(function MetricsTable({ processResults }) {
  if (!processResults || processResults.length === 0) return null

  // Find best (min) values for highlighting
  const minWT = Math.min(...processResults.map((r) => r.waitingTime))
  const minTAT = Math.min(...processResults.map((r) => r.turnaroundTime))
  const minRT = Math.min(...processResults.map((r) => r.responseTime))

  const anyStarved = processResults.some((r) => r.starved)
  const showStarvationWarnings = useSettingsStore(s => s.showStarvationWarnings)

  return (
    <div className="space-y-3">
      {showStarvationWarnings && anyStarved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-orange rounded-[5px] text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Starvation detected:</strong>{' '}
            {processResults
              .filter((r) => r.starved)
              .map((r) => r.pid)
              .join(', ')}{' '}
            waited excessively long.
          </span>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>AT</th>
              <th>BT</th>
              <th>CT</th>
              <th>TAT</th>
              <th>WT</th>
              <th>RT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {processResults.map((r) => (
              <tr key={r.pid} className={r.starved ? 'bg-amber-500/5' : ''}>
                <td className="font-mono text-indigo-300 font-semibold">{r.pid}</td>
                <td className="font-mono">{r.arrivalTime}</td>
                <td className="font-mono">{r.burstTime}</td>
                <td className="font-mono">{r.completionTime}</td>
                <td className={`font-mono ${bestClass(r.turnaroundTime, r.turnaroundTime === minTAT)}`}>
                  {r.turnaroundTime}
                </td>
                <td className={`font-mono ${bestClass(r.waitingTime, r.waitingTime === minWT)}`}>
                  {r.waitingTime}
                </td>
                <td className={`font-mono ${bestClass(r.responseTime, r.responseTime === minRT)}`}>
                  {r.responseTime}
                </td>
                <td className="px-2">
                  <div className="flex gap-1">
                    {r.starved && (
                      <span className="badge badge-yellow text-xs" title="Potential starvation">
                        ⚠ Starved
                      </span>
                    )}
                    {r.aged && (
                      <span className="badge badge-green text-xs" title="Priority was boosted by aging">
                        Aged
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default MetricsTable
