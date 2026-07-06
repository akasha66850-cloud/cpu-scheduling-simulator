import { Paperclip } from 'lucide-react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom:'10px' }}>
      {!isUser && (
        <div style={{ width:26, height:26, borderRadius:'50%', background:'#6366f1',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, color:'#fff', fontWeight:700, marginRight:6, flexShrink:0, alignSelf:'flex-end' }}>
          OS
        </div>
      )}
      <div style={{
        maxWidth:'80%', padding:'8px 12px', borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        background: isUser ? '#6366f1' : '#1e2535',
        color: '#e2e8f0', fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap'
      }}>
        {/* Render Attachments if any */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom: message.displayContent ? 6 : 0 }}>
            {message.attachments.map((att, idx) => (
              <div key={idx} style={{ 
                display:'flex', alignItems:'center', gap:4, padding:'4px 8px', 
                background: isUser ? '#4f46e5' : '#13171f', 
                borderRadius:4, fontSize:10, color:'#e2e8f0' 
              }}>
                <Paperclip size={10} />
                <span style={{ maxWidth: 100, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{att}</span>
              </div>
            ))}
          </div>
        )}
        {message.displayContent || message.content}
      </div>
    </div>
  )
}
