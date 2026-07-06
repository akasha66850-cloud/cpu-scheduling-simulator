import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSettingsStore from '../store/useSettingsStore'

export default function useKeyboardShortcuts({ onRun, onClear, onSave, onNext, onPrev }) {
  const { shortcutsEnabled, shortcutRunSim, shortcutClearAll,
          shortcutSaveSim, shortcutNextStep, shortcutPrevStep, shortcutToggleTheme, theme, setTheme } = useSettingsStore()

  useEffect(() => {
    if (!shortcutsEnabled) return
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      switch(e.key.toLowerCase()) {
        case shortcutRunSim.toLowerCase(): onRun?.(); break
        case shortcutClearAll.toLowerCase(): onClear?.(); break
        case shortcutSaveSim.toLowerCase(): onSave?.(); break
        case shortcutNextStep.toLowerCase(): onNext?.(); break
        case shortcutPrevStep.toLowerCase(): onPrev?.(); break
        case shortcutToggleTheme.toLowerCase(): 
          setTheme(theme === 'dark' ? 'light' : 'dark')
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcutsEnabled, onRun, onClear, onSave, onNext, onPrev, theme, setTheme,
      shortcutRunSim, shortcutClearAll, shortcutSaveSim, shortcutNextStep, shortcutPrevStep, shortcutToggleTheme])
}
