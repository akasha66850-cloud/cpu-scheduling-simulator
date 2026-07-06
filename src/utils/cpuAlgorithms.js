/**
 * cpuAlgorithms.js
 * Pure Javascript implementation of CPU Scheduling algorithms.
 * Translated exactly from the C++ Backend.
 */
import useSettingsStore from '../store/useSettingsStore'

// ─── Shared helpers ───────────────────────────────────────────

function pidNum(id) {
  const digits = id.replace(/\D/g, '')
  return digits === '' ? 0 : parseInt(digits, 10)
}

function sortByArrival(procs) {
  return [...procs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime
    return pidNum(a.id) - pidNum(b.id)
  })
}

function starvThreshold(procs) {
  if (procs.length === 0) return 0.0
  const s = procs.reduce((acc, p) => acc + p.burstTime, 0)
  const mult = useSettingsStore.getState().starvationThreshold || 3
  return mult * (s / procs.length)
}

function mergeGantt(raw) {
  const merged = []
  for (const b of raw) {
    if (merged.length > 0 && merged[merged.length - 1].pid === b.pid && merged[merged.length - 1].queue === b.queue) {
      merged[merged.length - 1].end = b.end
    } else {
      merged.push({ ...b })
    }
  }
  return merged
}

function makeResult(p, ct, tat, wt, rt, algoName, thresh, queue = -1, demotions = 0) {
  return {
    pid: p.id,
    algorithm: algoName,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    completionTime: ct,
    turnaroundTime: tat,
    waitingTime: wt,
    responseTime: rt,
    queue,
    demotions,
    starved: wt > thresh
  }
}

function computeAggregateMetrics(results, gantt) {
  if (!results.length || !gantt.length) return {}

  const n = results.length
  let totalWT = 0, totalTAT = 0, totalRT = 0
  for (const r of results) {
    totalWT += r.waitingTime
    totalTAT += r.turnaroundTime
    totalRT += r.responseTime
  }

  const totalTime = gantt[gantt.length - 1].end - gantt[0].start
  let totalIdleTime = 0
  let nonIdle = 0

  for (const b of gantt) {
    if (b.pid === 'IDLE') {
      totalIdleTime += (b.end - b.start)
    } else {
      nonIdle++
    }
  }

  const busyTime = totalTime - totalIdleTime
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100.0 : 0.0
  const throughput = totalTime > 0 ? n / totalTime : 0.0
  const contextSwitches = Math.max(0, nonIdle - 1)

  return {
    averageWaitingTime: totalWT / n,
    averageTurnaroundTime: totalTAT / n,
    averageResponseTime: totalRT / n,
    throughput,
    cpuUtilization,
    contextSwitches,
    totalTime,
    totalIdleTime
  }
}

// ─────────────────────────────────────────────────────────────
//  Algorithms
// ─────────────────────────────────────────────────────────────

function runFCFS(processes) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const sorted = sortByArrival(processes)
  const thresh = starvThreshold(sorted)
  const gantt = []
  const results = []
  let t = 0

  for (const p of sorted) {
    if (t < p.arrivalTime) {
      gantt.push({ pid: 'IDLE', start: t, end: p.arrivalTime, queue: -1 })
      t = p.arrivalTime
    }
    const ct = t + p.burstTime
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = t - p.arrivalTime
    gantt.push({ pid: p.id, start: t, end: ct, queue: -1 })
    results.push(makeResult(p, ct, tat, wt, rt, 'FCFS', thresh))
    t = ct
  }

  return { ganttData: gantt, processResults: results, metrics: computeAggregateMetrics(results, gantt) }
}

