/**
 * @algorithm Priority Scheduling — Non-Preemptive
 * @type Non-Preemptive
 * @complexity O(n^2)
 * @dataStructures Linear scan for minimum priority among arrived processes
 * @description At each scheduling point, the arrived process with the lowest
 *              priority number (highest priority) is selected and runs to
 *              completion. May cause starvation for high-priority-number processes.
 *              Starvation detection: flags processes waiting > 3x avg burst time.
 */

const ALGORITHM_NAME = 'Priority'
const STARVATION_MULTIPLIER = 3

/**
 * Run Priority Non-Preemptive scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @param {{ agingEnabled?: boolean }} options
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runPriority(processes, options = {}) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const { agingEnabled = false } = options
  const avgBurst = processes.reduce((s, p) => s + p.burstTime, 0) / processes.length
  const starvationThreshold = STARVATION_MULTIPLIER * avgBurst

  const remaining = processes.map((p) => ({
    ...p,
    effectivePriority: p.priority,
    ageCount: 0,
  }))
  const completed = new Set()
  const ganttData = []
  const processResults = []
  let currentTime = 0

  while (completed.size < processes.length) {
    // Apply aging: every 5 time units, boost priority for waiting processes
    if (agingEnabled) {
      remaining.forEach((p) => {
        if (!completed.has(p.id) && p.arrivalTime <= currentTime) {
          if (currentTime > 0 && currentTime % 5 === 0) {
            p.effectivePriority = Math.max(1, p.effectivePriority - 1)
            p.ageCount++
          }
        }
      })
    }

    const available = remaining.filter(
      (p) => p.arrivalTime <= currentTime && !completed.has(p.id)
    )

    if (available.length === 0) {
      const nextArrival = Math.min(
        ...remaining
          .filter((p) => !completed.has(p.id))
          .map((p) => p.arrivalTime)
      )
      ganttData.push({ pid: 'IDLE', start: currentTime, end: nextArrival })
      currentTime = nextArrival
      continue
    }

    // Select lowest priority number (highest priority); ties by arrival time then PID
    const selected = available.reduce((best, curr) => {
      const bp = agingEnabled ? best.effectivePriority : best.priority
      const cp = agingEnabled ? curr.effectivePriority : curr.priority
      if (cp < bp) return curr
      if (cp === bp) {
        if (curr.arrivalTime < best.arrivalTime) return curr
        if (curr.arrivalTime === best.arrivalTime) {
          const na = parseInt(curr.id.replace(/\D/g, ''), 10) || 0
          const nb = parseInt(best.id.replace(/\D/g, ''), 10) || 0
          return na < nb ? curr : best
        }
      }
      return best
    })

    const startTime = currentTime
    const completionTime = startTime + selected.burstTime
    const turnaroundTime = completionTime - selected.arrivalTime
    const waitingTime = turnaroundTime - selected.burstTime
    const responseTime = startTime - selected.arrivalTime

    const isStarved = waitingTime > starvationThreshold

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
      starved: isStarved,
      aged: selected.ageCount > 0,
      algorithm: ALGORITHM_NAME,
    })

    completed.add(selected.id)
    currentTime = completionTime
  }

  return { ganttData, processResults }
}
