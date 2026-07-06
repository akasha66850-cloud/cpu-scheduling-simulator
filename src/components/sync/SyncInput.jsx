import React from 'react'
import useSyncStore from '@/store/useSyncStore'
import { motion } from 'framer-motion'

export const SYNC_PROBLEMS = [
  { id: 'mutex', label: 'Mutex', desc: 'Mutual Exclusion: Ensures only one thread can access the critical section at any given time using locking mechanisms.' },
  { id: 'semaphore', label: 'Semaphore', desc: 'Counting Semaphore: Maintains a set number of available permits, useful for managing a limited pool of resources.' },
  { id: 'producer_consumer', label: 'Producer/Consumer', desc: 'Bounded-Buffer Problem: Producers add data, consumers remove data. Requires synchronization so producers don\'t add to a full buffer and consumers don\'t take from an empty one.' },
  { id: 'reader_writer', label: 'Reader/Writer', desc: 'Allows multiple concurrent readers but only one exclusive writer. Can be configured to prefer readers or writers.' },
  { id: 'dining', label: 'Dining Philosophers', desc: 'Allocates limited resources (chopsticks) among multiple processes (philosophers) without causing deadlock or starvation.' },
]

export default function SyncInput() {
  const { activeProblem, setProblem, params, setParam, togglePreference } = useSyncStore()

  return (
    <div className="bg-surface border border-border rounded-[8px] p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Tab Selector */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="flex flex-wrap gap-2 h-fit">
          {SYNC_PROBLEMS.map(p => (
          <button
            key={p.id}
            onClick={() => setProblem(p.id)}
            className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-all duration-200 ${
              activeProblem === p.id 
                ? 'bg-accent text-text-primary shadow-glow' 
                : 'bg-elevated text-text-muted hover:bg-overlay hover:text-text-primary'
            }`}
          >
            {p.label}
          </button>
          ))}
        </div>
        <div className="flex-1 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[5px] flex items-center">
          <p className="text-xs text-indigo-200 leading-relaxed">
             {SYNC_PROBLEMS.find(p => p.id === activeProblem)?.desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Conditional Inputs */}
        {(activeProblem === 'mutex' || activeProblem === 'semaphore') && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Threads</label>
            <input type="number" min="2" max="20" value={params.threads} onChange={e => setParam('threads', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors" />
          </div>
        )}

        {(activeProblem === 'mutex' || activeProblem === 'semaphore' || activeProblem === 'reader_writer') && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Operations / Thread</label>
            <input type="number" min="1" max="100" value={params.ops} onChange={e => setParam('ops', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors" />
          </div>
        )}

        {activeProblem === 'semaphore' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pool Size</label>
            <input type="number" min="1" max="10" value={params.pool_size} onChange={e => setParam('pool_size', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors" />
          </div>
        )}

        {activeProblem === 'producer_consumer' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Producers</label>
              <input type="number" min="1" max="10" value={params.producers} onChange={e => setParam('producers', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Consumers</label>
              <input type="number" min="1" max="10" value={params.consumers} onChange={e => setParam('consumers', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Buffer Size</label>
              <input type="number" min="1" max="20" value={params.buffer_size} onChange={e => setParam('buffer_size', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Items</label>
              <input type="number" min="1" max="100" value={params.items} onChange={e => setParam('items', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
          </>
        )}

        {activeProblem === 'reader_writer' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Readers</label>
              <input type="number" min="1" max="10" value={params.readers} onChange={e => setParam('readers', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Writers</label>
              <input type="number" min="1" max="10" value={params.writers} onChange={e => setParam('writers', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <button
                onClick={togglePreference}
                className="w-full px-3 py-2 text-sm font-medium rounded-[5px] transition-colors border border-border flex justify-between items-center bg-base hover:bg-elevated"
              >
                <span className="text-text-muted">Preference:</span>
                <span className={params.preference === 0 ? "text-green" : "text-orange"}>
                  {params.preference === 0 ? 'Readers' : 'Writers'}
                </span>
              </button>
            </div>
          </>
        )}

        {activeProblem === 'dining' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Philosophers</label>
              <input type="number" min="2" max="10" value={params.philosophers} onChange={e => setParam('philosophers', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Meals / Philosopher</label>
              <input type="number" min="1" max="20" value={params.meals} onChange={e => setParam('meals', Number(e.target.value))} className="w-full bg-base border border-border rounded-[5px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