function runSJF(processes) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)
  const done = new Array(n).fill(false)
  const gantt = []
  const results = new Array(n)

  let t = 0, completed = 0

  while (completed < n) {
    let best = -1
    for (let i = 0; i < n; i++) {
      if (done[i] || procs[i].arrivalTime > t) continue
      if (best === -1 || procs[i].burstTime < procs[best].burstTime ||
         (procs[i].burstTime === procs[best].burstTime && pidNum(procs[i].id) < pidNum(procs[best].id))) {
        best = i
      }
    }

    if (best === -1) {
      let next = Infinity
      for (let i = 0; i < n; i++) {
        if (!done[i]) next = Math.min(next, procs[i].arrivalTime)
      }
      gantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const p = procs[best]
    const ct = t + p.burstTime
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = t - p.arrivalTime
    gantt.push({ pid: p.id, start: t, end: ct, queue: -1 })
    results[best] = makeResult(p, ct, tat, wt, rt, 'SJF', thresh)
    t = ct
    done[best] = true
    completed++
  }

  return { ganttData: gantt, processResults: results, metrics: computeAggregateMetrics(results, gantt) }
}

function runSRTF(processes) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)

  const remaining = {}, firstCPU = {}, completions = {}
  let maxTime = 1
  for (const p of procs) {
    remaining[p.id] = p.burstTime
    maxTime += p.burstTime
    if (p.arrivalTime > maxTime) maxTime = p.arrivalTime + p.burstTime
  }

  const rawGantt = []
  let t = 0, completed = 0

  while (completed < n && t <= maxTime + 10) {
    let bestIdx = -1
    for (let i = 0; i < n; i++) {
      if (procs[i].arrivalTime > t || completions[procs[i].id]) continue
      if (bestIdx === -1 ||
          remaining[procs[i].id] < remaining[procs[bestIdx].id] ||
          (remaining[procs[i].id] === remaining[procs[bestIdx].id] && pidNum(procs[i].id) < pidNum(procs[bestIdx].id))) {
        bestIdx = i
      }
    }

    if (bestIdx === -1) {
      let next = Infinity
      for (const p of procs) {
        if (!completions[p.id]) next = Math.min(next, p.arrivalTime)
      }
      rawGantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const pid = procs[bestIdx].id
    if (firstCPU[pid] === undefined) firstCPU[pid] = t

    rawGantt.push({ pid, start: t, end: t + 1, queue: -1 })
    remaining[pid]--
    t++

    if (remaining[pid] === 0) {
      completions[pid] = t
      completed++
    }
  }

  const results = procs.map(p => {
    const ct = completions[p.id] || 0
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = (firstCPU[p.id] !== undefined ? firstCPU[p.id] : 0) - p.arrivalTime
    return makeResult(p, ct, tat, wt, rt, 'SRTF', thresh)
  })

  const mergedGantt = mergeGantt(rawGantt)
  return { ganttData: mergedGantt, processResults: results, metrics: computeAggregateMetrics(results, mergedGantt) }
}

function runPriority(processes, opts) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)
  const done = new Array(n).fill(false)
  const effPri = procs.map(p => p.priority)

  const gantt = []
  const results = new Array(n)

  let t = 0, completed = 0, lastBoost = -1

  while (completed < n) {
    if (opts.agingEnabled) {
      const boostCycle = Math.floor(t / 5)
      if (boostCycle > lastBoost) {
        lastBoost = boostCycle
        for (let i = 0; i < n; i++) {
          if (!done[i] && procs[i].arrivalTime <= t) {
            effPri[i] = Math.max(1, effPri[i] - 1)
          }
        }
      }
    }

    let best = -1
    for (let i = 0; i < n; i++) {
      if (done[i] || procs[i].arrivalTime > t) continue
      if (best === -1 ||
          effPri[i] < effPri[best] ||
          (effPri[i] === effPri[best] && pidNum(procs[i].id) < pidNum(procs[best].id))) {
        best = i
      }
    }

    if (best === -1) {
      let next = Infinity
      for (let i = 0; i < n; i++) {
        if (!done[i]) next = Math.min(next, procs[i].arrivalTime)
      }
      gantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const p = procs[best]
    const ct = t + p.burstTime
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = t - p.arrivalTime
    gantt.push({ pid: p.id, start: t, end: ct, queue: -1 })
    results[best] = makeResult(p, ct, tat, wt, rt, 'Priority', thresh)
    t = ct
    done[best] = true
    completed++
  }

  return { ganttData: gantt, processResults: results, metrics: computeAggregateMetrics(results, gantt) }
}

