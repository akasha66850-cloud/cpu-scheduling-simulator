import Papa from 'papaparse'
import { fmt2 } from './metrics'
import { getStateAt } from '../components/ProcessStatePanel'

// ─── Color palette (matches GanttChart) ──────────────────────
const PROCESS_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4',
]

function getColor(pid) {
  const num = parseInt(pid.replace(/\D/g, ''), 10) || 0
  return PROCESS_COLORS[num % PROCESS_COLORS.length]
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [100, 100, 100]
}

// ─── PDF Export ───────────────────────────────────────────────
/**
 * Export simulation results to a PDF report.
 * @param {Object} results - { processResults, metrics }
 * @param {Array} ganttData
 * @param {string} algorithm
 * @param {Array} processes
 * @param {number} quantum
 * @param {number} stepIndex
 */
export async function exportToPDF(results, ganttData, algorithm, processes, quantum, stepIndex) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  // ── Page 1: Report ──────────────────────────────────────────

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CPU Scheduling Simulation Report', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  // Meta info
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Simulation Configuration', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Algorithm: ${algorithm}`, 14, 46)
  if (algorithm === 'RoundRobin') {
    doc.text(`Time Quantum: ${quantum}`, 14, 52)
  }
  doc.text(`Process Count: ${processes.length}`, 14, algorithm === 'RoundRobin' ? 58 : 52)

  // Input processes table
  let yPos = 68
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Input Processes', 14, yPos)

  autoTable(doc, {
    startY: yPos + 4,
    head: [['PID', 'Arrival Time', 'Burst Time', 'Priority']],
    body: processes.map((p) => [p.id, p.arrivalTime, p.burstTime, p.priority]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 9, halign: 'center' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // Results table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Scheduling Results', 14, yPos)

  // Calculate time for state
  const time = stepIndex !== undefined && stepIndex > 0
    ? ganttData[stepIndex - 1]?.end
    : ganttData[ganttData.length - 1]?.end || 0;

  autoTable(doc, {
    startY: yPos + 4,
    head: [['PID', 'State', 'CT', 'TAT', 'WT', 'RT']],
    body: results.processResults.map((r) => [
      r.pid,
      getStateAt(r.pid, time, ganttData, results.processResults, processes),
      r.completionTime,
      r.turnaroundTime,
      r.waitingTime,
      r.responseTime,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 9, halign: 'center' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // Summary metrics
  const m = results.metrics
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Metrics', 14, yPos)

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Metric', 'Value']],
    body: [
      ['Average Waiting Time', `${fmt2(m.averageWaitingTime)} units`],
      ['Average Turnaround Time', `${fmt2(m.averageTurnaroundTime)} units`],
      ['Average Response Time', `${fmt2(m.averageResponseTime)} units`],
      ['CPU Utilization', `${fmt2(m.cpuUtilization)}%`],
      ['Throughput', `${fmt2(m.throughput)} proc/unit`],
      ['Context Switches', m.contextSwitches],
      ['Total Execution Time', `${m.totalTime} units`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right', font: 'courier' } },
  })

  // Formulas
  let formulaY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, formulaY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  const cpuFormulas = [
    'Avg Waiting Time    = Sum(WT) / Total Processes',
    'Avg Turnaround Time = Sum(TAT) / Total Processes',
    'CPU Utilization     = ((Total Time - Idle Time) / Total Time) * 100',
    'Throughput          = Total Processes / Total Time',
    'Context Switches    = Total Preemptions & Completions'
  ]
  cpuFormulas.forEach((f, i) => {
    doc.text(f, 14, formulaY + 6 + (i * 5))
  })

  // ── Page 2: Gantt Chart ─────────────────────────────────────
  doc.addPage()

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Gantt Chart', pageW / 2, 13, { align: 'center' })

  const chartLeft = 14
  const chartRight = pageW - 14
  const chartWidth = chartRight - chartLeft
  const blockHeight = 20
  const chartTop = 35
  const totalTime = ganttData.length > 0 ? ganttData[ganttData.length - 1].end : 1

  // Draw blocks
  for (const block of ganttData) {
    const x = chartLeft + (block.start / totalTime) * chartWidth
    const w = ((block.end - block.start) / totalTime) * chartWidth
    const color = block.pid === 'IDLE' ? [100, 116, 139] : hexToRgb(getColor(block.pid))

    doc.setFillColor(...color)
    doc.roundedRect(x, chartTop, w, blockHeight, 1, 1, 'F')

    // Label
    if (w > 6) {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('courier', 'bold')
      doc.text(block.pid, x + w / 2, chartTop + blockHeight / 2 + 2, { align: 'center' })
    }
  }

  // Time axis
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(7)
  doc.setFont('courier', 'normal')
  const tickStep = totalTime > 30 ? 5 : 1
  for (let t = 0; t <= totalTime; t += tickStep) {
    const x = chartLeft + (t / totalTime) * chartWidth
    doc.setDrawColor(150, 150, 150)
    doc.line(x, chartTop + blockHeight, x, chartTop + blockHeight + 3)
    doc.text(String(t), x, chartTop + blockHeight + 8, { align: 'center' })
  }

  // Legend
  let legendX = chartLeft
  const legendY = chartTop + blockHeight + 18
  doc.setFontSize(8)
  const uniquePids = [...new Set(ganttData.filter((b) => b.pid !== 'IDLE').map((b) => b.pid))]
  for (const pid of uniquePids) {
    const color = hexToRgb(getColor(pid))
    doc.setFillColor(...color)
    doc.rect(legendX, legendY, 5, 4, 'F')
    doc.setTextColor(30, 30, 30)
    doc.text(pid, legendX + 7, legendY + 3.5)
    legendX += 20
    if (legendX > pageW - 20) {
      legendX = chartLeft
    }
  }

  // Save
  const filename = `cpu-sim-${algorithm}-${now.getTime()}.pdf`
  doc.save(filename)
}

// ─── CSV Export ───────────────────────────────────────────────
/**
 * Export simulation results to a CSV file.
 * @param {Array} processResults
 * @param {Object} metrics
 */
export function exportToCSV(processResults, metrics) {
  const rows = processResults.map((r) => ({
    PID: r.pid,
    ArrivalTime: r.arrivalTime,
    BurstTime: r.burstTime,
    Priority: r.priority,
    CompletionTime: r.completionTime,
    TurnaroundTime: r.turnaroundTime,
    WaitingTime: r.waitingTime,
    ResponseTime: r.responseTime,
  }))

  // Add averages summary row
  rows.push({
    PID: 'AVERAGE',
    ArrivalTime: '',
    BurstTime: '',
    Priority: '',
    CompletionTime: '',
    TurnaroundTime: fmt2(metrics.averageTurnaroundTime),
    WaitingTime: fmt2(metrics.averageWaitingTime),
    ResponseTime: fmt2(metrics.averageResponseTime),
  })

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `cpu-sim-results-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Memory PDF Export ───────────────────────────────────────────────
export async function exportMemoryToPDF(results, algorithm, blocks, processes) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Memory Simulation Report', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  // Meta
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Configuration', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Algorithm: ${algorithm}`, 14, 46)
  doc.text(`Memory Blocks: ${blocks.length}`, 14, 52)
  doc.text(`Processes: ${processes.length}`, 14, 58)

  let yPos = 68
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Allocation Results', 14, yPos)

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Process', 'Size', 'Status', 'Block', 'Internal Frag']],
    body: results.processResults.map((pr) => [
      pr.id,
      `${pr.size}u`,
      pr.isAllocated ? 'Allocated' : 'Failed',
      pr.isAllocated ? pr.blockId : '-',
      pr.isAllocated ? pr.internalFrag : '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 9, halign: 'center' },
  })

  // Formulas Legend
  let finalY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, finalY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  const formulas = [
    'Success Rate  = (Allocated / Total) * 100',
    'Utilization   = (Used Memory / Total Memory) * 100',
    'External Frag = Total Free Memory - Largest Free Block',
    'Internal Frag = Sum of (Block Size - Process Size)',
    'Search Steps  = Total Checks / Total Processes'
  ]
  formulas.forEach((f, i) => {
    doc.text(f, 14, finalY + 6 + (i * 5))
  })
  
  doc.save(`memory-report-${algorithm}-${Date.now()}.pdf`)
}

// ─── Memory CSV Export ───────────────────────────────────────────────
export function exportMemoryToCSV(results, algorithm) {
  const processData = results.processResults.map((pr) => ({
    Algorithm: algorithm,
    Process: pr.id,
    Size: pr.size,
    Status: pr.isAllocated ? 'Allocated' : 'Failed',
    Block: pr.isAllocated ? pr.blockId : 'None',
    InternalFragmentation: pr.isAllocated ? pr.internalFrag : 0,
  }))

  const csv = Papa.unparse(processData)

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `memory-report-${algorithm}-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Memory Comparison PDF Export ─────────────────────────────────────
export async function exportMemoryComparisonToPDF(results, blocks, processes) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Memory Algorithms Comparison Report', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  // Meta
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Configuration', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Memory Blocks: ${blocks.length}`, 14, 46)
  doc.text(`Processes: ${processes.length}`, 14, 52)

  let yPos = 60
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Comparison Metrics', 14, yPos)

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Algorithm', 'Success Rate', 'Utilization', 'Internal Frag', 'Ext. Frag', 'Avg Search Steps']],
    body: results.map((r) => [
      r.name,
      `${r.successRate.toFixed(1)}%`,
      `${r.memoryUtilization.toFixed(1)}%`,
      r.internalFragmentation,
      r.externalFragmentation,
      r.avgSearchSteps.toFixed(2),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 10, halign: 'center' },
  })
  
  let finalY = doc.lastAutoTable.finalY + 15

  // Formulas Legend
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, finalY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  const formulas = [
    'Success Rate  = (Allocated / Total) * 100',
    'Utilization   = (Used Memory / Total Memory) * 100',
    'External Frag = Total Free Memory - Largest Free Block',
    'Internal Frag = Sum of (Block Size - Process Size)',
    'Search Steps  = Total Checks / Total Processes'
  ]
  formulas.forEach((f, i) => {
    doc.text(f, 14, finalY + 6 + (i * 5))
  })

  finalY += 35 // offset for the charts

  const chartsEl = document.getElementById('memory-comparison-charts')
  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#0f172a', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    
    const imgProps = doc.getImageProperties(imgData)
    const pdfWidth = pageW - 28
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    if (finalY + pdfHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      finalY = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Charts', 14, finalY)
    doc.addImage(imgData, 'PNG', 14, finalY + 4, pdfWidth, pdfHeight)
  }

  doc.save(`memory-comparison-${Date.now()}.pdf`)
}

// ─── CPU Comparison PDF Export ────────────────────────────────────────
export async function exportCPUComparisonToPDF(results, processes, quantum) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CPU Algorithms Comparison Report', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  // Meta
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Configuration', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Processes: ${processes.length}`, 14, 46)
  doc.text(`Round Robin Quantum: ${quantum}`, 14, 52)

  let yPos = 60
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Comparison Metrics', 14, yPos)

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Algorithm', 'Avg WT', 'Avg TAT', 'Avg RT', 'Throughput', 'CPU Util%']],
    body: results.map((r) => [
      r.label,
      r.metrics.averageWaitingTime.toFixed(2),
      r.metrics.averageTurnaroundTime.toFixed(2),
      r.metrics.averageResponseTime.toFixed(2),
      r.metrics.throughput.toFixed(2),
      `${r.metrics.cpuUtilization.toFixed(2)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 10, halign: 'center' },
  })
  
  let finalY = doc.lastAutoTable.finalY + 15

  // Formulas Legend
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, finalY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  const cpuFormulas = [
    'Avg Waiting Time    = Sum(WT) / Total Processes',
    'Avg Turnaround Time = Sum(TAT) / Total Processes',
    'CPU Utilization     = ((Total Time - Idle Time) / Total Time) * 100',
    'Throughput          = Total Processes / Total Time',
    'Context Switches    = Total Preemptions & Completions'
  ]
  cpuFormulas.forEach((f, i) => {
    doc.text(f, 14, finalY + 6 + (i * 5))
  })

  finalY += 35 // offset for charts

  const chartsEl = document.getElementById('cpu-comparison-charts')
  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#0f172a', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    
    const imgProps = doc.getImageProperties(imgData)
    const pdfWidth = pageW - 28
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    if (finalY + pdfHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      finalY = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Charts', 14, finalY)
    doc.addImage(imgData, 'PNG', 14, finalY + 4, pdfWidth, pdfHeight)
  }

  doc.save(`cpu-comparison-${Date.now()}.pdf`)
}

// ─── Page Replacement Export ─────────────────────────────────────────
export async function exportPageReplacementToPDF(results, algorithm, referenceString, frameCount) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Page Replacement Report', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  // Meta info
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Configuration', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Algorithm: ${algorithm}`, 14, 46)
  doc.text(`Frames: ${frameCount}`, 14, 52)
  doc.text(`Reference String: ${referenceString}`, 14, 58)

  let yPos = 68

  // Trace table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Page Access Trace', 14, yPos)
  
  autoTable(doc, {
    startY: yPos + 4,
    head: [['Step', 'Request', 'Status', 'Frames', 'Evicted']],
    body: results.steps.map((s, idx) => [
      idx + 1,
      s.page,
      s.isHit ? 'Hit' : 'Fault',
      s.frames.join(' | '),
      s.evicted !== null ? s.evicted : '-'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 9, halign: 'center' },
  })

  let finalY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Overview', 14, finalY)
  doc.setFontSize(10)
  doc.setFont('courier', 'normal')
  const m = results.metrics
  doc.text(`Page Faults: ${m.pageFaults}`, 14, finalY + 6)
  doc.text(`Page Hits:   ${m.pageHits}`, 14, finalY + 12)
  doc.text(`Fault Rate:  ${m.faultRate.toFixed(1)}%`, 14, finalY + 18)
  doc.text(`Hit Rate:    ${m.hitRate.toFixed(1)}%`, 14, finalY + 24)

  // Formulas
  finalY += 35
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, finalY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.text('Fault Rate = (Page Faults / Total References) * 100', 14, finalY + 6)
  doc.text('Hit Rate   = (Page Hits / Total References) * 100', 14, finalY + 11)

  doc.save(`page-replacement-${algorithm}-${Date.now()}.pdf`)
}

export async function exportPageReplacementComparisonToPDF(results, referenceString, frameCount) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Page Replacement Comparison', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.text(`Reference String: ${referenceString}`, 14, 38)
  doc.text(`Frames: ${frameCount}`, 14, 44)

  let yPos = 52
  autoTable(doc, {
    startY: yPos,
    head: [['Algorithm', 'Page Faults', 'Page Hits', 'Fault Rate', 'Hit Rate']],
    body: results.map((r) => [
      r.name,
      r.pageFaults,
      r.pageHits,
      `${r.faultRate.toFixed(1)}%`,
      `${r.hitRate.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 10, halign: 'center' },
  })
  
  let finalY = doc.lastAutoTable.finalY + 15

  // Formulas Legend
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference', 14, finalY)
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.text('Fault Rate = (Page Faults / Total References) * 100', 14, finalY + 6)
  doc.text('Hit Rate   = (Page Hits / Total References) * 100', 14, finalY + 11)

  finalY += 20 // offset for charts

  const chartsEl = document.getElementById('pr-comparison-charts')
  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#0f172a', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const imgProps = doc.getImageProperties(imgData)
    const pdfWidth = pageW - 28
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    if (finalY + pdfHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      finalY = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Charts', 14, finalY)
    doc.addImage(imgData, 'PNG', 14, finalY + 4, pdfWidth, pdfHeight)
  }

  doc.save(`pr-comparison-${Date.now()}.pdf`)
}

export function exportPageReplacementToCSV(results, algorithm, referenceString, frameCount) {
  const data = results.steps.map((s, idx) => ({
    Step: idx + 1,
    Request: s.page,
    Status: s.isHit ? 'Hit' : 'Fault',
    Frames: s.frames.join(' | '),
    Evicted: s.evicted !== null ? s.evicted : 'None'
  }))
  
  data.push({})
  data.push({
    Step: 'SUMMARY',
    Request: `Faults: ${results.metrics.pageFaults}`,
    Status: `Hits: ${results.metrics.pageHits}`,
    Frames: `Fault Rate: ${results.metrics.faultRate.toFixed(1)}%`,
    Evicted: `Hit Rate: ${results.metrics.hitRate.toFixed(1)}%`
  })

  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `page-replacement-${algorithm}-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ─── Deadlock Handling Export ─────────────────────────────────────────
export async function exportDeadlockComparisonToPDF(results) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Deadlock Strategies Comparison', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  let yPos = 38
  autoTable(doc, {
    startY: yPos,
    head: [['Strategy', 'Overhead Cost', 'Safety Guarantee', 'Starvation Risk']],
    body: results.map((r) => [
      r.name,
      r.overhead,
      `${r.safety}%`,
      `${r.starvation}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 10, halign: 'center' },
  })
  
  let finalY = doc.lastAutoTable.finalY + 15

  // ADD FORMULAS LEGEND
  if (finalY + 30 > doc.internal.pageSize.getHeight()) {
    doc.addPage()
    finalY = 20
  }
  doc.setFillColor(240, 240, 240)
  doc.rect(14, finalY, pageW - 28, 30, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Formulas Reference:', 16, finalY + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('- Overhead Cost: Context-dependent. For termination = Term Cost * Count. Preemption = Preempt Cost * Count.', 16, finalY + 12)
  doc.text('- Safety Guarantee: Probability the strategy prevents/resolves deadlock (0% or 100%).', 16, finalY + 18)
  doc.text('- Starvation Risk: Risk of a process waiting indefinitely (0% - 100%).', 16, finalY + 24)
  
  finalY += 45

  const chartsEl = document.getElementById('deadlock-comparison-charts')
  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#0f172a', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const imgProps = doc.getImageProperties(imgData)
    const pdfWidth = pageW - 28
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    if (finalY + pdfHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      finalY = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Charts', 14, finalY)
    doc.addImage(imgData, 'PNG', 14, finalY + 4, pdfWidth, pdfHeight)
  }

  doc.save(`deadlock-comparison-${Date.now()}.pdf`)
}

// ─── Disk Scheduling Export ─────────────────────────────────────────
export async function exportDiskComparisonToPDF(results, params) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Disk Scheduling Comparison', pageW / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now.toLocaleString()}`, pageW / 2, 22, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  doc.text(`Initial Head: ${params.initialHead} | Disk Size: ${params.diskSize} | Queue: [${params.requestQueueInput}]`, 14, 34)

  let yPos = 40
  autoTable(doc, {
    startY: yPos,
    head: [['Algorithm', 'Total Seek Dist', 'Avg Response (ms)', 'Variance']],
    body: results.map((r) => [
      r.name,
      r.distance,
      r.avgResponse,
      r.variance,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'courier', fontSize: 10, halign: 'center' },
  })
  
  let finalY = doc.lastAutoTable.finalY + 15

  // ADD FORMULAS LEGEND
  if (finalY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage()
    finalY = 20
  }
  doc.setFillColor(240, 240, 240)
  doc.rect(14, finalY, pageW - 28, 45, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Metrics Formulas Reference:', 16, finalY + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('- Total Seek Distance: Sum(|Current Cylinder - Next Cylinder|)', 16, finalY + 12)
  doc.text('- Average Seek Time: Total Distance * 1 ms/cylinder (assuming 1ms per track)', 16, finalY + 18)
  doc.text('- Throughput: Total Requests / Total Seek Time', 16, finalY + 24)
  doc.text('- Avg Response Time: Average wait distance before a request is served', 16, finalY + 30)
  doc.text('- Variance: Statistical variance of individual seek distances', 16, finalY + 36)
  doc.text('- Reversals: Count of direction changes (SCAN/LOOK variants only)', 16, finalY + 42)
  
  finalY += 55

  const chartsEl = document.getElementById('disk-comparison-chart')
  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#0f172a', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const imgProps = doc.getImageProperties(imgData)
    const pdfWidth = pageW - 28
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    if (finalY + pdfHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      finalY = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Charts', 14, finalY)
    doc.addImage(imgData, 'PNG', 14, finalY + 4, pdfWidth, pdfHeight)
  }

  doc.save(`disk-comparison-${Date.now()}.pdf`)
}

// -------------------------------------------------------------
// PROCESS SYNCHRONIZATION
// -------------------------------------------------------------

export const exportSyncToCSV = (results, params, problemName) => {
  if (!results) return;

  // We only require Papa for CSV formatting, we can use an inline array formatting if Papa is not available, but since we're in exportHelpers, Papa is imported.
  // Actually, wait, PapaParse might be imported at the top, if not we'll handle it. It is already imported for Disk/CPU.
  const summary = [
    {
      "Problem": problemName,
      "Throughput (Ops/s)": results.throughput.toFixed(1),
      "Avg Wait (ms)": results.avg_wait.toFixed(1),
      "Max Wait (ms)": results.max_wait,
      "Starvation Index": results.starvation_index.toFixed(2),
      "CPU Util (%)": results.cpu_util.toFixed(1),
      "Context Switches": results.context_switches
    }
  ];

  let rawWaitSamples = [];
  results.threads.forEach(t => {
    t.wait_samples.forEach(w => {
       rawWaitSamples.push({ "Thread ID": t.thread_id, "Wait Duration (ms)": w });
    });
  });

  const summaryCsv = window.Papa ? window.Papa.unparse(summary) : JSON.stringify(summary);
  const dataCsv = window.Papa ? window.Papa.unparse(rawWaitSamples) : JSON.stringify(rawWaitSamples);
  const combined = `SYNCHRONIZATION SUMMARY\n${summaryCsv}\n\nRAW WAIT SAMPLES\n${dataCsv}`;

  const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `sync_results_${problemName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportSyncComparisonToPDF = async (results, params) => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  if (!results || results.length === 0) return;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  doc.setFontSize(20);
  doc.setTextColor(63, 81, 181); // Indigo
  doc.text("Process Synchronization Comparison", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 28);

  const tableData = results.map(r => [
    r.name,
    r.throughput.toFixed(1),
    r.avgWait.toFixed(1),
    r.starvationIndex.toFixed(2),
    r.contextSwitches,
    r.cpuUtil.toFixed(1) + "%"
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Algorithm', 'Throughput', 'Avg Wait', 'Starv. Idx', 'Switches', 'CPU %']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 10 }
  });

  let finalY = doc.lastAutoTable.finalY + 15;
  const pageW = doc.internal.pageSize.getWidth();

  if (finalY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    finalY = 20;
  }
  doc.setFillColor(240, 240, 240);
  doc.rect(14, finalY, pageW - 28, 45, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Metrics Formulas Reference:', 16, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('- Throughput (Ops/s): Total Ops / Elapsed Time (s)', 16, finalY + 12);
  doc.text('- Avg Wait (ms): Total Wait Time / Total Wait Events', 16, finalY + 18);
  doc.text('- Starvation Index: Max Wait / Avg Wait', 16, finalY + 24);
  doc.text('- Ctx Switches: Total Context Switches (active thread changed)', 16, finalY + 30);
  doc.text('- CPU Util %: Total Busy Time / (Elapsed Time * N Threads) * 100', 16, finalY + 36);

  finalY += 55;

  try {
    const chartEl = document.getElementById('comparison-content');
    if (chartEl) {
      const canvas = await html2canvas(chartEl, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      doc.addPage();
      doc.text("Performance Charts", 15, 20);
      doc.addImage(imgData, 'PNG', 15, 30, 180, 120);
    }
  } catch (err) {
    console.warn("Could not capture comparison chart", err);
  }

  doc.save("sync_comparison_report.pdf");
}

export const exportSyncToPDF = async (results, params, problemName) => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  if (!results) return;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  doc.setFontSize(20);
  doc.setTextColor(63, 81, 181);
  doc.text(`Synchronization: ${problemName}`, 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 28);

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Value']],
    body: [
      ['Throughput (Ops/s)', results.throughput.toFixed(1)],
      ['Avg Wait (ms)', results.avg_wait.toFixed(1)],
      ['Max Wait (ms)', results.max_wait],
      ['Starvation Index', results.starvation_index.toFixed(2)],
      ['CPU Util (%)', results.cpu_util.toFixed(1)],
      ['Context Switches', results.context_switches]
    ],
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
  });

  let finalY = doc.lastAutoTable.finalY + 15;
  const pageW = doc.internal.pageSize.getWidth();

  if (finalY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    finalY = 20;
  }
  doc.setFillColor(240, 240, 240);
  doc.rect(14, finalY, pageW - 28, 45, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Metrics Formulas Reference:', 16, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('- Throughput (Ops/s): Total Ops / Elapsed Time (s)', 16, finalY + 12);
  doc.text('- Avg Wait (ms): Total Wait Time / Total Wait Events', 16, finalY + 18);
  doc.text('- Starvation Index: Max Wait / Avg Wait', 16, finalY + 24);
  doc.text('- Ctx Switches: Total Context Switches (active thread changed)', 16, finalY + 30);
  doc.text('- CPU Util %: Total Busy Time / (Elapsed Time * N Threads) * 100', 16, finalY + 36);

  doc.save(`sync_report_${problemName}.pdf`);
}

// -------------------------------------------------------------
// FILE ALLOCATION
// -------------------------------------------------------------

export const exportFileCSV = (files, metrics) => {
  if (!files || Object.keys(files).length === 0) return;

  const fileData = Object.values(files).map(f => ({
    "File Name": f.name,
    "Size (Blocks)": f.size,
    "Index Block": f.indexBlock !== -1 ? f.indexBlock : 'N/A',
    "Data Blocks": f.blocks.join('-')
  }));

  const metricsData = [{
    "Used Blocks": metrics.usedBlocks,
    "Free Blocks": metrics.freeBlocks,
    "Max Contiguous": metrics.maxContiguous,
    "External Frag %": metrics.externalFrag.toFixed(1)
  }];

  const fileCsv = window.Papa ? window.Papa.unparse(fileData) : JSON.stringify(fileData);
  const metricsCsv = window.Papa ? window.Papa.unparse(metricsData) : JSON.stringify(metricsData);
  const combined = `FILE METRICS\n${metricsCsv}\n\nFILE ALLOCATIONS\n${fileCsv}`;

  const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `file_allocation_results.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportFileComparisonToPDF = async (results, params) => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const { default: html2canvas } = await import('html2canvas')

  if (!results || results.length === 0) return;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  doc.setFontSize(20);
  doc.setTextColor(63, 81, 181);
  doc.text("File Allocation Comparison", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()} | Disk: ${params.diskSize} Blks | Files: ${params.numFiles}`, 15, 28);

  const tableData = results.map(r => [
    r.name,
    r.successRate.toFixed(1) + "%",
    r.usedBlocks,
    r.fragmentation.toFixed(1) + "%",
    r.avgSeek.toFixed(1)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Algorithm', 'Success %', 'Used Blks', 'Ext Frag %', 'Avg Spread']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 10 }
  });

  let finalY = doc.lastAutoTable.finalY + 15;
  const pageW = doc.internal.pageSize.getWidth();

  if (finalY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    finalY = 20;
  }
  doc.setFillColor(240, 240, 240);
  doc.rect(14, finalY, pageW - 28, 45, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Metrics Formulas Reference:', 16, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('- Success %: (Successful Allocations / Total File Requests) * 100', 16, finalY + 12);
  doc.text('- Used Blks: Count of disk blocks currently allocated', 16, finalY + 18);
  doc.text('- Ext Frag %: (1 - Largest Contiguous Free Run / Total Free Blocks) * 100', 16, finalY + 24);
  doc.text('- Avg Spread: Average distance between consecutive blocks of a file', 16, finalY + 30);

  finalY += 55;

  try {
    const chartEl = document.getElementById('comparison-content');
    if (chartEl) {
      const canvas = await html2canvas(chartEl, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      doc.addPage();
      doc.text("Performance Charts", 15, 20);
      doc.addImage(imgData, 'PNG', 15, 30, 180, 120);
    }
  } catch (err) {
    console.warn("Could not capture comparison chart", err);
  }

  doc.save("file_comparison_report.pdf");
}

