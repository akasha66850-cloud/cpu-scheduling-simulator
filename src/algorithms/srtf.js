/**
 * @algorithm SRTF (Shortest Remaining Time First) — SJF Preemptive
 * @type Preemptive
 * @complexity O(n^2) per time unit
 * @dataStructures Remaining burst time tracking, linear scan per tick
 * @description At every time unit, the arrived process with the minimum
 *              remaining burst time gets the CPU. Preempts current process
 *              on new arrivals with shorter remaining time.
 *              Consecutive same-process Gantt blocks are merged.
 */

const ALGORITHM_NAME = 'SRTF'

/**
 * Run SRTF (Preemptive SJF) scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runSRTF(processes) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const n = processes.length
  const remaining = processes.map((p) => ({ ...p, remainingBurst: p.burstTime }))
  const firstResponse = new Map() // pid -> first CPU time
  const completionTimes = new Map()
  const ganttRaw = []

  let currentTime = 0
  let completed = 0
  const totalTime = processes.reduce((s, p) => s + p.burstTime, 0) +
                    (processes[0]?.arrivalTime || 0)
  const maxTime = totalTime + processes.length + 10 // safety upper bound

  while (completed < n && currentTime <= maxTime) {
    // Find available process with minimum remaining burst
    const available = remaining.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingBurst > 0
    )

    if (available.length === 0) {
      // IDLE tick
      const nextArrival = Math.min(
        ...remaining
          .filter((p) => p.remainingBurst > 0)
          .map((p) => p.arrivalTime)
      )
      ganttRaw.push({ pid: 'IDLE', start: currentTime, end: nextArrival })
      currentTime = nextArrival
      continue
    }

    // Select minimum remaining burst; ties: arrival time, then PID number
    const selected = available.reduce((best, curr) => {
      if (curr.remainingBurst < best.remainingBurst) return curr
      if (curr.remainingBurst === best.remainingBurst) {
        if (curr.arrivalTime < best.arrivalTime) return curr
        if (curr.arrivalTime === best.arrivalTime) {
          const na = parseInt(curr.id.replace(/\D/g, ''), 10) || 0
          const nb = parseInt(best.id.replace(/\D/g, ''), 10) || 0
          return na < nb ? curr : best
        }
      }
      return best
    })

    // Record first response time
    if (!firstResponse.has(selected.id)) {
      firstResponse.set(selected.id, currentTime)
    }

    ganttRaw.push({ pid: selected.id, start: currentTime, end: currentTime + 1 })
    selected.remainingBurst -= 1
    currentTime += 1

    if (selected.remainingBurst === 0) {
      completionTimes.set(selected.id, currentTime)
      completed++
    }
  }

  // Merge consecutive same-PID blocks
  const ganttData = []
  for (const block of ganttRaw) {
    if (
      ganttData.length > 0 &&
      ganttData[ganttData.length - 1].pid === block.pid
    ) {
      ganttData[ganttData.length - 1].end = block.end
    } else {
      ganttData.push({ ...block })
    }
  }

  // Build process results
  const processResults = processes.map((p) => {
    const completionTime = completionTimes.get(p.id) ?? 0
    const turnaroundTime = completionTime - p.arrivalTime
    const waitingTime = turnaroundTime - p.burstTime
    const responseTime = (firstResponse.get(p.id) ?? p.arrivalTime) - p.arrivalTime

    return {
      pid: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      algorithm: ALGORITHM_NAME,
    }
  })

  return { ganttData, processResults }
}