function runPriorityPreemptive(processes, opts) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)

  const remaining = {}, firstCPU = {}, completions = {}, effPri = {}
  let maxTime = 1
  for (const p of procs) {
    remaining[p.id] = p.burstTime
    effPri[p.id] = p.priority
    maxTime += p.burstTime
    if (p.arrivalTime > maxTime) maxTime = p.arrivalTime + p.burstTime
  }

  const rawGantt = []
  let t = 0, completed = 0, lastBoost = -1

  while (completed < n && t <= maxTime + 10) {
    if (opts.agingEnabled) {
      const bc = Math.floor(t / 5)
      if (bc > lastBoost) {
        lastBoost = bc
        for (const p of procs) {
          if (!completions[p.id] && p.arrivalTime <= t) {
            effPri[p.id] = Math.max(1, effPri[p.id] - 1)
          }
        }
      }
    }

    let bestIdx = -1
    for (let i = 0; i < n; i++) {
      if (procs[i].arrivalTime > t || completions[procs[i].id]) continue
      if (bestIdx === -1 ||
          effPri[procs[i].id] < effPri[procs[bestIdx].id] ||
          (effPri[procs[i].id] === effPri[procs[bestIdx].id] && pidNum(procs[i].id) < pidNum(procs[bestIdx].id))) {
        bestIdx = i
      }
    }

    if (bestIdx === -1) {
      let next = Infinity
      for (const p of procs) {
        if (!completions[p.id]) next = Math.min(next, p.arrivalTime)
      }
      rawGantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const pid = procs[bestIdx].id
    if (firstCPU[pid] === undefined) firstCPU[pid] = t

    rawGantt.push({ pid, start: t, end: t + 1, queue: -1 })
    remaining[pid]--
    t++

    if (remaining[pid] === 0) {
      completions[pid] = t
      completed++
    }
  }

  const results = procs.map(p => {
    const ct = completions[p.id] || 0
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = (firstCPU[p.id] !== undefined ? firstCPU[p.id] : 0) - p.arrivalTime
    return makeResult(p, ct, tat, wt, rt, 'PriorityPreemptive', thresh)
  })

  const mergedGantt = mergeGantt(rawGantt)
  return { ganttData: mergedGantt, processResults: results, metrics: computeAggregateMetrics(results, mergedGantt) }
}

function runRoundRobin(processes, opts) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const quantum = Math.max(1, opts.quantum)
  const thresh = starvThreshold(procs)

  const remaining = {}, firstCPU = {}, completions = {}
  let maxTime = 1
  for (const p of procs) {
    remaining[p.id] = p.burstTime
    maxTime += p.burstTime
    if (p.arrivalTime > maxTime) maxTime = p.arrivalTime + p.burstTime
  }

  const readyQueue = []
  const inQueue = new Set()
  const rawGantt = []
  let t = 0, completed = 0

  const enqueue = (upTo) => {
    for (const p of procs) {
      if (p.arrivalTime <= upTo && !inQueue.has(p.id) && !completions[p.id]) {
        readyQueue.push(p.id)
        inQueue.add(p.id)
      }
    }
  }

  enqueue(t)

  while (completed < n && t <= maxTime + 10) {
    if (readyQueue.length === 0) {
      let next = Infinity
      for (const p of procs) {
        if (!completions[p.id]) next = Math.min(next, p.arrivalTime)
      }
      rawGantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      enqueue(t)
      continue
    }

    const pid = readyQueue.shift()
    inQueue.delete(pid)

    if (firstCPU[pid] === undefined) firstCPU[pid] = t

    const run = Math.min(quantum, remaining[pid])
    rawGantt.push({ pid, start: t, end: t + run, queue: -1 })
    t += run
    remaining[pid] -= run

    enqueue(t)

    if (remaining[pid] === 0) {
      completions[pid] = t
      completed++
    } else {
      readyQueue.push(pid)
      inQueue.add(pid)
    }
  }

  const results = procs.map(p => {
    const ct = completions[p.id] || 0
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = (firstCPU[p.id] !== undefined ? firstCPU[p.id] : 0) - p.arrivalTime
    return makeResult(p, ct, tat, wt, rt, 'RoundRobin', thresh)
  })

  const mergedGantt = mergeGantt(rawGantt)
  return { ganttData: mergedGantt, processResults: results, metrics: computeAggregateMetrics(results, mergedGantt) }
}

