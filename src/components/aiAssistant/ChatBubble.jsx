import { motion } from 'framer-motion'
import useAiAssistantStore from '../../store/useAiAssistantStore'

export default function ChatBubble() {
  const { isOpen, setOpen, isTyping } = useAiAssistantStore()
  return (
    <motion.button
      onClick={() => setOpen(!isOpen)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed', bottom: '20px', right: '20px',
        zIndex: 9999, width: '52px', height: '52px',
        borderRadius: '50%', background: '#6366f1',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
      }}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
    >
      {isTyping ? (
        <div style={{ display:'flex', gap:'3px' }}>
          {[0,1,2].map(i => (
            <motion.div key={i}
              animate={{ y: [0,-4,0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i*0.1 }}
              style={{ width:5, height:5, background:'#fff', borderRadius:'50%' }}
            />
          ))}
        </div>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )}
    </motion.button>
  )
}
