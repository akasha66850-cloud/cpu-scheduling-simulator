const OLLAMA_BASE = 'http://localhost:11434'
import useSchedulerStore from '../store/useSchedulerStore'
import useMemoryStore from '../store/useMemoryStore'
import useDiskStore from '../store/useDiskStore'

export async function checkOllamaRunning() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

export async function getAvailableModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`)
    const data = await res.json()
    return data.models?.map(m => m.name) || []
  } catch {
    return []
  }
}

function getSimulationContext() {
  let ctx = "\n\n--- CURRENT SIMULATION CONTEXT (Read-Only) ---\n"
  let hasContext = false

  try {
    const cpu = useSchedulerStore.getState()
    if (cpu && cpu.processes?.length > 0) {
      ctx += `[CPU Scheduling]\nAlgorithm: ${cpu.algorithm}\nTime: ${cpu.currentTime}\nProcesses: ${JSON.stringify(cpu.processes.map(p => ({id:p.id, burst:p.burstTime, arrival:p.arrivalTime, state:p.state})))}\n\n`
      hasContext = true
    }
  } catch(e) {}

  try {
    const mem = useMemoryStore.getState()
    if (mem && mem.blocks?.length > 0) {
      ctx += `[Memory Allocation]\nAlgorithm: ${mem.algorithm}\nBlocks: ${JSON.stringify(mem.blocks.map(b => ({id:b.id, size:b.size, isAllocated:b.isAllocated})))}\n\n`
      hasContext = true
    }
  } catch(e) {}

  try {
    const disk = useDiskStore.getState()
    if (disk && disk.requests?.length > 0) {
      ctx += `[Disk Scheduling]\nAlgorithm: ${disk.algorithm}\nHead Position: ${disk.currentHeadPosition}\nTotal Seek Time: ${disk.totalSeekTime}\n\n`
      hasContext = true
    }
  } catch(e) {}

  return hasContext ? ctx : ""
}

export async function* streamChat(messages, model = 'llama3.2') {
  // Inject context into the system message (which is usually the first one)
  const modifiedMessages = [...messages]
  if (modifiedMessages.length > 0 && modifiedMessages[0].role === 'system') {
    modifiedMessages[0].content += getSimulationContext()
  }

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: modifiedMessages,
      stream: true
    })
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.message?.content) yield json.message.content
        if (json.done) return
      } catch {}
    }
  }
}
