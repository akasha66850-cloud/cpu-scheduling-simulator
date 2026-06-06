import Papa from 'papaparse'
import { fmt2 } from './metrics'

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
 */
export async function exportToPDF(results, ganttData, algorithm, processes, quantum) {
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

  autoTable(doc, {
    startY: yPos + 4,
    head: [['PID', 'CT', 'TAT', 'WT', 'RT']],
    body: results.processResults.map((r) => [
      r.pid,
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
  link.href = url
  link.setAttribute('download', `cpu-sim-results-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
