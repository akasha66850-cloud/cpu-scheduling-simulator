import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import useAiAssistantStore from '../store/useAiAssistantStore'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuthStore()
  const setShowWelcome = useAiAssistantStore(s => s.setShowWelcome)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [email, setEmail] = useState('')
  
  const [view, setView] = useState('login') // 'login', 'forgot', 'signup'
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    
    if (username.trim() && password.trim()) {
      login({ username })
      setShowWelcome(true)
      navigate('/')
    } else {
      setError('Please enter both username and password.')
    }
  }

  const handleSignup = (e) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim() || !password.trim() || !email.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }
    
    login({ username })
    setShowWelcome(true)
    navigate('/')
  }

  const handleForgot = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setResetSent(true)
    }
  }

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-text-primary px-4 font-sans">
      <div className="w-full max-w-md card p-8 shadow-2xl relative overflow-hidden border border-border">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-glow mb-4">
            <Monitor className="w-6 h-6 text-text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">OSLabX</h1>
          <p className="text-sm text-text-muted mt-1">Operating System Simulator</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            {error && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="w-full btn-primary py-2.5 text-sm font-medium shadow-glow">
              Sign in
            </button>

            <div className="text-center pt-2 flex flex-col gap-3">
              <button 
                type="button" 
                onClick={() => { setView('forgot'); setResetSent(false); setError(''); }} 
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                Forgot password?
              </button>
              <div className="border-t border-border pt-4">
                <span className="text-xs text-text-muted">Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => { setView('signup'); setError(''); }} 
                  className="text-xs font-medium text-accent hover:text-indigo-400 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </div>
          </form>
        )}
        
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-5 relative z-10">
            <h2 className="text-lg font-medium text-text-primary text-center mb-2">Reset Password</h2>
            
            {resetSent ? (
              <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                Reset link sent! Please check your email.
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted text-center mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-base border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-2.5 text-sm font-medium">
                  Send reset link
                </button>
              </>
            )}

            <div className="text-center pt-4 border-t border-border mt-6">
              <button 
                type="button" 
                onClick={() => setView('login')} 
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                &larr; Back to sign in
              </button>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            {error && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Confirm Password</label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full bg-base border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Confirm password"
              />
            </div>

            <button type="submit" className="w-full btn-primary py-2.5 text-sm font-medium shadow-glow mt-2">
              Create Account
            </button>

            <div className="text-center pt-4 border-t border-border mt-4">
              <span className="text-xs text-text-muted">Already have an account? </span>
              <button 
                type="button" 
                onClick={() => { setView('login'); setError(''); }} 
                className="text-xs font-medium text-accent hover:text-indigo-400 transition-colors"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
