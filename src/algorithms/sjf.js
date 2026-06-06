/**
 * @algorithm SJF (Shortest Job First) — Non-Preemptive
 * @type Non-Preemptive
 * @complexity O(n^2)
 * @dataStructures Linear scan for minimum burst time among arrived processes
 * @description At each scheduling point, the arrived process with the smallest
 *              burst time is selected. Once started, it runs to completion.
 *              May cause starvation for long processes.
 */

const ALGORITHM_NAME = 'SJF'

/**
 * Compare two process IDs numerically.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function comparePID(a, b) {
  const numA = parseInt(a.replace(/\D/g, ''), 10) || 0
  const numB = parseInt(b.replace(/\D/g, ''), 10) || 0
  return numA - numB
}

/**
 * Run SJF Non-Preemptive scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runSJF(processes) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const remaining = processes.map((p) => ({ ...p }))
  const completed = new Set()
  const ganttData = []
  const processResults = []
  let currentTime = 0

  while (completed.size < processes.length) {
    // Find all arrived, not-yet-completed processes
    const available = remaining.filter(
      (p) => p.arrivalTime <= currentTime && !completed.has(p.id)
    )

    if (available.length === 0) {
      // No process available — find next arrival time
      const nextArrival = Math.min(
        ...remaining
          .filter((p) => !completed.has(p.id))
          .map((p) => p.arrivalTime)
      )
      ganttData.push({ pid: 'IDLE', start: currentTime, end: nextArrival })
      currentTime = nextArrival
      continue
    }

    // Select process with shortest burst time; ties: arrival time, then PID
    const selected = available.reduce((best, curr) => {
      if (curr.burstTime < best.burstTime) return curr
      if (curr.burstTime === best.burstTime) {
        if (curr.arrivalTime < best.arrivalTime) return curr
        if (curr.arrivalTime === best.arrivalTime) {
          return comparePID(curr.id, best.id) < 0 ? curr : best
        }
      }
      return best
    })

    const startTime = currentTime
    const completionTime = startTime + selected.burstTime
    const turnaroundTime = completionTime - selected.arrivalTime
    const waitingTime = turnaroundTime - selected.burstTime
    const responseTime = startTime - selected.arrivalTime

    ganttData.push({ pid: selected.id, start: startTime, end: completionTime })
    processResults.push({
      pid: selected.id,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      algorithm: ALGORITHM_NAME,
    })

    completed.add(selected.id)
    currentTime = completionTime
  }

  return { ganttData, processResults }
}
