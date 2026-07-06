import React from 'react'
import useSettingsStore from '../store/useSettingsStore'
import { useLocation } from 'react-router-dom'

export default function ShortcutBar() {
  const { showKeyboardShortcutBar, shortcutsEnabled } = useSettingsStore()
  const location = useLocation()

  // Only show on simulator pages, not on login/dashboard/settings
  const isSimulatorPage = ['/simulator', '/memory-simulator', '/page-replacement', '/deadlock', '/disk', '/sync', '/file']
    .some(path => location.pathname.includes(path))

  if (!showKeyboardShortcutBar || !shortcutsEnabled || !isSimulatorPage) return null

  const shortcuts = [
    { key: 'R', label: 'Run' },
    { key: 'C', label: 'Clear' },
    { key: 'S', label: 'Save' },
    { key: '→', label: 'Next step' },
    { key: '←', label: 'Prev step' },
    { key: '?', label: 'Help' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 28,
      background: '#0f1117', borderTop: '1px solid #1e2535',
      display: 'flex', alignItems: 'center', paddingLeft: 230,
      gap: 16, zIndex: 100
    }}>
      {shortcuts.map(s => (
        <span key={s.key} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#475569' }}>
          <kbd style={{ padding:'1px 5px', borderRadius:4, border:'1px solid #1e2535',
            background:'#161b27', color:'#94a3b8', fontSize:10, fontFamily:'monospace' }}>
            {s.key}
          </kbd>
          {s.label}
        </span>
      ))}
    </div>
  )
}
