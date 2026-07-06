import React, { useMemo } from 'react'
import useSyncStore from '@/store/useSyncStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Database, User, BookOpen, PenTool } from 'lucide-react'

export default function SyncVisualizer() {
  const { results, stepIndex, activeProblem, params } = useSyncStore()

  // Calculate current state based on timeline events up to stepIndex
  const state = useMemo(() => {
    if (!results || !results.timeline) return null
    const events = results.timeline.slice(0, stepIndex)
    
    // Base thread state tracking
    const threadCount = results.threads.length
    const threadStates = Array(threadCount).fill('idle')
    
    // Problem specific states
    let mutexOwner = -1
    let semAvailable = params.pool_size
    let bufferCount = 0
    let rwReaders = 0
    let rwWriter = false
    let forks = Array(params.philosophers).fill(-1)
    let meals = Array(params.philosophers).fill(0)

    events.forEach(ev => {
      // General Thread States
      if (ev.event_type.includes('waiting') || ev.event_type === 'hungry') {
        threadStates[ev.thread_id] = 'waiting'
      } else if (['acquire', 'produce', 'consume', 'read_start', 'write_start', 'eat'].includes(ev.event_type)) {
        threadStates[ev.thread_id] = 'blocked' // active in critical section
      } else if (['release', 'produce_done', 'consume_done', 'read_end', 'write_end', 'think'].includes(ev.event_type)) {
        threadStates[ev.thread_id] = 'running' // back to computing
      }

      // Specific Problem States
      if (activeProblem === 'mutex') {
        if (ev.event_type === 'acquire') mutexOwner = ev.thread_id
        if (ev.event_type === 'release') mutexOwner = -1
      }
      else if (activeProblem === 'semaphore') {
        if (ev.event_type === 'acquire') semAvailable--
        if (ev.event_type === 'release') semAvailable++
      }
      else if (activeProblem === 'producer_consumer') {
        if (ev.event_type === 'produce') bufferCount++
        if (ev.event_type === 'consume') bufferCount--
      }
      else if (activeProblem === 'reader_writer') {
        if (ev.event_type === 'read_start') rwReaders++
        if (ev.event_type === 'read_end') rwReaders--
        if (ev.event_type === 'write_start') rwWriter = true
        if (ev.event_type === 'write_end') rwWriter = false
      }
      else if (activeProblem === 'dining') {
        if (ev.event_type === 'eat') {
            const left = ev.thread_id
            const right = (ev.thread_id + 1) % params.philosophers
            forks[left] = ev.thread_id
            forks[right] = ev.thread_id
        }
        if (ev.event_type === 'think') {
            const left = ev.thread_id
            const right = (ev.thread_id + 1) % params.philosophers
            forks[left] = -1
            forks[right] = -1
            meals[ev.thread_id]++
        }
      }
    })

    return { threadStates, mutexOwner, semAvailable, bufferCount, rwReaders, rwWriter, forks, meals }
  }, [results, stepIndex, activeProblem, params])

  if (!state) {
    return (
      <div className="bg-surface border border-border rounded-[8px] p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-text-muted">Run a simulation to view live visualization.</p>
      </div>
    )
  }

  // Color mappings
  const stateColors = {
    idle: 'bg-overlay text-text-secondary border-border-muted',
    running: 'bg-emerald-500/20 text-green border-green',
    waiting: 'bg-amber-500/20 text-orange border-orange',
    blocked: 'bg-red-500/20 text-red border-red shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  }

  return (
    <div className="bg-surface border border-border rounded-[8px] p-6 flex flex-col gap-8 min-h-[400px]">
      
      {/* Threads Vis */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider">Thread States</h3>
        <div className="flex flex-wrap gap-4">
          <AnimatePresence>
            {state.threadStates.map((s, i) => (
              <motion.div
                key={i}
                layout
                className={`relative px-4 py-2 rounded-[5px] border-2 font-mono text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${stateColors[s]}`}
                animate={{ scale: s === 'blocked' ? 1.05 : 1 }}
              >
                T{i}
                <span className="text-xs uppercase opacity-70 ml-1">{s}</span>
                {s === 'blocked' && (
                  <motion.div
                    className="absolute inset-0 rounded-[5px] border-2 border-red-400"
                    animate={{ opacity: [1, 0], scale: [1, 1.2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="h-px w-full bg-elevated" />

      {/* Problem Specific Vis */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {activeProblem === 'mutex' && (
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-text-muted mb-6 uppercase tracking-wider">Shared Resource (Mutex)</h3>
            <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500 ${state.mutexOwner === -1 ? 'border-green bg-emerald-500/10' : 'border-red bg-red-500/10'}`}>
              {state.mutexOwner === -1 ? (
                <><Unlock className="w-10 h-10 text-emerald-500 mb-2" /><span className="text-emerald-500 font-bold">UNLOCKED</span></>
              ) : (
                <><Lock className="w-10 h-10 text-red mb-2" /><span className="text-red font-bold">LOCKED by T{state.mutexOwner}</span></>
              )}
            </div>
          </div>
        )}

        {activeProblem === 'semaphore' && (
          <div className="w-full max-w-2xl">
             <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider text-center">Semaphore Pool (Available: {state.semAvailable})</h3>
             <div className="grid grid-cols-5 gap-4 justify-center">
               {Array.from({length: params.pool_size}).map((_, i) => (
                 <motion.div 
                   key={i}
                   className={`h-16 rounded-[8px] border-2 flex items-center justify-center transition-colors duration-500 ${i < state.semAvailable ? 'border-green bg-emerald-500/20' : 'border-red bg-red-500/20'}`}
                 >
                    {i < state.semAvailable ? <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-glow" /> : <Lock className="w-6 h-6 text-red" />}
                 </motion.div>
               ))}
             </div>
          </div>
        )}

        {activeProblem === 'producer_consumer' && (
          <div className="w-full max-w-3xl">
             <div className="flex justify-between text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">
                <span>Producers (Left)</span>
                <span>Buffer ({state.bufferCount}/{params.buffer_size})</span>
                <span>Consumers (Right)</span>
             </div>
             <div className="relative h-20 bg-base border-2 border-border rounded-[8px] flex items-center px-2 gap-2 overflow-hidden shadow-inner">
               <AnimatePresence>
                 {Array.from({length: state.bufferCount}).map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, x: -50, scale: 0.5 }}
                     animate={{ opacity: 1, x: 0, scale: 1 }}
                     exit={{ opacity: 0, x: 50, scale: 0.5 }}
                     className="h-14 w-12 flex-shrink-0 bg-accent border border-accent rounded-[5px] flex items-center justify-center text-indigo-300 font-bold"
                   >
                     {i+1}
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
             <div className="mt-4 w-full h-2 bg-elevated rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-accent"
                  animate={{ width: `${(state.bufferCount / params.buffer_size) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
             </div>
          </div>
        )}

        {activeProblem === 'reader_writer' && (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <h3 className="text-sm font-semibold text-text-muted mb-6 uppercase tracking-wider">Shared Database</h3>
            
            <div className="relative w-full h-32 bg-base border-2 border-border-muted rounded-2xl flex overflow-hidden">
               {/* Writer active */}
               <AnimatePresence>
                 {state.rwWriter && (
                   <motion.div
                     initial={{ opacity: 0, width: '0%' }}
                     animate={{ opacity: 1, width: '100%' }}
                     exit={{ opacity: 0, width: '0%' }}
                     className="absolute inset-0 bg-red-500/20 border-x-4 border-red flex items-center justify-center z-10"
                   >
                     <PenTool className="w-12 h-12 text-red mr-3 animate-pulse" />
                     <span className="text-2xl font-bold text-red tracking-widest uppercase">Writing Exclusive</span>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Readers active */}
               <div className="flex-1 flex items-center justify-center relative z-0">
                  <Database className="w-16 h-16 text-text-muted opacity-20 absolute" />
                  {state.rwReaders > 0 && !state.rwWriter && (
                     <div className="flex items-center gap-4 flex-wrap justify-center p-4">
                       {Array.from({length: state.rwReaders}).map((_, i) => (
                         <motion.div key={i} initial={{scale:0}} animate={{scale:1}} className="flex flex-col items-center">
                           <BookOpen className="w-8 h-8 text-green mb-1" />
                           <span className="text-xs text-green font-bold">R{i+1}</span>
                         </motion.div>
                       ))}
                     </div>
                  )}
                  {state.rwReaders === 0 && !state.rwWriter && <span className="text-text-muted font-bold">IDLE</span>}
               </div>
            </div>
            {state.rwReaders > 0 && !state.rwWriter && (
              <div className="mt-4 text-green font-bold">{state.rwReaders} Concurrent Reader(s)</div>
            )}
          </div>
        )}

        {activeProblem === 'dining' && (
          <div className="w-full flex flex-col items-center relative py-8">
            <div className="absolute top-0 right-0 bg-emerald-500/20 border border-green text-green px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              Deadlock-Free (Chandy/Misra)
            </div>
            
            <div className="relative w-80 h-80">
              {/* Table */}
              <div className="absolute inset-8 rounded-full border-4 border-border-muted bg-elevated flex items-center justify-center">
                <span className="text-text-muted font-bold text-xl opacity-50">TABLE</span>
              </div>
              
              {/* Philosophers & Forks SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full" viewBox="-100 -100 200 200">
                {Array.from({length: params.philosophers}).map((_, i) => {
                  const angle = (i * (360 / params.philosophers) - 90) * (Math.PI / 180)
                  const px = Math.cos(angle) * 75
                  const py = Math.sin(angle) * 75
                  
                  const f_angle = ((i + 0.5) * (360 / params.philosophers) - 90) * (Math.PI / 180)
                  const fx = Math.cos(f_angle) * 45
                  const fy = Math.sin(f_angle) * 45
                  
                  const forkHeld = state.forks[i] !== -1
                  
                  return (
                    <g key={i}>
                      {/* Fork line */}
                      <line 
                        x1={0} y1={0} x2={fx} y2={fy} 
                        stroke={forkHeld ? '#ef4444' : '#10b981'} 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        className="transition-colors duration-500"
                      />
                      <circle cx={fx} cy={fy} r="5" fill={forkHeld ? '#ef4444' : '#10b981'} className="transition-colors duration-500" />
                      
                      {/* Philosopher Node */}
                      <motion.circle 
                        cx={px} cy={py} r="18" 
                        fill={state.threadStates[i] === 'blocked' ? '#ef4444' : (state.threadStates[i] === 'waiting' ? '#f59e0b' : '#64748b')}
                        animate={{ scale: state.threadStates[i] === 'blocked' ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: state.threadStates[i] === 'blocked' ? Infinity : 0, duration: 1 }}
                      />
                      <text x={px} y={py} textAnchor="middle" dy="4" fill="white" fontSize="12" fontWeight="bold">P{i}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            
            <div className="mt-8 flex gap-4 text-xs font-bold uppercase">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div> Thinking</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Hungry (Waiting)</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Eating (Both Forks)</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
