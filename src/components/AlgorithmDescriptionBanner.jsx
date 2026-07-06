import React from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

export default function AlgorithmDescriptionBanner({ title, description }) {
  if (!description) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8 md:p-12 text-center bg-indigo-900/20 border-indigo-500/30 w-full mb-6 flex flex-col items-center justify-center min-h-[200px]"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
        <Info className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight mb-4">
        {title}
      </h2>
      <p className="text-xl md:text-2xl text-indigo-200 leading-relaxed max-w-4xl mx-auto font-medium">
        {description}
      </p>
    </motion.div>
  )
}
