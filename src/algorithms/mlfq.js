/**
 * @algorithm MLFQ (Multilevel Feedback Queue)
 * @type Preemptive
 * @complexity O(n * totalBurst)
 * @dataStructures 3 feedback queues with demotion on quantum expiry
 * @description The most flexible and realistic scheduling algorithm.
 *              All new processes enter Q0. Using the full quantum demotes
 *              a process to the next lower-priority queue. A periodic
 *              priority boost moves all non-running processes back to Q0
 *              to prevent starvation (approximates aging).
 *
 *  Queue structure:
 *    Q0 (Highest) — Round Robin, quantum = mlfqQ0 (default 2)
 *    Q1 (Medium)  — Round Robin, quantum = mlfqQ1 (default 4)
 *    Q2 (Lowest)  — FCFS (unlimited quantum)
 *
 *  Demotion rule:  process uses full quantum in Qi → moves to Q(i+1)
 *  Boost rule:     every boostInterval ticks, all active processes → Q0
 */

const ALGORITHM_NAME = 'MLFQ'
const NUM_QUEUES = 3

/**
 * Run MLFQ scheduling algorithm.
 * @param {Array<{id:string, arrivalTime:number, burstTime:number, priority:number}>} processes
 * @param {{ mlfqQ0?:number, mlfqQ1?:number, mlfqBoost?:number }} options
 * @returns {{ ganttData: Array, processResults: Array }}
 */
export default function runMLFQ(processes, options = {}) {
  if (!processes || processes.length === 0) return { ganttData: [], processResults: [] }

  const Q0_QUANTUM    = Math.max(1, options.mlfqQ0    || 2)
  const Q1_QUANTUM    = Math.max(1, options.mlfqQ1    || 4)
  const BOOST_EVERY   = Math.max(5, options.mlfqBoost || 20)
  const QUANTUMS      = [Q0_QUANTUM, Q1_QUANTUM, Infinity]

  const n = processes.length
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : (parseInt(a.id.replace(/\D/g, '')) || 0) - (parseInt(b.id.replace(/\D/g, '')) || 0)
  )

  // Per-process state
  const remaining    = new Map(sorted.map((p) => [p.id, p.burstTime]))
  const firstCPU     = new Map()
  const completions  = new Map()
  const currentQueue = new Map(sorted.map((p) => [p.id, -1]))  // -1 = not arrived
  const quantumUsed  = new Map(sorted.map((p) => [p.id, 0]))
  const demotions    = new Map(sorted.map((p) => [p.id, 0]))   // demotion count for display

  // 3 FIFO ready queues
  const readyQueues  = [[], [], []]
  const enqueued     = new Set()

  const ganttRaw = []
  let currentTime = 0
  let completed = 0

  const maxTime =
    sorted.reduce((s, p) => s + p.burstTime, 0) +
    sorted.reduce((mx, p) => Math.max(mx, p.arrivalTime), 0) +
    BOOST_EVERY + 10

  // Helper: add newly arrived processes to Q0
  function enqueueArrivals(upToTime) {
    for (const p of sorted) {
      if (
        p.arrivalTime <= upToTime &&
        !enqueued.has(p.id) &&
        !completions.has(p.id)
      ) {
        readyQueues[0].push(p.id)
        enqueued.add(p.id)
        currentQueue.set(p.id, 0)
      }
    }
  }

  // Helper: priority boost — move all non-running active processes to Q0
  function priorityBoost(runningPid) {
    for (let q = 1; q < NUM_QUEUES; q++) {
      const newQueue = []
      for (const pid of readyQueues[q]) {
        if (pid !== runningPid) {
          readyQueues[0].push(pid)
          currentQueue.set(pid, 0)
          quantumUsed.set(pid, 0)
        } else {
          newQueue.push(pid) // keep running process in place
        }
      }
      readyQueues[q] = newQueue
    }
  }

  let lastBoostTime = 0

  while (completed < n && currentTime <= maxTime) {
    enqueueArrivals(currentTime)

    // Priority boost check
    if (currentTime > 0 && currentTime - lastBoostTime >= BOOST_EVERY && currentTime > lastBoostTime) {
      // Find running pid (first in highest-priority queue)
      let runningPid = null
      for (let q = 0; q < NUM_QUEUES; q++) {
        if (readyQueues[q].length > 0) { runningPid = readyQueues[q][0]; break }
      }
      priorityBoost(runningPid)
      lastBoostTime = currentTime
    }

    // Find highest-priority non-empty queue
    let selectedQ = -1
    for (let q = 0; q < NUM_QUEUES; q++) {
      if (readyQueues[q].length > 0) { selectedQ = q; break }
    }

    if (selectedQ === -1) {
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

    // Run one tick
    ganttRaw.push({ pid, start: currentTime, end: currentTime + 1, queue: selectedQ })
    currentTime++
    remaining.set(pid, remaining.get(pid) - 1)
    quantumUsed.set(pid, quantumUsed.get(pid) + 1)

    enqueueArrivals(currentTime)

    const rem  = remaining.get(pid)
    const used = quantumUsed.get(pid)

    if (rem === 0) {
      // Finished
      completions.set(pid, currentTime)
      completed++
      readyQueues[selectedQ].shift()
      enqueued.delete(pid)
      quantumUsed.set(pid, 0)
    } else if (used >= quantum) {
      // Used full quantum → demote (or stay in Q2)
      readyQueues[selectedQ].shift()
      const nextQ = Math.min(selectedQ + 1, NUM_QUEUES - 1)
      readyQueues[nextQ].push(pid)
      currentQueue.set(pid, nextQ)
      quantumUsed.set(pid, 0)
      if (nextQ !== selectedQ) {
        demotions.set(pid, demotions.get(pid) + 1)
      }
    }
    // else: quantum not exhausted, not done → stay at front of queue (handled next iter)
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
      queue: currentQueue.get(p.id),        // final queue at completion
      demotions: demotions.get(p.id) || 0,  // how many times it was demoted
      starved: wt > starvThreshold,
      algorithm: ALGORITHM_NAME,
    }
  })

  return { ganttData, processResults }
}