function mlqQueueOf(priority) {
  if (priority <= 2) return 0
  if (priority <= 4) return 1
  return 2
}

function runMLQ(processes, opts) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)

  const quantums = [Math.max(1, opts.mlqQ0Quantum), Math.max(1, opts.mlqQ1Quantum), Infinity]
  const remaining = {}, firstCPU = {}, completions = {}, queueOf = {}, quantumUsed = {}

  let maxTime = 1
  for (const p of procs) {
    remaining[p.id] = p.burstTime
    queueOf[p.id] = mlqQueueOf(p.priority)
    quantumUsed[p.id] = 0
    maxTime += p.burstTime
    if (p.arrivalTime > maxTime) maxTime = p.arrivalTime + p.burstTime
  }

  const readyQueues = [[], [], []]
  const enqueued = new Set()

  const enqueueArrivals = (upTo) => {
    for (const p of procs) {
      if (p.arrivalTime <= upTo && !enqueued.has(p.id) && !completions[p.id]) {
        readyQueues[queueOf[p.id]].push(p.id)
        enqueued.add(p.id)
      }
    }
  }

  const rawGantt = []
  let t = 0, completed = 0

  while (completed < n && t <= maxTime + 10) {
    enqueueArrivals(t)

    let selQ = -1
    for (let q = 0; q < 3; q++) {
      if (readyQueues[q].length > 0) { selQ = q; break }
    }

    if (selQ === -1) {
      let next = Infinity
      for (const p of procs) {
        if (!completions[p.id]) next = Math.min(next, p.arrivalTime)
      }
      rawGantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const pid = readyQueues[selQ][0]
    if (firstCPU[pid] === undefined) firstCPU[pid] = t

    rawGantt.push({ pid, start: t, end: t + 1, queue: selQ })
    t++
    remaining[pid]--
    quantumUsed[pid]++
    enqueueArrivals(t)

    if (remaining[pid] === 0) {
      completions[pid] = t
      completed++
      readyQueues[selQ].shift()
      enqueued.delete(pid)
      quantumUsed[pid] = 0
    } else if (quantumUsed[pid] >= quantums[selQ]) {
      readyQueues[selQ].shift()
      readyQueues[selQ].push(pid)
      quantumUsed[pid] = 0
    }
  }

  const results = procs.map(p => {
    const ct = completions[p.id] || 0
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = (firstCPU[p.id] !== undefined ? firstCPU[p.id] : 0) - p.arrivalTime
    return makeResult(p, ct, tat, wt, rt, 'MLQ', thresh, queueOf[p.id])
  })

  const mergedGantt = mergeGantt(rawGantt)
  return { ganttData: mergedGantt, processResults: results, metrics: computeAggregateMetrics(results, mergedGantt) }
}

