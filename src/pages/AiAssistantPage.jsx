import { useEffect } from 'react'
import useAiAssistantStore from '../store/useAiAssistantStore'
import ChatPanel from '../components/aiAssistant/ChatPanel'
import { Sparkles } from 'lucide-react'

export default function AiAssistantPage() {
  const { setOpen, setFloating } = useAiAssistantStore()

  useEffect(() => {
    // When visiting the full page, close the floating window and side panel to avoid duplicates
    setOpen(false)
    setFloating(false)
  }, [setOpen, setFloating])

  return (
    <div className="flex flex-col h-full bg-base rounded-md overflow-hidden border border-border shadow-md">
      {/* Header matching other module pages */}
      <div className="px-6 py-5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-md">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              AI Assistant (OSBot)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                BETA
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Your personal operating systems tutor running safely on the cloud via Groq API.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 bg-[#161b27] relative">
        {/* We pass a prop to ChatPanel to indicate it's in full-page mode, so it hides the close/pop-out buttons */}
        <ChatPanel isFullPage={true} />
      </div>
    </div>
  )
}
