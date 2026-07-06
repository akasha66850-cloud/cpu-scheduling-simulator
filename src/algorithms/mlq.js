/**
 * @algorithm MLQ (Multilevel Queue)
 * @type Preemptive (between queues) / RR within Q0 and Q1
 * @complexity O(n^2) per time unit
 * @dataStructures 3 FIFO ready queues, tick-by-tick simulation
 * @description Processes are permanently assigned to one of 3 queues based on
 *              their priority number. Higher-priority queues always preempt lower
 *              ones. Within each queue, a different scheduling policy applies.
 *
 *  Queue assignments:
 *    Q0 (Highest) — priority 1–2  → Round Robin (q = mlqQ0Quantum, default 2)
 *    Q1 (Medium)  — priority 3–4  → Round Robin (q = mlqQ1Quantum, default 4)
 *    Q2 (Lowest)  — priority 5+   → FCFS (no preemption within queue)
 */

const ALGORITHM_NAME = 'MLQ'
const NUM_QUEUES = 3

/**
 * Map a process priority to its permanent queue index.
 * @param {number} priority
 * @returns {number} 0, 1, or 2
 */
function priorityToQueue(priority) {
  if (priority <= 2) return 0
  if (priority <= 4) return 1
  return 2
}

/**
 * Run MLQ scheduling algorithm.
 * @param {Array<{id:string, arrivalTime:number, burstTime:number, priority:number}>} processes
 * @param {{ mlqQ0Quantum?:number, mlqQ1Quantum?:number }} options
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runMLQ(processes, options = {}) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const Q0_QUANTUM = Math.max(1, options.mlqQ0Quantum || 2)
  const Q1_QUANTUM = Math.max(1, options.mlqQ1Quantum || 4)
  const QUANTUMS = [Q0_QUANTUM, Q1_QUANTUM, Infinity] // Q2 = FCFS

  const n = processes.length
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : (parseInt(a.id.replace(/\D/g, '')) || 0) - (parseInt(b.id.replace(/\D/g, '')) || 0)
  )

  // Per-process state
  const remaining   = new Map(sorted.map((p) => [p.id, p.burstTime]))
  const firstCPU    = new Map()
  const completions = new Map()
  const queueOf     = new Map(sorted.map((p) => [p.id, priorityToQueue(p.priority)]))

  // 3 FIFO ready queues
  const readyQueues  = [[], [], []]
  const enqueued     = new Set()  // process IDs already in a queue
  const quantumUsed  = new Map(sorted.map((p) => [p.id, 0]))

  const ganttRaw = []
  let currentTime = 0
  let completed = 0

  const maxTime =
    sorted.reduce((s, p) => s + p.burstTime, 0) +
    sorted.reduce((mx, p) => Math.max(mx, p.arrivalTime), 0) +
    10

  // Helper: enqueue newly arrived processes
  function enqueueArrivals(upToTime) {
    for (const p of sorted) {
      if (
        p.arrivalTime <= upToTime &&
        !enqueued.has(p.id) &&
        !completions.has(p.id)
      ) {
        const q = queueOf.get(p.id)
        readyQueues[q].push(p.id)
        enqueued.add(p.id)
      }
    }
  }

  while (completed < n && currentTime <= maxTime) {
    enqueueArrivals(currentTime)

    // Find highest-priority non-empty queue
    let selectedQ = -1
    for (let q = 0; q < NUM_QUEUES; q++) {
      if (readyQueues[q].length > 0) { selectedQ = q; break }
    }

    if (selectedQ === -1) {
      // CPU idle — jump to next arrival
      const pending = sorted.filter(
        (p) => !completions.has(p.id) && p.arrivalTime > currentTime
      )
      if (pending.length === 0) break
      const next = Math.min(...pending.map((p) => p.arrivalTime))
      ganttRaw.push({ pid: 'IDLE', start: currentTime, end: next, queue: -1 })
      currentTime = next
      continue
    }

    const pid     = readyQueues[selectedQ][0]
    const quantum = QUANTUMS[selectedQ]

    if (!firstCPU.has(pid)) firstCPU.set(pid, currentTime)

    // Run one tick — re-evaluate at each tick for preemption
    ganttRaw.push({ pid, start: currentTime, end: currentTime + 1, queue: selectedQ })
    currentTime++
    remaining.set(pid, remaining.get(pid) - 1)
    quantumUsed.set(pid, quantumUsed.get(pid) + 1)

    enqueueArrivals(currentTime)

    const rem  = remaining.get(pid)
    const used = quantumUsed.get(pid)

    if (rem === 0) {
      // Process finished
      completions.set(pid, currentTime)
      completed++
      readyQueues[selectedQ].shift()
      enqueued.delete(pid)
      quantumUsed.set(pid, 0)
    } else if (used >= quantum) {
      // Used full quantum — re-queue at back of SAME queue (MLQ: no demotion)
      readyQueues[selectedQ].shift()
      readyQueues[selectedQ].push(pid)
      quantumUsed.set(pid, 0)
    }
    // else: quantum not exhausted, not done, higher-priority preemption handled
    // next iteration picks highest-priority queue automatically
  }

  // Merge consecutive same-pid Gantt blocks
  const ganttData = []
  for (const blk of ganttRaw) {
    const last = ganttData[ganttData.length - 1]
    if (last && last.pid === blk.pid && last.queue === blk.queue) {
      last.end = blk.end
    } else {
      ganttData.push({ ...blk })
    }
  }

  // Build per-process results
  const avgBurst = sorted.reduce((s, p) => s + p.burstTime, 0) / n
  const starvThreshold = 3 * avgBurst

  const processResults = sorted.map((p) => {
    const ct  = completions.get(p.id) ?? 0
    const tat = ct - p.arrivalTime
    const wt  = tat - p.burstTime
    const rt  = (firstCPU.get(p.id) ?? p.arrivalTime) - p.arrivalTime
    return {
      pid: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: ct,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
      queue: queueOf.get(p.id),           // permanent queue (0/1/2)
      starved: wt > starvThreshold,
      algorithm: ALGORITHM_NAME,
    }
  })

  return { ganttData, processResults }
}
