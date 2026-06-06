/**
 * Compute aggregate metrics from simulation results.
 * @param {Array} processResults - Per-process results
 * @param {Array} ganttData - Gantt chart blocks
 * @returns {Object} Aggregate metrics
 */
export function computeAggregateMetrics(processResults, ganttData) {
  if (!processResults || processResults.length === 0) {
    return {
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      throughput: 0,
      cpuUtilization: 0,
      contextSwitches: 0,
      totalTime: 0,
      totalIdleTime: 0,
    }
  }

  const n = processResults.length

  // Per-process sums
  const totalWT = processResults.reduce((s, p) => s + (p.waitingTime ?? 0), 0)
  const totalTAT = processResults.reduce((s, p) => s + (p.turnaroundTime ?? 0), 0)
  const totalRT = processResults.reduce((s, p) => s + (p.responseTime ?? 0), 0)

  // Timeline metrics
  const totalTime = ganttData.length > 0
    ? ganttData[ganttData.length - 1].end - ganttData[0].start
    : 0

  const totalIdleTime = ganttData
    .filter((b) => b.pid === 'IDLE')
    .reduce((s, b) => s + (b.end - b.start), 0)

  const cpuBusyTime = totalTime - totalIdleTime
  const cpuUtilization = totalTime > 0
    ? (cpuBusyTime / totalTime) * 100
    : 0

  const throughput = totalTime > 0 ? n / totalTime : 0

  // Context switches = number of non-IDLE blocks - 1
  const nonIdleBlocks = ganttData.filter((b) => b.pid !== 'IDLE')
  const contextSwitches = Math.max(0, nonIdleBlocks.length - 1)

  return {
    averageWaitingTime: totalWT / n,
    averageTurnaroundTime: totalTAT / n,
    averageResponseTime: totalRT / n,
    throughput,
    cpuUtilization,
    contextSwitches,
    totalTime,
    totalIdleTime,
  }
}

/**
 * Check if any process is starved (WT > 3x avg burst time).
 * @param {Array} processResults
 * @param {Array} processes
 * @returns {Array} Starved process IDs
 */
export function detectStarvation(processResults, processes) {
  if (!processResults || !processes) return []
  const avgBurst = processes.reduce((s, p) => s + p.burstTime, 0) / processes.length
  const threshold = 3 * avgBurst
  return processResults
    .filter((r) => (r.waitingTime ?? 0) > threshold)
    .map((r) => ({ pid: r.pid, waitingTime: r.waitingTime, threshold }))
}

/**
 * Format a number to 2 decimal places.
 * @param {number} num
 * @returns {string}
 */
export function fmt2(num) {
  return (Math.round((num ?? 0) * 100) / 100).toFixed(2)
}
