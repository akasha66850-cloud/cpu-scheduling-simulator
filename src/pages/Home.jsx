import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Cpu, BarChart2, Download, ArrowRight, Zap, Shield, RefreshCw,
  Clock, Activity, GitBranch,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: Cpu,
    title: '6 Algorithms',
    description: 'FCFS, SJF, SRTF, Priority, Priority Preemptive, and Round Robin — all implemented with full correctness.',
    color: 'indigo',
  },
  {
    icon: BarChart2,
    title: 'Real-time Gantt Chart',
    description: 'Animated, color-coded Gantt chart with step-by-step execution mode and process state transitions.',
    color: 'emerald',
  },
  {
    icon: Download,
    title: 'Export PDF & CSV',
    description: 'Generate professional PDF reports with Gantt charts, or export raw data to CSV for further analysis.',
    color: 'amber',
  },
]

const ALGO_CARDS = [
  { name: 'FCFS', type: 'Non-Preemptive', desc: 'First Come, First Served — simplest policy, processes served in arrival order.', starvation: false },
  { name: 'SJF', type: 'Non-Preemptive', desc: 'Shortest Job First — minimizes average waiting time when burst times are known.', starvation: true },
  { name: 'SRTF', type: 'Preemptive', desc: 'Shortest Remaining Time First — optimal turnaround, preempts on shorter arrivals.', starvation: true },
  { name: 'Priority', type: 'Non-Preemptive', desc: 'Priority-based — lower number = higher priority, supports aging to prevent starvation.', starvation: true },
  { name: 'Priority Preemptive', type: 'Preemptive', desc: 'Preemptive priority — high-priority arrivals immediately preempt the running process.', starvation: true },
  { name: 'Round Robin', type: 'Preemptive', desc: 'Fair time-sharing — each process gets equal CPU slices (quantum), no starvation.', starvation: false },
]

const STAT_ITEMS = [
  { value: '6', label: 'Algorithms' },
  { value: '100%', label: 'Client-side' },
  { value: 'PDF', label: 'Export formats' },
  { value: '∞', label: 'Simulations' },
]

// ─── Animated Dot ─────────────────────────────────────────────
function AnimatedDot({ delay, x, y, size }) {
  return (
    <motion.div
      className="absolute rounded-full bg-indigo-500/20"
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
        <div className="orb w-96 h-96 bg-indigo-600 -top-20 -left-20" />
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8"
          >
            <Cpu className="w-4 h-4" />
            CPU Scheduling Simulator
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6"
          >
            Visualize{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              CPU Scheduling
            </span>
            <br />
            Algorithms
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
          >
            Interactively simulate and compare FCFS, SJF, SRTF, Priority, and Round Robin algorithms
            with animated Gantt charts, real-time metrics, and PDF export.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/simulator"
              id="hero-start-btn"
              className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              Start Simulation
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/compare"
              id="hero-compare-btn"
              className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              <BarChart2 className="w-5 h-5" />
              View Comparison
            </Link>
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
                <div className="text-3xl font-black text-white font-mono">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">Built for Engineers</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything you need to understand CPU scheduling algorithms — from theory to visualization.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURE_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:border-slate-600 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center
                  bg-${card.color}-500/10 border border-${card.color}-500/20
                  group-hover:bg-${card.color}-500/20 transition-colors`}
                >
                  <Icon className={`w-6 h-6 text-${card.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── Advanced Features ─────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Advanced Features</h2>
            <p className="text-slate-400">Production-grade capabilities for serious learning</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Step-by-Step Mode', desc: 'Advance the simulation one time unit at a time, watch the ready queue update live.' },
              { icon: Shield, title: 'Starvation Detection', desc: 'Automatically flags processes waiting longer than 3× average burst time.' },
              { icon: RefreshCw, title: 'Priority Aging', desc: 'Simulates priority aging — waiting processes gradually gain priority.' },
              { icon: Clock, title: 'Process State Diagram', desc: 'Live New → Ready → Running → Terminated state transitions per process.' },
              { icon: GitBranch, title: 'Simulation History', desc: 'Save up to 10 simulations to localStorage and restore them anytime.' },
              { icon: Activity, title: 'Analytics Dashboard', desc: 'Timeline charts, waiting time distribution, and response time analysis.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors"
                >
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Algorithm Overview ────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">All 6 Algorithms</h2>
          <p className="text-slate-400">Every major CPU scheduling algorithm, fully implemented client-side</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALGO_CARDS.map((algo, i) => (
            <motion.div
              key={algo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card p-5 hover:border-indigo-500/40 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base">{algo.name}</h3>
                <div className="flex gap-1.5">
                  <span className={`badge text-xs ${algo.type === 'Preemptive' ? 'badge-indigo' : 'badge-slate'}`}>
                    {algo.type === 'Preemptive' ? '⚡ Pre.' : '🔒 Non-Pre.'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">{algo.desc}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">Starvation:</span>
                <span className={`badge ${algo.starvation ? 'badge-red' : 'badge-green'}`}>
                  {algo.starvation ? 'Possible' : 'None'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/simulator" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
            Open Simulator
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
