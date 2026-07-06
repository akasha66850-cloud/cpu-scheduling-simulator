import useSchedulerStore from '../store/useSchedulerStore'
import useMemoryStore from '../store/useMemoryStore'
import useDiskStore from '../store/useDiskStore'

export async function* streamChat(messages, apiKey, model = 'llama-3.1-8b-instant') {
  if (!apiKey) throw new Error("API Key is missing")

  // Inject simulation context into the first message
  const modifiedMessages = [...messages]
  if (modifiedMessages.length > 0 && modifiedMessages[0].role === 'system') {
    modifiedMessages[0].content += getSimulationContext()
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: modifiedMessages,
      stream: true
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API Error (${res.status}): ${errorText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))
    
    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim()
      if (data === '[DONE]') return
      
      try {
        const json = JSON.parse(data)
        const content = json.choices[0]?.delta?.content
        if (content) yield content
      } catch (err) {
        // Skip incomplete chunks
      }
    }
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
