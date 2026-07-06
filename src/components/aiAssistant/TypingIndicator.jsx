import { motion } from 'framer-motion'
export default function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px',
      background:'#1e2535', borderRadius:'12px 12px 12px 2px', width:'fit-content', marginBottom:10 }}>
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ y:[0,-4,0] }}
          transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}
          style={{ width:6, height:6, background:'#6366f1', borderRadius:'50%' }}
        />
      ))}
    </div>
  )
}
