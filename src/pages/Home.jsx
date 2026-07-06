import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Cpu, Layers, HardDrive, Disc, ShieldAlert, Lock, FileText,
  BarChart2, Download, ArrowRight, Zap, Shield, RefreshCw,
  Clock, Activity, GitBranch,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────
const CATEGORIES = [
  { 
    name: 'CPU Scheduling', path: '/simulator', 
    desc: 'Visualize FCFS, SJF, SRTF, Priority, and Round Robin scheduling algorithms with real-time Gantt charts.', 
    icon: Cpu, color: 'indigo' 
  },
  { 
    name: 'Page Replacement', path: '/page-replacement', 
    desc: 'Simulate FIFO, LRU, Optimal, and Clock algorithms. Analyze page faults and Belady\'s Anomaly.', 
    icon: Layers, color: 'emerald' 
  },
  { 
    name: 'Memory Management', path: '/memory', 
    desc: 'Understand contiguous memory allocation using First Fit, Best Fit, Worst Fit, and Next Fit.', 
    icon: HardDrive, color: 'amber' 
  },
  { 
    name: 'Disk Scheduling', path: '/disk', 
    desc: 'Optimize disk head movement with FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK strategies.', 
    icon: Disc, color: 'sky' 
  },
  { 
    name: 'Deadlocks', path: '/deadlock', 
    desc: 'Explore deadlock detection, Bankers Algorithm for safety, and prevention/recovery techniques.', 
    icon: ShieldAlert, color: 'rose' 
  },
  { 
    name: 'Process Sync', path: '/sync', 
    desc: 'Solve classic synchronization problems: Mutex, Semaphores, Producer-Consumer, and Dining Philosophers.', 
    icon: Lock, color: 'violet' 
  },
  { 
    name: 'File Allocation', path: '/file', 
    desc: 'Compare Contiguous, Linked, and Indexed file allocation methods and their fragmentation impacts.', 
    icon: FileText, color: 'cyan' 
  },
]

const STAT_ITEMS = [
  { value: '7', label: 'Categories' },
  { value: '30+', label: 'Algorithms' },
  { value: '100%', label: 'Client-side JS' },
  { value: 'PDF', label: 'Export formats' },
]

// ─── Animated Dot ─────────────────────────────────────────────
function AnimatedDot({ delay, x, y, size }) {
  return (
    <motion.div
      className="absolute rounded-full bg-accent"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4 + delay,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

const DOTS = [
  { x: 10, y: 20, size: 12, delay: 0 },
  { x: 25, y: 70, size: 8, delay: 1 },
  { x: 50, y: 30, size: 16, delay: 0.5 },
  { x: 70, y: 60, size: 10, delay: 1.5 },
  { x: 85, y: 25, size: 14, delay: 2 },
  { x: 40, y: 80, size: 6, delay: 0.8 },
  { x: 90, y: 75, size: 12, delay: 2.5 },
  { x: 60, y: 10, size: 8, delay: 1.2 },
]

// ─── Page ─────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Grid background */}
        <div className="absolute inset-0 animated-grid opacity-60" />

        {/* Glowing orbs */}
        <div className="orb w-96 h-96 bg-accent -top-20 -left-20" />
        <div className="orb w-80 h-80 bg-violet-600 bottom-0 right-10" style={{ animationDelay: '2s' }} />
        <div className="orb w-64 h-64 bg-sky-600 top-1/3 right-1/3" style={{ animationDelay: '4s' }} />

        {/* Animated dots */}
        {DOTS.map((dot, i) => (
          <AnimatedDot key={i} {...dot} />
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-accent text-indigo-300 text-sm font-medium mb-8"
          >
            <Cpu className="w-4 h-4" />
            Comprehensive OS Algorithm Simulator
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-text-primary mb-6"
          >
            Master{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              Operating Systems
            </span>
            <br />
            Interactively
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-text-secondary mb-10 max-w-3xl mx-auto"
          >
            Visualize and analyze 30+ algorithms across CPU Scheduling, Page Replacement, Memory Management, Disk Scheduling, Deadlocks, Process Synchronization, and File Allocation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#simulators"
              className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              Explore Simulators
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-16 flex-wrap"
          >
            {STAT_ITEMS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-text-primary font-mono">{s.value}</div>
                <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Simulators Overview ────────────────────────────── */}
      <section id="simulators" className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text-primary mb-3">All Simulator Categories</h2>
          <p className="text-text-muted">Every major OS concept, fully implemented client-side</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon
            return (
              <Link to={cat.path} key={cat.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="card p-6 h-full hover:border-accent transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-[8px] mb-4 flex items-center justify-center
                    bg-${cat.color}-500/10 border border-${cat.color}-500/20
                    group-hover:bg-${cat.color}-500/20 transition-colors shrink-0`}
                  >
                    <Icon className={`w-6 h-6 text-${cat.color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">{cat.name}</h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-grow">{cat.desc}</p>
                  
                  <div className="mt-4 flex items-center text-accent text-sm font-medium">
                    Open Simulator <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Advanced Features ─────────────────────────────── */}
      <section className="py-16 px-6 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-3">Advanced Features</h2>
            <p className="text-text-muted">Production-grade capabilities for serious learning</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Step-by-Step Mode', desc: 'Advance any simulation one step at a time, watch the internal state update live.' },
              { icon: Shield, title: 'Deadlock Detection', desc: 'Automatically flags unsafe states and visualizes Resource Allocation Graphs.' },
              { icon: Activity, title: 'Analytics & Comparisons', desc: 'Race multiple algorithms simultaneously to compare performance metrics.' },
              { icon: Clock, title: 'Real-time Animations', desc: 'Visualize page faults, disk head trajectories, and process executions instantly.' },
              { icon: Download, title: 'PDF & CSV Export', desc: 'Download professional PDF reports or export raw data for external analysis.' },
              { icon: GitBranch, title: '100% Client-Side', desc: 'High performance native JavaScript engines running entirely in your browser.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-[8px] bg-elevated border border-border-muted hover:border-border-muted transition-colors"
                >
                  <div className="p-2 bg-accent border border-accent rounded-[5px] shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
