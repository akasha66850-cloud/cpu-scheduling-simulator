import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm"

// Initialize the handler which will receive messages from the main thread
const handler = new WebWorkerMLCEngineHandler()

self.onmessage = (msg) => {
  handler.onmessage(msg)
}
