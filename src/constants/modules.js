import { 
  Cpu, Database, LayoutTemplate, ShieldAlert, HardDrive, 
  RefreshCcw, Folder, Sparkles
} from 'lucide-react'

export const MODULES = [
  { id: 'cpu', label: 'CPU Scheduling', icon: Cpu, basePath: '/simulator', routes: [
      { to: '/simulator', label: 'Simulator' },
      { to: '/compare', label: 'Comparison' },
      { to: '/analytics', label: 'Analytics' }
  ]},
  { id: 'memory', label: 'Memory Management', icon: Database, basePath: '/memory-simulator', routes: [
      { to: '/memory-simulator', label: 'Simulator' },
      { to: '/memory-compare', label: 'Comparison' },
  ]},
  { id: 'page', label: 'Page Replacement', icon: LayoutTemplate, basePath: '/page-replacement', routes: [
      { to: '/page-replacement', label: 'Simulator' },
      { to: '/page-replacement-compare', label: 'Comparison' },
      { to: '/page-replacement-analytics', label: 'Analytics' }
  ]},
  { id: 'deadlock', label: 'Deadlock Handling', icon: ShieldAlert, basePath: '/deadlock', routes: [
      { to: '/deadlock', label: 'Simulator' },
      { to: '/deadlock-compare', label: 'Comparison' },
      { to: '/deadlock-analytics', label: 'Analytics' }
  ]},
  { id: 'disk', label: 'Disk Scheduling', icon: HardDrive, basePath: '/disk', routes: [
      { to: '/disk', label: 'Simulator' },
      { to: '/disk-compare', label: 'Comparison' },
      { to: '/disk-analytics', label: 'Analytics' }
  ]},
  { id: 'sync', label: 'Process Synchronization', icon: RefreshCcw, basePath: '/sync', routes: [
      { to: '/sync', label: 'Simulator' },
      { to: '/sync-compare', label: 'Comparison' },
      { to: '/sync-analytics', label: 'Analytics' }
  ]},
  { id: 'file', label: 'File Allocation', icon: Folder, basePath: '/file', routes: [
      { to: '/file', label: 'Simulator' },
      { to: '/file-compare', label: 'Comparison' },
      { to: '/file-analytics', label: 'Analytics' }
  ]},
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, basePath: '/ai-assistant', routes: [
      { to: '/ai-assistant', label: 'Chat Interface' }
  ]},
]