function runMLFQ(processes, opts) {
  if (processes.length === 0) return { ganttData: [], processResults: [], metrics: {} }

  const procs = sortByArrival(processes)
  const n = procs.length
  const thresh = starvThreshold(procs)

  const Q0_Q = Math.max(1, opts.mlfqQ0)
  const Q1_Q = Math.max(1, opts.mlfqQ1)
  const BOOST = Math.max(5, opts.mlfqBoost)
  const quantums = [Q0_Q, Q1_Q, Infinity]

  const remaining = {}, firstCPU = {}, completions = {}, curQueue = {}, quantumUsed = {}, demotions = {}
  let maxTime = 1
  for (const p of procs) {
    remaining[p.id] = p.burstTime
    curQueue[p.id] = -1
    quantumUsed[p.id] = 0
    demotions[p.id] = 0
    maxTime += p.burstTime
    if (p.arrivalTime > maxTime) maxTime = p.arrivalTime + p.burstTime
  }

  const readyQueues = [[], [], []]
  const enqueued = new Set()

  const enqueueArrivals = (upTo) => {
    for (const p of procs) {
      if (p.arrivalTime <= upTo && !enqueued.has(p.id) && !completions[p.id]) {
        readyQueues[0].push(p.id)
        enqueued.add(p.id)
        curQueue[p.id] = 0
      }
    }
  }

  const priorityBoost = (runningPid) => {
    for (let q = 1; q < 3; q++) {
      const kept = [], moved = []
      for (const pid of readyQueues[q]) {
        if (pid === runningPid) kept.push(pid)
        else moved.push(pid)
      }
      readyQueues[q] = kept
      for (const pid of moved) {
        readyQueues[0].push(pid)
        curQueue[pid] = 0
        quantumUsed[pid] = 0
      }
    }
  }

  const rawGantt = []
  let t = 0, completed = 0, lastBoostTime = 0

  while (completed < n && t <= maxTime + BOOST + 10) {
    enqueueArrivals(t)

    if (t > 0 && (t - lastBoostTime) >= BOOST) {
      let running = ''
      for (let q = 0; q < 3; q++) {
        if (readyQueues[q].length > 0) { running = readyQueues[q][0]; break }
      }
      priorityBoost(running)
      lastBoostTime = t
    }

    let selQ = -1
    for (let q = 0; q < 3; q++) {
      if (readyQueues[q].length > 0) { selQ = q; break }
    }

    if (selQ === -1) {
      let next = Infinity
      for (const p of procs) {
        if (!completions[p.id]) next = Math.min(next, p.arrivalTime)
      }
      rawGantt.push({ pid: 'IDLE', start: t, end: next, queue: -1 })
      t = next
      continue
    }

    const pid = readyQueues[selQ][0]
    if (firstCPU[pid] === undefined) firstCPU[pid] = t

    rawGantt.push({ pid, start: t, end: t + 1, queue: selQ })
    t++
    remaining[pid]--
    quantumUsed[pid]++
    enqueueArrivals(t)

    if (remaining[pid] === 0) {
      completions[pid] = t
      completed++
      readyQueues[selQ].shift()
      enqueued.delete(pid)
      quantumUsed[pid] = 0
    } else if (quantumUsed[pid] >= quantums[selQ]) {
      readyQueues[selQ].shift()
      const nextQ = Math.min(selQ + 1, 2)
      readyQueues[nextQ].push(pid)
      curQueue[pid] = nextQ
      quantumUsed[pid] = 0
      if (nextQ !== selQ) demotions[pid]++
    }
  }

  const results = procs.map(p => {
    const ct = completions[p.id] || 0
    const tat = ct - p.arrivalTime
    const wt = tat - p.burstTime
    const rt = (firstCPU[p.id] !== undefined ? firstCPU[p.id] : 0) - p.arrivalTime
    return makeResult(p, ct, tat, wt, rt, 'MLFQ', thresh, curQueue[p.id], demotions[p.id])
  })

  const mergedGantt = mergeGantt(rawGantt)
  return { ganttData: mergedGantt, processResults: results, metrics: computeAggregateMetrics(results, mergedGantt) }
}

export function runCPUScheduling(algorithm, processes, options) {
  switch (algorithm) {
    case 'FCFS': return runFCFS(processes)
    case 'SJF': return runSJF(processes)
    case 'SRTF': return runSRTF(processes)
    case 'Priority': return runPriority(processes, options)
    case 'PriorityPreemptive': return runPriorityPreemptive(processes, options)
    case 'RoundRobin': return runRoundRobin(processes, options)
    case 'MLQ': return runMLQ(processes, options)
    case 'MLFQ': return runMLFQ(processes, options)
    default: return { ganttData: [], processResults: [], metrics: {} }
  }
}
