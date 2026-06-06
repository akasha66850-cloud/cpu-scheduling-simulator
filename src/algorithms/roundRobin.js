/**
 * @algorithm Round Robin
 * @type Preemptive
 * @complexity O(n * totalBurstTime / quantum)
 * @dataStructures FIFO ready queue, remaining burst time tracking
 * @description Each process gets a time slice (quantum). After each quantum,
 *              new arrivals are added to the ready queue before the current
 *              process is re-queued. Guarantees fairness; prevents starvation.
 */

const ALGORITHM_NAME = 'RoundRobin'

/**
 * Run Round Robin scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @param {{ quantum?: number }} options
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runRoundRobin(processes, options = {}) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const quantum = Math.max(1, options.quantum || 2)

  // Sort by arrival time, then PID for determinism
  const sorted = [...processes].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
    const na = parseInt(a.id.replace(/\D/g, ''), 10) || 0
    const nb = parseInt(b.id.replace(/\D/g, ''), 10) || 0
    return na - nb
  })

  const remaining = new Map(sorted.map((p) => [p.id, p.burstTime]))
  const firstResponse = new Map()
  const completionTimes = new Map()
  const ganttData = []
  const inQueue = new Set()

  let currentTime = 0
  const readyQueue = []

  // Enqueue processes that arrive at time 0
  for (const p of sorted) {
    if (p.arrivalTime <= currentTime) {
      readyQueue.push(p.id)
      inQueue.add(p.id)
    }
  }

  const totalProcesses = sorted.length
  let completedCount = 0

  while (completedCount < totalProcesses) {
    if (readyQueue.length === 0) {
      // Jump to next arrival
      const nextArrival = Math.min(
        ...sorted
          .filter((p) => !completionTimes.has(p.id) && p.arrivalTime > currentTime)
          .map((p) => p.arrivalTime)
      )
      ganttData.push({ pid: 'IDLE', start: currentTime, end: nextArrival })
      currentTime = nextArrival

      // Enqueue all processes that have arrived by now
      for (const p of sorted) {
        if (p.arrivalTime <= currentTime && !inQueue.has(p.id) && !completionTimes.has(p.id)) {
          readyQueue.push(p.id)
          inQueue.add(p.id)
        }
      }
      continue
    }

    const pid = readyQueue.shift()
    const proc = sorted.find((p) => p.id === pid)
    const rem = remaining.get(pid)

    if (!firstResponse.has(pid)) {
      firstResponse.set(pid, currentTime)
    }

    const execTime = Math.min(rem, quantum)
    const startTime = currentTime
    const endTime = currentTime + execTime

    ganttData.push({ pid, start: startTime, end: endTime })

    currentTime = endTime
    const newRem = rem - execTime
    remaining.set(pid, newRem)

    // Add newly arrived processes BEFORE re-queuing current (if not finished)
    for (const p of sorted) {
      if (
        p.arrivalTime > startTime &&
        p.arrivalTime <= currentTime &&
        !inQueue.has(p.id) &&
        !completionTimes.has(p.id)
      ) {
        readyQueue.push(p.id)
        inQueue.add(p.id)
      }
    }

    if (newRem <= 0) {
      completionTimes.set(pid, currentTime)
      completedCount++
    } else {
      // Re-queue at the back
      readyQueue.push(pid)
    }
  }

  // Build process results
  const processResults = sorted.map((p) => {
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
