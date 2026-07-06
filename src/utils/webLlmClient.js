import { CreateMLCEngine } from "@mlc-ai/web-llm"
import useAiAssistantStore from '../store/useAiAssistantStore'
import useSchedulerStore from '../store/useSchedulerStore'
import useMemoryStore from '../store/useMemoryStore'
import useDiskStore from '../store/useDiskStore'

// Use the lightweight 1B model that runs fast on most GPUs
const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC"
let globalEngine = null

export async function initWebLLMEngine() {
  const store = useAiAssistantStore.getState()
  
  if (globalEngine) return globalEngine

  store.setEngineStatus('loading')
  
  const initProgressCallback = (initProgress) => {
    store.setEngineProgressText(initProgress.text)
  }

  try {
    globalEngine = await CreateMLCEngine(
      MODEL_ID,
      { initProgressCallback }
    )
    store.setEngineStatus('ready')
    return globalEngine
  } catch (err) {
    console.error("Failed to initialize WebLLM:", err)
    store.setEngineStatus('error')
    store.setEngineProgressText(err.message || 'Initialization failed. (Requires WebGPU in Chrome/Edge)')
    throw err
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

export async function* streamChat(messages) {
  if (!globalEngine) {
    throw new Error("Engine not initialized")
  }

  // Inject context into the system message
  const modifiedMessages = [...messages]
  if (modifiedMessages.length > 0 && modifiedMessages[0].role === 'system') {
    modifiedMessages[0].content += getSimulationContext()
  }

  const chunks = await globalEngine.chat.completions.create({
    messages: modifiedMessages,
    stream: true,
  })

  for await (const chunk of chunks) {
    const content = chunk.choices[0]?.delta?.content || ""
    if (content) {
      yield content
    }
  }
}
