import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { Cpu, Database, LayoutTemplate, ShieldAlert, HardDrive, RefreshCcw, Folder, Home as HomeIcon, Sparkles } from 'lucide-react'
import MemorySimulator from '@/pages/MemorySimulator'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import ProtectedRoute from '@/components/ProtectedRoute'
import AiAssistant from '@/components/aiAssistant'
import ShortcutBar from '@/components/ShortcutBar'
import ModuleTabs from '@/components/ModuleTabs'
import useSchedulerStore from '@/store/useSchedulerStore'
import useSettingsStore from '@/store/useSettingsStore'
import { MotionGlobalConfig } from 'framer-motion'

// Lazy-load heavy pages
const Settings = lazy(() => import('@/pages/Settings'))
const Simulator = lazy(() => import('@/pages/Simulator'))
const Comparison = lazy(() => import('@/pages/Comparison'))
const MemoryComparison = lazy(() => import('@/pages/MemoryComparison'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const PageReplacementSimulator = lazy(() => import('@/pages/PageReplacementSimulator'))
const PageReplacementComparison = lazy(() => import('@/pages/PageReplacementComparison'))
const PageReplacementAnalytics = lazy(() => import('@/pages/PageReplacementAnalytics'))
const DeadlockSimulator = lazy(() => import('@/pages/DeadlockSimulator'))
const DeadlockComparison = lazy(() => import('@/pages/DeadlockComparison'))
const DeadlockAnalytics = lazy(() => import('@/pages/DeadlockAnalytics'))
const DiskSimulator = lazy(() => import('@/pages/DiskSimulator'))
const DiskComparison = lazy(() => import('@/pages/DiskComparison'))
const DiskAnalytics = lazy(() => import('@/pages/DiskAnalytics'))
const SyncSimulator = lazy(() => import('@/pages/SyncSimulator'))
const SyncComparison = lazy(() => import('@/pages/SyncComparison'))
const SyncAnalytics = lazy(() => import('@/pages/SyncAnalytics'))
const FileSimulator = lazy(() => import('@/pages/file/FileSimulator'))
const FileComparison = lazy(() => import('@/pages/file/FileComparison'))
const FileAnalytics = lazy(() => import('@/pages/file/FileAnalytics'))
const AiAssistantPage = lazy(() => import('@/pages/AiAssistantPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ThemeApplier() {
  const { theme, accentColor } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    // Apply theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else {
      root.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    // Apply accent color as CSS variable
    root.style.setProperty('--accent', accentColor)
    // Derive hover shade (slightly lighter)
    root.style.setProperty('--accent-hover', accentColor + 'dd')
  }, [theme, accentColor])

  const animationsEnabled = useSettingsStore(s => s.animationsEnabled)
  useEffect(() => {
    MotionGlobalConfig.skipAnimations = !animationsEnabled
  }, [animationsEnabled])

  return null
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeApplier />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-base text-text-primary overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 md:ml-[220px]">
          <AppTopbar />
          <ModuleTabs />
          
          <main className="flex-1 overflow-y-auto relative custom-scrollbar p-[20px]">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/memory-simulator" element={<MemorySimulator />} />
                <Route path="/compare" element={<Comparison />} />
                <Route path="/memory-compare" element={<MemoryComparison />} />
                <Route path="/page-replacement" element={<PageReplacementSimulator />} />
                <Route path="/page-replacement-compare" element={<PageReplacementComparison />} />
                <Route path="/page-replacement-analytics" element={<PageReplacementAnalytics />} />
                <Route path="/deadlock" element={<DeadlockSimulator />} />
                <Route path="/deadlock-compare" element={<DeadlockComparison />} />
                <Route path="/deadlock-analytics" element={<DeadlockAnalytics />} />
                <Route path="/disk" element={<DiskSimulator />} />
                <Route path="/disk-compare" element={<DiskComparison />} />
                <Route path="/disk-analytics" element={<DiskAnalytics />} />
                <Route path="/sync" element={<SyncSimulator />} />
                <Route path="/sync-compare" element={<SyncComparison />} />
                <Route path="/sync-analytics" element={<SyncAnalytics />} />
                <Route path="/file" element={<FileSimulator />} />
                <Route path="/file-compare" element={<FileComparison />} />
                <Route path="/file-analytics" element={<FileAnalytics />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ai-assistant" element={<AiAssistantPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        <AiAssistant />
        <ShortcutBar />
      </div>
  )
}

function AppTopbar() {
  const location = useLocation()
  
  let title = 'Dashboard'
  let icon = HomeIcon
  let modNum = null

  if (location.pathname.includes('simulator') || location.pathname.includes('compare') || location.pathname === '/analytics') {
    if (location.pathname.includes('memory')) { title = 'Memory Management'; icon = Database; modNum = 2; }
    else if (location.pathname.includes('page-replacement')) { title = 'Page Replacement'; icon = LayoutTemplate; modNum = 3; }
    else if (location.pathname.includes('deadlock')) { title = 'Deadlock Handling'; icon = ShieldAlert; modNum = 4; }
    else if (location.pathname.includes('disk')) { title = 'Disk Scheduling'; icon = HardDrive; modNum = 5; }
    else if (location.pathname.includes('sync')) { title = 'Process Synchronization'; icon = RefreshCcw; modNum = 6; }
    else if (location.pathname.includes('file')) { title = 'File Allocation'; icon = Folder; modNum = 7; }
    else if (location.pathname.includes('ai-assistant')) { title = 'AI Assistant'; icon = Sparkles; modNum = null; }
    else { title = 'CPU Scheduling'; icon = Cpu; modNum = 1; }
  }

  return <Topbar title={title} icon={icon} moduleNumber={modNum} />
}
