import { useState, useRef, useEffect } from 'react'
import useAiAssistantStore from '../../store/useAiAssistantStore'
import { OS_SYSTEM_PROMPT } from '../../utils/osSystemPrompt'
import { streamChat, initWebLLMEngine } from '../../utils/webLlmClient'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import FileUploadButton from './FileUploadButton'
import ExtractedContentPreview from './ExtractedContentPreview'
import { ExternalLink, X } from 'lucide-react'

export default function ChatPanel({ isFloating = false, isFullPage = false }) {
  const { messages, isTyping, engineStatus, engineProgressText,
          addMessage, updateLastMessage, setTyping, clearChat, setOpen, 
          setFloating, stagedFiles, clearStagedFiles } = useAiAssistantStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, stagedFiles])

  const handlePopOut = () => {
    setOpen(false)
    setFloating(true)
  }

  const sendMessage = async () => {
    const text = input.trim()
    const hasAttachments = stagedFiles.some(f => f.status === 'success')
    
    if ((!text && !hasAttachments) || isTyping || engineStatus !== 'ready') return
    setInput('')

    // Append attachments context if any
    let attachmentContext = ''
    let attachmentPreview = []
    if (hasAttachments) {
      attachmentContext = '\n\n[The user has attached the following document/image content for context:]\n'
      stagedFiles.filter(f => f.status === 'success').forEach(file => {
        attachmentContext += `\n--- START ${file.name} ---\n${file.extractedText}\n--- END ${file.name} ---\n`
        attachmentPreview.push(file.name)
      })
      clearStagedFiles()
    }

    const finalUserContent = text + attachmentContext

    const userMsg = { 
      role: 'user', 
      content: finalUserContent, 
      displayContent: text, // Optional: clean text to show in UI
      attachments: attachmentPreview,
      id: Date.now() 
    }
    
    addMessage(userMsg)
    setTyping(true)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    const fullHistory = [{ role: 'system', content: OS_SYSTEM_PROMPT }, ...history]

    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1 }
    addMessage(assistantMsg)

    let fullContent = ''
    try {
      for await (const chunk of streamChat(fullHistory)) {
        fullContent += chunk
        updateLastMessage(fullContent)
      }
    } catch (err) {
      updateLastMessage('Sorry, the WebLLM engine encountered an error.')
    }
    setTyping(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const suggestions = [
    'Explain FCFS algorithm',
    'What is Belady\'s anomaly?',
    'How to read Gantt chart?',
    'Difference: SJF vs SRTF'
  ]

  return (
    <div style={{ width:'100%', height:'100%', background:'#161b27',
      borderLeft: isFullPage ? 'none' : '1px solid #1e2535', display:'flex',
      flexDirection:'column', overflow:'hidden', fontFamily:'Inter,sans-serif' }}>

      {/* Header - hide on full page as it has its own header */}
      {!isFullPage && !isFloating && (
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #1e2535',
          display:'flex', alignItems:'center', justifyContent:'space-between', background:'#13171f' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'#6366f1',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, color:'#fff', fontWeight:700 }}>OS</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0' }}>OSBot</div>
              <div style={{ fontSize:10, color: engineStatus === 'ready' ? '#34d399' : engineStatus === 'loading' ? '#fbbf24' : '#f87171' }}>
                {engineStatus === 'ready' ? '● Online (WebGPU)' : engineStatus === 'loading' ? '● Loading...' : '● Offline'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button onClick={clearChat} title="Clear chat"
              style={{ background:'transparent', border:'none', color:'#475569',
                cursor:'pointer', fontSize:14, padding:4 }}>⟳</button>
            <button onClick={handlePopOut} title="Pop out"
              style={{ background:'transparent', border:'none', color:'#475569',
                cursor:'pointer', fontSize:14, padding:4, display:'flex', alignItems:'center' }}>
              <ExternalLink size={16} />
            </button>
            <button onClick={() => setOpen(false)} title="Close"
              style={{ background:'transparent', border:'none', color:'#475569',
                cursor:'pointer', fontSize:18, padding:4, display:'flex', alignItems:'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main chat history */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>
              Ask me anything about OS concepts or how to use the simulator
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); }}
                  style={{ background:'#1e2535', border:'1px solid #1e2535',
                    borderRadius:8, color:'#94a3b8', fontSize:11,
                    padding:'6px 12px', cursor:'pointer', textAlign:'left' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        {isTyping && messages[messages.length-1]?.role !== 'assistant' && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {engineStatus !== 'ready' && (
        <div style={{ padding:'12px 14px', background:'rgba(248,113,113,0.1)', borderTop:'1px solid rgba(248,113,113,0.2)',
          display:'flex', flexDirection:'column', gap:8, alignItems:'center', justifyContent:'center' }}>
          
          <div style={{ fontSize:12, color:'#f87171', textAlign:'center', lineHeight:1.4 }}>
            {engineStatus === 'loading' ? (
              <span style={{ color: '#fbbf24' }}>{engineProgressText || 'Initializing WebGPU Engine...'}</span>
            ) : engineStatus === 'error' ? (
              <span>{engineProgressText || 'Failed to load WebLLM. Ensure you are using Chrome/Edge on a supported device.'}</span>
            ) : (
              <span>AI Engine is currently offline.</span>
            )}
          </div>
          
          {(engineStatus === 'offline' || engineStatus === 'error') && (
            <button 
              onClick={() => { initWebLLMEngine().catch(console.error) }}
              style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
            >
              Initialize AI Engine (~1GB Download)
            </button>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-col bg-[#13171f] border-t border-[#1e2535]">
        <ExtractedContentPreview />
        
        <div className="p-3 flex items-end gap-2">
          <FileUploadButton />
          
          <div className="flex-1 bg-[#0f1117] border border-[#1e2535] rounded-xl overflow-hidden focus-within:border-accent transition-colors">
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} 
              placeholder="Ask about OS concepts or the simulator..."
              rows={Math.min(4, input.split('\n').length)}
              disabled={!isOllamaRunning}
              className="w-full bg-transparent text-[#e2e8f0] text-sm p-3 resize-none focus:outline-none custom-scrollbar"
              style={{ 
                minHeight: '44px',
                maxHeight: '120px',
                opacity: isOllamaRunning ? 1 : 0.5 
              }} 
            />
          </div>
          
          <button 
            onClick={sendMessage} 
            disabled={!isOllamaRunning || (!input.trim() && stagedFiles.filter(f=>f.status==='success').length===0) || isTyping}
            className={`w-11 h-11 flex items-center justify-center rounded-xl text-white transition-all ${
              (!isOllamaRunning || (!input.trim() && stagedFiles.filter(f=>f.status==='success').length===0) || isTyping)
                ? 'bg-[#1e2535] text-[#475569] cursor-not-allowed'
                : 'bg-accent hover:bg-[var(--accent-hover)] cursor-pointer'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
