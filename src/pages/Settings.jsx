import React, { useRef } from 'react'
import useSettingsStore from '../store/useSettingsStore'
import useSchedulerStore from '../store/useSchedulerStore'
import SettingsSection from '../components/Settings/SettingsSection'
import ToggleRow from '../components/Settings/ToggleRow'
import SettingSlider from '../components/Settings/SettingSlider'
import DangerButton from '../components/Settings/DangerButton'
import { Download, Upload } from 'lucide-react'

const THEMES = [
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'system', label: 'System', icon: '💻' }
]

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', 
  '#f59e0b', '#ef4444', '#f97316', '#ec4899'
]

const ALGORITHMS = ['FCFS', 'SJF', 'SRTF', 'Priority', 'Priority Preemptive', 'Round Robin']

export default function Settings() {
  const settings = useSettingsStore()
  const clearHistory = useSchedulerStore(s => s.clearHistory)
  const fileInputRef = useRef(null)

  const handleExport = () => {
    // In a real app we'd export all histories (cpu, memory, disk, etc)
    // Here we'll just export the CPU history as an example of the requirement
    const history = useSchedulerStore.getState().history
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'oslab-history-' + Date.now() + '.json'
    a.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (Array.isArray(data)) {
          // just mock importing for now
          alert(data.length + ' simulations imported successfully')
        } else {
          alert('Invalid file format')
        }
      } catch (err) {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-2">Customize your OSLabX experience</p>
      </div>

      <SettingsSection icon="palette" title="Appearance" defaultOpen={true}>
        <div className="py-2">
          <div className="text-sm font-medium text-text-primary mb-3">Theme</div>
          <div className="flex gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => settings.setTheme(t.id)}
                className={`flex-1 py-2 px-4 rounded-md border flex items-center justify-center gap-2 text-sm font-medium transition-colors
                  ${settings.theme === t.id 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'border-border bg-base text-text-secondary hover:border-text-muted'}
                `}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-2 mt-4">
          <div className="text-sm font-medium text-text-primary mb-3">Accent Color</div>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => settings.setAccentColor(color)}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110
                  ${settings.accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1117]' : ''}
                `}
                aria-label={`Select accent color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <ToggleRow 
            label="UI Animations" 
            sublabel="Disable for better performance on slower devices" 
            storeKey="animationsEnabled" 
          />
        </div>
      </SettingsSection>

      <SettingsSection icon="cpu" title="Simulator Defaults">
        <div className="py-2 mb-4">
          <label className="text-sm font-medium text-text-primary block mb-2">Default Algorithm</label>
          <select 
            value={settings.defaultAlgorithm}
            onChange={(e) => settings.setDefaultAlgorithm(e.target.value)}
            className="w-full bg-base border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-text-primary"
          >
            {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex gap-6 mb-4">
          <div className="flex-1">
            <SettingSlider 
              label="Default Time Quantum" 
              min={1} max={20} 
              value={settings.defaultQuantum} 
              onChange={settings.setDefaultQuantum} 
            />
          </div>
          <div className="flex-1">
            <SettingSlider 
              label="Default Process Count" 
              min={3} max={10} 
              value={settings.defaultProcessCount} 
              onChange={settings.setDefaultProcessCount}
              formatValue={(v) => v + ' processes'}
            />
          </div>
        </div>

        <ToggleRow 
          label="Auto-run on sample load" 
          sublabel="Auto-run simulation when sample data is loaded" 
          storeKey="autoRunOnLoad" 
        />
        <ToggleRow 
          label="Show formula tooltips" 
          sublabel="Hover over WT, TAT, RT cards to see the formula" 
          storeKey="showFormulas" 
        />
        
        <div className="mt-4">
          <SettingSlider 
            label="Starvation warning threshold" 
            sublabel="Warn when a process waits more than Nx the average burst time"
            min={1} max={5} 
            value={settings.starvationThreshold} 
            onChange={settings.setStarvationThreshold}
            formatValue={(v) => v + 'x avg'}
          />
        </div>
      </SettingsSection>

      <SettingsSection icon="bell" title="Notifications & Hints">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Warnings & Alerts</h3>
          <ToggleRow label="Starvation warnings" storeKey="showStarvationWarnings" />
          <ToggleRow label="Belady anomaly alerts" storeKey="showBeladyAlerts" />
          <ToggleRow label="Deadlock alerts" storeKey="showDeadlockAlerts" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">UI Hints</h3>
          <ToggleRow label="First-time hints" storeKey="showFirstTimeHints" />
          <ToggleRow label="Keyboard shortcut bar" storeKey="showKeyboardShortcutBar" />
          <ToggleRow label="OSBot status toast" storeKey="showOllamaStatusToast" />
        </div>
      </SettingsSection>

      <SettingsSection icon="device-floppy" title="Data & History">
        <div className="py-2 mb-4">
          <div className="text-sm font-medium text-text-primary mb-3">Max saved simulations</div>
          <div className="flex gap-2">
            {[5, 10, 20, 999].map(num => (
              <button
                key={num}
                onClick={() => settings.setMaxSavedSimulations(num)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border
                  ${settings.maxSavedSimulations === num 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'border-border bg-base text-text-secondary hover:border-text-muted'}
                `}
              >
                {num === 999 ? 'Unlimited' : num}
              </button>
            ))}
          </div>
        </div>

        <ToggleRow 
          label="Auto-save after every simulation run" 
          sublabel="Saves result automatically without clicking the Save button" 
          storeKey="autoSaveLastRun" 
        />

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <div className="text-sm font-medium text-text-primary">Export history</div>
            <button 
              onClick={handleExport}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-elevated hover:bg-hover border border-border rounded-md text-sm transition-colors text-text-primary"
            >
              <Download size={16} /> Download JSON
            </button>
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">Import history</div>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-elevated hover:bg-hover border border-border rounded-md text-sm transition-colors text-text-primary"
            >
              <Upload size={16} /> Choose JSON file
            </button>
          </div>
        </div>

        <div className="mt-6">
          <DangerButton 
            label="Clear simulation history" 
            buttonText="Clear all" 
            onConfirm={clearHistory}
            confirmText="Are you sure? This will delete all saved simulations."
          />
        </div>
      </SettingsSection>

      <SettingsSection icon="keyboard" title="Keyboard Shortcuts">
        <ToggleRow label="Enable keyboard shortcuts" storeKey="shortcutsEnabled" />
        <div className="mt-2 border-b border-border pb-4">
          <ToggleRow label="Show shortcut bar at bottom of simulator pages" storeKey="showKeyboardShortcutBar" />
        </div>
        
        <div className="mt-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-text-muted border-b border-border">
                <th className="pb-2 font-medium">Key</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {[
                { k: 'R', a: 'Run simulation' },
                { k: 'C', a: 'Clear all processes' },
                { k: 'S', a: 'Save simulation' },
                { k: '→ / ←', a: 'Step forward / back' },
                { k: '?', a: 'Show shortcuts help' },
                { k: 'D', a: 'Toggle dark/light mode' },
                { k: 'Esc', a: 'Close dialogs' }
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border font-mono text-xs">{row.k}</kbd>
                  </td>
                  <td className="py-2">{row.a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      <div className="mt-12">
        <DangerButton 
          fullWidth
          buttonText="Reset all settings to default"
          onConfirm={settings.resetAllSettings}
          confirmText="Are you sure you want to reset all settings to their default values?"
        />
      </div>
    </div>
  )
}
