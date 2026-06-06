/**
 * @algorithm FCFS (First Come First Served)
 * @type Non-Preemptive
 * @complexity O(n log n)
 * @dataStructures Sorted array by arrival time
 * @description Processes are scheduled in the order they arrive.
 *              Simplest scheduling algorithm — no starvation.
 */

// ─── Constants ───────────────────────────────────────────────
const ALGORITHM_NAME = 'FCFS'

/**
 * Compare two process IDs numerically (P1 < P2 < P10).
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
 * Run FCFS scheduling algorithm.
 * @param {Array<{id: string, arrivalTime: number, burstTime: number, priority: number}>} processes
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runFCFS(processes) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  // Sort by arrival time, ties broken by PID
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : comparePID(a.id, b.id)
  )

  const ganttData = []
  const processResults = []
  let currentTime = 0

  for (const proc of sorted) {
    // Insert IDLE block if CPU is free before this process arrives
    if (currentTime < proc.arrivalTime) {
      ganttData.push({ pid: 'IDLE', start: currentTime, end: proc.arrivalTime })
      currentTime = proc.arrivalTime
    }

    const startTime = currentTime
    const completionTime = startTime + proc.burstTime
    const turnaroundTime = completionTime - proc.arrivalTime
    const waitingTime = turnaroundTime - proc.burstTime
    const responseTime = startTime - proc.arrivalTime

    ganttData.push({ pid: proc.id, start: startTime, end: completionTime })

    processResults.push({
      pid: proc.id,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      algorithm: ALGORITHM_NAME,
    })

    currentTime = completionTime
  }

  return { ganttData, processResults }
}
