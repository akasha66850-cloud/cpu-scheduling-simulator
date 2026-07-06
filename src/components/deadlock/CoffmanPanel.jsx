import React, { useMemo } from 'react'
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react'
import useDeadlockStore from '@/store/useDeadlockStore'
import { runDeadlockAlgorithm } from '@/utils/deadlockAlgorithms'

export default function CoffmanPanel() {
  const { allocation, request, available } = useDeadlockStore()

  const [circularWait, setCircularWait] = React.useState(false)

  React.useEffect(() => {
    const checkCycle = async () => {
      try {
        const payload = { action: 'runDetection', allocation, request, available }
        const res = await runDeadlockAlgorithm(payload)
        setCircularWait(res.isDeadlocked)
      } catch (err) {
        console.error("Failed to detect circular wait", err)
      }
    }
    checkCycle()
  }, [allocation, request, available])

  const conditions = useMemo(() => {
    // 1. Mutual Exclusion (always true in this simulator context)
    const mutex = true

    // 2. Hold and Wait
    // Are there any processes that currently hold at least one resource AND are requesting at least one resource?
    let holdAndWait = false
    for (let i = 0; i < allocation.length; i++) {
      const holding = allocation[i].some(v => v > 0)
      const requesting = request[i].some(v => v > 0)
      if (holding && requesting) {
        holdAndWait = true
        break
      }
    }

    // 3. No Preemption (always true in standard state, resources can't be forcibly taken unless recovery runs)
    const noPreemption = true

    // 4. Circular Wait
    // Detected via WASM graph reduction (async state)

    return [
      {
        id: 'mutex',
        name: 'Mutual Exclusion',
        desc: 'Resources cannot be shared. Only one process can use a resource at a time.',
        satisfied: mutex,
        violated: !mutex
      },
      {
        id: 'holdwait',
        name: 'Hold and Wait',
        desc: 'A process is holding at least one resource while requesting additional resources.',
        satisfied: holdAndWait, // "satisfied" here means the condition for deadlock is met
        violated: !holdAndWait
      },
      {
        id: 'nopreempt',
        name: 'No Preemption',
        desc: 'Resources cannot be forcibly removed from a process; they must be released voluntarily.',
        satisfied: noPreemption,
        violated: !noPreemption
      },
      {
        id: 'circular',
        name: 'Circular Wait',
        desc: 'A closed chain of processes exists, where each holds at least one resource requested by the next.',
        satisfied: circularWait,
        violated: !circularWait
      }
    ]
  }, [allocation, request, available])

  const deadlockPossible = conditions.every(c => c.satisfied)

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert className="w-5 h-5 text-accent" />
        <h2 className="section-title !mb-0">Coffman Conditions</h2>
      </div>

      <p className="text-sm text-text-muted mb-6">
        A deadlock can only arise if <strong>all four</strong> of these conditions hold simultaneously in the system.
      </p>

      <div className="space-y-3">
        {conditions.map(c => (
          <div key={c.id} className="p-4 bg-surface border border-border rounded-[5px] flex items-start gap-4">
            <div className="mt-0.5">
              {c.satisfied ? (
                <XCircle className="w-5 h-5 text-red" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-text-primary">{c.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.satisfied ? 'bg-rose-500/20 text-red' : 'bg-emerald-500/20 text-green'
                }`}>
                  {c.satisfied ? 'Present' : 'Absent'}
                </span>
              </div>
              <p className="text-xs text-text-muted">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-6 p-4 rounded-[5px] border flex flex-col items-center justify-center text-center ${
        deadlockPossible ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-green'
      }`}>
        <span className="text-sm font-semibold uppercase tracking-wider mb-1 text-text-muted">System State</span>
        {deadlockPossible ? (
          <span className="text-red font-bold">Deadlock is Present</span>
        ) : (
          <span className="text-green font-bold">Deadlock Impossible (Condition Broken)</span>
        )}
      </div>
    </div>
  )
}
