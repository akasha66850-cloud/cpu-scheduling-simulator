/**
 * @algorithm Priority Scheduling — Preemptive
 * @type Preemptive
 * @complexity O(n^2) per time unit
 * @dataStructures Remaining burst time tracking, tick-by-tick priority scan
 * @description At every time unit, the arrived process with the lowest priority
 *              number (highest priority) gets the CPU. New arrivals can preempt
 *              the running process. Consecutive same-PID Gantt blocks are merged.
 */

const ALGORITHM_NAME = 'PriorityPreemptive'
const STARVATION_MULTIPLIER = 3

/**
 * Run Priority Preemptive scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @param {{ agingEnabled?: boolean }} options
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runPriorityPreemptive(processes, options = {}) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const { agingEnabled = false } = options
  const avgBurst = processes.reduce((s, p) => s + p.burstTime, 0) / processes.length
  const starvationThreshold = STARVATION_MULTIPLIER * avgBurst

  const n = processes.length
  const remaining = processes.map((p) => ({
    ...p,
    remainingBurst: p.burstTime,
    effectivePriority: p.priority,
    ageCount: 0,
  }))
  const firstResponse = new Map()
  const completionTimes = new Map()
  const ganttRaw = []

  let currentTime = 0
  let completed = 0
  const totalBurst = processes.reduce((s, p) => s + p.burstTime, 0)
  const maxTime = totalBurst + processes.reduce((max, p) => Math.max(max, p.arrivalTime), 0) + 10

  while (completed < n && currentTime <= maxTime) {
    // Aging: every 5 ticks, boost effective priority of waiting processes
    if (agingEnabled && currentTime > 0 && currentTime % 5 === 0) {
      remaining.forEach((p) => {
        if (p.arrivalTime <= currentTime && p.remainingBurst > 0) {
          p.effectivePriority = Math.max(1, p.effectivePriority - 1)
          p.ageCount++
        }
      })
    }

    const available = remaining.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingBurst > 0
    )

    if (available.length === 0) {
      const notDone = remaining.filter((p) => p.remainingBurst > 0)
      if (notDone.length === 0) break
      const nextArrival = Math.min(...notDone.map((p) => p.arrivalTime))
      ganttRaw.push({ pid: 'IDLE', start: currentTime, end: nextArrival })
      currentTime = nextArrival
      continue
    }

    // Select lowest priority number; ties: arrival time, then PID
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
  const ageMap = new Map(remaining.map((p) => [p.id, p.ageCount]))
  const processResults = processes.map((p) => {
    const completionTime = completionTimes.get(p.id) ?? 0
    const turnaroundTime = completionTime - p.arrivalTime
    const waitingTime = turnaroundTime - p.burstTime
    const responseTime = (firstResponse.get(p.id) ?? p.arrivalTime) - p.arrivalTime
    const isStarved = waitingTime > starvationThreshold

    return {
      pid: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      starved: isStarved,
      aged: (ageMap.get(p.id) || 0) > 0,
      algorithm: ALGORITHM_NAME,
    }
  })

  return { ganttData, processResults }
}
