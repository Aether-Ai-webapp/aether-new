'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useAetherStore } from '@/lib/aether-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AuthDrawer() {
  const { showAuthModal, setShowAuthModal, login, signup } = useAetherStore()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [isLoading, setIsLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setIsLoading(false)
  }

  const handleClose = () => {
    setShowAuthModal(false)
    setTimeout(resetForm, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in email and password')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const success = mode === 'login'
        ? await login(email.trim(), password)
        : await signup(email.trim(), password, name.trim())

      if (success) {
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
        handleClose()
      } else {
        toast.error(mode === 'login' ? 'Invalid email or password' : 'Signup failed. Email may already be in use.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'signup' && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        autoFocus
        className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-10 font-medium text-sm transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          mode === 'login' ? 'Sign In' : 'Create Account'
        )}
      </button>
    </form>
  )

  const modeSwitch = (
    <div className="mt-6 text-center">
      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        disabled={isLoading}
      >
        {mode === 'login' ? 'Sign up' : 'Sign in'}
      </button>
    </div>
  )

  const closeButton = (
    <button
      onClick={handleClose}
      className="size-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
    >
      <X className="size-4" />
    </button>
  )

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {isMobile ? (
            /* ── Mobile: Bottom slide-up drawer ──────────────────────── */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-zinc-200 mx-auto mb-4" />

              {/* Close button */}
              <div className="flex justify-end mb-2">
                {closeButton}
              </div>

              {formContent}
              {modeSwitch}
            </motion.div>
          ) : (
            /* ── Desktop: Centered modal ─────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={handleClose}
            >
              <div
                className="relative w-full max-w-sm bg-white border border-black/[0.04] shadow-[0_8px_40px_rgb(0,0,0,0.03)] rounded-2xl p-12"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <div className="absolute top-4 right-4">
                  {closeButton}
                </div>

                {formContent}
                {modeSwitch}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
