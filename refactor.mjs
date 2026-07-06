import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const replaceMap = {
  // text
  'text-slate-50': 'text-text-primary',
  'text-slate-100': 'text-text-primary',
  'text-slate-200': 'text-text-primary',
  'text-slate-300': 'text-text-secondary',
  'text-slate-400': 'text-text-muted',
  'text-slate-500': 'text-text-muted',
  'text-slate-600': 'text-text-muted',
  'text-slate-950': 'text-base',
  'text-white': 'text-text-primary',
  'text-indigo-400': 'text-accent',
  'text-indigo-500': 'text-accent',
  'text-emerald-400': 'text-green',
  'text-emerald-300': 'text-green',
  'text-rose-400': 'text-red',
  'text-rose-500': 'text-red',
  'text-red-400': 'text-red',
  'text-red-500': 'text-red',
  'text-amber-400': 'text-orange',
  'text-amber-500': 'text-orange',
  'text-teal-400': 'text-cyan',
  'text-cyan-400': 'text-cyan',
  
  // bg
  'bg-slate-950': 'bg-base',
  'bg-slate-900': 'bg-surface',
  'bg-slate-800': 'bg-elevated',
  'bg-slate-700': 'bg-overlay',
  'bg-slate-600': 'bg-overlay',
  'bg-indigo-600': 'bg-accent',
  'bg-indigo-500': 'bg-accent',
  'bg-emerald-600': 'bg-green',
  'bg-red-600': 'bg-red',
  'bg-amber-600': 'bg-orange',
  
  // border
  'border-slate-800': 'border-border',
  'border-slate-700': 'border-border-muted',
  'border-slate-600': 'border-border-muted',
  'border-indigo-500': 'border-accent',
  'border-indigo-400': 'border-accent',
  'border-emerald-500': 'border-green',
  'border-red-500': 'border-red',
  'border-amber-500': 'border-orange',
}

function processDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath)
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      let modified = false
      
      // Mass regex replacement for Tailwind tokens
      for (const [oldClass, newClass] of Object.entries(replaceMap)) {
        // Match word boundaries, avoiding matches like 'bg-slate-800/50' where we only want to replace 'bg-slate-800'
        // Actually tailwind opacity modifiers like /50 are tricky.
        // The user spec said "Allocated cells: semi-transparent colored backgrounds... green (rgba(63,185,80,0.15))"
        // Let's just blindly replace the base color token; tailwind's JIT will map `bg-surface/50` if needed, but we don't have bg-surface defined with RGB variables for opacity. 
        // We will just replace `bg-slate-800/50` -> `bg-elevated` since opacity modifiers don't work with hardcoded hex CSS variables unless we format them correctly. We'll strip opacity modifiers.
        
        const regex = new RegExp(`\\b${oldClass}(?:\\/[0-9]+)?\\b`, 'g')
        if (regex.test(content)) {
          content = content.replace(regex, newClass)
          modified = true
        }
      }
      
      // Radius replacements
      const radiusRegex1 = /\brounded-xl\b/g
      const radiusRegex2 = /\brounded-lg\b/g
      if (radiusRegex1.test(content)) { content = content.replace(radiusRegex1, 'rounded-[8px]'); modified = true; }
      if (radiusRegex2.test(content)) { content = content.replace(radiusRegex2, 'rounded-[5px]'); modified = true; }
      
      // Recharts standard replacements
      if (content.includes('recharts') || content.includes('<XAxis') || content.includes('<CartesianGrid')) {
         content = content.replace(/stroke="[^"]+"/g, (match) => {
           if (match.includes('#') || match.includes('slate') || match.includes('gray')) {
              return 'stroke="var(--border)"'
           }
           return match
         })
         content = content.replace(/fill="[^"]+"/g, (match) => {
           if (match.includes('#') || match.includes('slate') || match.includes('gray')) {
              if (match.includes('text')) return 'fill="var(--text-muted)"'
              return 'fill="var(--text-muted)"'
           }
           return match
         })
         modified = true
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content)
        console.log(`Updated ${file}`)
      }
    }
  }
}

processDir(path.join(__dirname, 'src'))
console.log('Refactoring complete')
