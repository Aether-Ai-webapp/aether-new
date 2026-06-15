'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAetherStore, type Memory, type MemoryType } from '@/lib/aether-store'
import { formatDistanceToNow } from 'date-fns'
import {
  Sparkles,
  Brain,
  Mic,
  MicOff,
  Send,
  X,
  ArrowRight,
  Check,
  Zap,
  Volume2,
  Layers,
  Loader2,
  Link2,
  FileText,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ChevronRight,
  Download,
  Trash2,
  Eye,
  LogOut,
  LogIn,
  Home as HomeIcon,
  Search,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════
// ─── MOBILE DETECTION HOOK ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ═══════════════════════════════════════════════════════════════════════
// ─── HELPERS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function detectContentType(text: string): 'link' | 'task' | 'note' {
  const lower = text.toLowerCase()
  if (/https?:\/\//.test(lower) || /\bwww\./.test(lower)) return 'link'
  if (/\b(todo|remind|need to|buy|must)\b/.test(lower)) return 'task'
  return 'note'
}

function mapToMemoryType(detected: 'link' | 'task' | 'note'): MemoryType {
  if (detected === 'link') return 'link'
  return 'text'
}

const typeIconMap: Record<string, React.ElementType> = {
  link: Link2,
  task: CheckCircle2,
  note: FileText,
  voice: Volume2,
  image: ImageIcon,
}

function downloadMemoryAsMarkdown(memory: Memory) {
  const lines: string[] = []
  lines.push(`# ${memory.title || 'Untitled Memory'}`)
  lines.push('')
  lines.push(`**Type:** ${memory.type}`)
  lines.push(`**Created:** ${new Date(memory.createdAt).toLocaleString()}`)
  if (memory.tags.length > 0) {
    lines.push(`**Tags:** ${memory.tags.join(', ')}`)
  }
  if (memory.sourceUrl) {
    lines.push(`**Source:** ${memory.sourceUrl}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  if (memory.summary) {
    lines.push('## AI Summary')
    lines.push('')
    lines.push(memory.summary)
    lines.push('')
  }

  if (memory.deepInsight || memory.recap) {
    lines.push('## Cognitive Insight')
    lines.push('')
    lines.push(memory.deepInsight || memory.recap || '')
    lines.push('')
  }

  lines.push('## Original Content')
  lines.push('')
  lines.push(memory.content)
  lines.push('')

  const markdown = lines.join('\n')
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(memory.title || 'memory').slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════════
// ─── ANIMATION VARIANTS ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ═══════════════════════════════════════════════════════════════════════
// ─── TYPING ANIMATION DATA ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const DEMO_THOUGHTS = [
  'The best products are the ones that disappear into your workflow...',
  'What if memory was as fluid as thought itself?',
  'Every great idea starts as a fragment before it becomes a system...',
]

const DEMO_SUMMARIES = [
  'Products that seamlessly integrate into existing habits become invisible infrastructure. The highest compliment for a tool is when users forget it is there.',
  'Memory systems should mirror the associative, non-linear nature of human cognition rather than forcing rigid hierarchies. Fluidity enables recall.',
  'Innovation follows a consistent arc: scattered observations crystallize into coherent frameworks. The fragment is the seed of every breakthrough.',
]

// ═══════════════════════════════════════════════════════════════════════
// ─── INTERACTIVE DEMO COMPONENT ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function InteractiveDemo() {
  const [phase, setPhase] = useState<'typing' | 'morphing' | 'result'>('typing')
  const [displayText, setDisplayText] = useState('')
  const [currentThoughtIdx, setCurrentThoughtIdx] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentThought = DEMO_THOUGHTS[currentThoughtIdx]
  const currentSummary = DEMO_SUMMARIES[currentThoughtIdx]

  const runCycle = useCallback(() => {
    setPhase('typing')
    setDisplayText('')
    setShowSummary(false)

    let charIndex = 0
    const typeInterval = setInterval(() => {
      if (charIndex < currentThought.length) {
        setDisplayText(currentThought.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typeInterval)
        timerRef.current = setTimeout(() => {
          setPhase('morphing')
          timerRef.current = setTimeout(() => {
            setPhase('result')
            setShowSummary(true)
            timerRef.current = setTimeout(() => {
              setCurrentThoughtIdx((prev) => (prev + 1) % DEMO_THOUGHTS.length)
            }, 4000)
          }, 800)
        }, 1200)
      }
    }, 45)

    return () => {
      clearInterval(typeInterval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentThought])

  useEffect(() => {
    const cleanup = runCycle()
    return cleanup
  }, [currentThoughtIdx, runCycle])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="relative bg-white rounded-2xl border border-black/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.04]">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-400/70" />
            <div className="size-2.5 rounded-full bg-yellow-400/70" />
            <div className="size-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] text-gray-300 font-medium tracking-wide">AETHER</span>
          </div>
          <div className="w-[54px]" />
        </div>

        <div className="p-5 min-h-[220px] flex flex-col">
          <div className="bg-white/80 border border-black/[0.04] shadow-sm backdrop-blur-xl rounded-2xl p-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl flex items-center justify-center text-gray-300">
                <Mic className="size-4" />
              </div>
              <div className="flex-1 text-sm text-gray-800 min-h-[28px] flex items-center">
                {displayText}
                {phase === 'typing' && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block w-[2px] h-4 bg-purple-500 ml-0.5"
                  />
                )}
              </div>
              <div className={cn(
                'size-8 rounded-xl flex items-center justify-center transition-all',
                displayText ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
              )}>
                <Send className="size-3.5" />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'result' && showSummary && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gray-50/80 border border-black/[0.03] rounded-xl p-4"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="size-3 text-purple-500" />
                  <span className="text-[11px] font-medium text-purple-500 tracking-wide">AI SUMMARY</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentSummary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {phase !== 'result' && <div className="flex-1" />}
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── CARD AUTH FORM (EMBEDDED IN PRICING CARDS) ──────────────────────
// ═══════════════════════════════════════════════════════════════════════

function CardAuthForm({ mode, onSuccess }: { mode: 'signup' | 'premium'; onSuccess: () => void }) {
  const { signup } = useAetherStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in email and password')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const success = await signup(email.trim(), password, email.trim().split('@')[0])
      if (success) {
        toast.success('Welcome to Aether!')
        onSuccess()
      } else {
        toast.error('Signup failed. Email may already be in use.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        className="w-full border border-black/[0.06] focus:border-purple-400 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors disabled:opacity-50"
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className="w-full border border-black/[0.06] focus:border-purple-400 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-lg h-10 font-medium text-sm transition-all',
          mode === 'premium'
            ? 'bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white'
            : 'bg-gray-900 hover:bg-gray-800 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : mode === 'premium' ? (
          <>
            Unlock Premium Sanctuary
            <ArrowRight className="size-3.5" />
          </>
        ) : (
          'Create Free Account'
        )}
      </button>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── SIGN IN DIALOG ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAetherStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in email and password')
      return
    }

    setIsLoading(true)
    try {
      const success = await login(email.trim(), password)
      if (success) {
        toast.success('Welcome back!')
        onClose()
      } else {
        toast.error('Invalid email or password')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-8 z-50 w-80 bg-white border border-black/[0.04] shadow-[0_16px_48px_rgba(0,0,0,0.08)] rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Sign In</h3>
              <button
                onClick={onClose}
                className="size-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full border border-black/[0.06] focus:border-purple-400 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors disabled:opacity-50"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full border border-black/[0.06] focus:border-purple-400 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MOBILE AUTH DRAWER ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function MobileAuthDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, signup } = useAetherStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setIsLoading(false)
  }

  const handleClose = () => {
    onClose()
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-200 mx-auto mb-4" />
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClose}
                className="size-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  'w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 font-medium text-sm transition-colors',
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

            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                disabled={isLoading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── DESKTOP LANDING PAGE ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function LandingPage({ onSkipToDashboard }: { onSkipToDashboard: () => void }) {
  const [showSignIn, setShowSignIn] = useState(false)
  const handleAuthSuccess = useCallback(() => {
    // Auth success is handled by the store; Home will switch to Dashboard
  }, [])

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col relative overflow-hidden">
      {/* Background ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-100/40 blur-3xl animate-ambient-drift" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-rose-100/30 blur-3xl animate-ambient-drift-alt" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-amber-100/20 blur-3xl animate-ambient-drift" />
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Aether</span>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white/60 border border-transparent hover:border-black/[0.06] transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Section 1: The Purpose Hero */}
      <section className="flex-1 flex items-center justify-center pt-24 pb-16 px-6 relative">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div variants={staggerChild} className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100/60">
              <Sparkles className="size-3 text-purple-500" />
              <span className="text-[11px] font-medium text-purple-600 tracking-wide">COGNITIVE SANCTUARY</span>
            </div>
          </motion.div>

          <motion.h1
            variants={staggerChild}
            className="text-4xl sm:text-5xl md:text-[56px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6"
          >
            A sanctuary for thoughts{' '}
            <span className="bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
              that move too fast.
            </span>
          </motion.h1>

          <motion.p
            variants={staggerChild}
            className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl mx-auto"
          >
            An elite cognitive workspace built to capture raw spoken audio, code logic, images, and links. Zero clutter. Total structural recall.
          </motion.p>

          <motion.div variants={staggerChild} className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('pricing')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 h-11 font-medium text-sm transition-colors"
              >
                Get Started
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => setShowSignIn(true)}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 rounded-xl px-6 h-11 font-medium text-sm hover:bg-white/60 border border-black/[0.06] transition-all"
              >
                Sign In
              </button>
            </div>
            <button
              onClick={onSkipToDashboard}
              className="text-xs text-gray-400 hover:text-purple-500 transition-colors underline underline-offset-4"
            >
              Try without an account →
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: The Living Interactive Demo */}
      <section className="py-16 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={staggerChild} className="text-center mb-10">
            <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">See it in action</span>
          </motion.div>
          <InteractiveDemo />
        </motion.div>
      </section>

      {/* Section 3: Asymmetric Pricing & Registration Matrix */}
      <section id="pricing" className="py-20 px-6 pb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={staggerChild} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-3">
              Begin your cognitive journey
            </h2>
            <p className="text-sm text-gray-400">No credit card required. Start thinking freely.</p>
          </motion.div>

          <motion.div variants={staggerChild} className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Left Card: Ambient Free Tier */}
            <div className="bg-white border border-black/[0.06] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-6">
                <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">Ambient</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-semibold text-gray-900">$0.00</span>
                <span className="text-sm text-gray-400">/ Free</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                15 Cognitive Captures per month, standard voice dictation, and basic timeline indexing.
              </p>
              <ul className="space-y-2.5 mb-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-3.5 text-green-500 shrink-0" />
                  15 captures / month
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-3.5 text-green-500 shrink-0" />
                  Text & link capture
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-3.5 text-green-500 shrink-0" />
                  AI summaries
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="size-3.5 text-green-500 shrink-0" />
                  Local timeline indexing
                </li>
              </ul>
              <div className="mt-6 pt-5 border-t border-black/[0.04]">
                <label className="text-[11px] font-medium text-gray-400 tracking-widest uppercase block mb-3">
                  Create Free Account
                </label>
                <CardAuthForm mode="signup" onSuccess={handleAuthSuccess} />
              </div>
            </div>

            {/* Right Card: Ascent Premium Tier */}
            <div className="relative bg-white rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <div className="absolute inset-0 rounded-2xl p-[2px] animate-gradient-border bg-[length:200%_200%] bg-gradient-to-r from-purple-500 via-rose-400 to-purple-600">
                <div className="w-full h-full bg-white rounded-[14px]" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-medium text-purple-500 tracking-widest uppercase">Ascent</span>
                  <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/60">
                    PREMIUM
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-semibold text-gray-900">$5.99</span>
                  <span className="text-sm text-gray-400">/ month</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  Infinite Cognitive Scale, sub-second Groq voice pipelines, deep Gemini insights, and autonomous 10-memory auto-collection grouping.
                </p>
                <ul className="space-y-2.5 mb-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="size-3.5 text-purple-500 shrink-0" />
                    Unlimited captures
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Volume2 className="size-3.5 text-purple-500 shrink-0" />
                    Sub-second Groq voice processing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Brain className="size-3.5 text-purple-500 shrink-0" />
                    Deep cognitive insights
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers className="size-3.5 text-purple-500 shrink-0" />
                    Auto-clustering collections
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="size-3.5 text-purple-500 shrink-0" />
                    Priority AI synthesis
                  </li>
                </ul>
                <div className="mt-6 pt-5 border-t border-black/[0.04]">
                  <label className="text-[11px] font-medium text-gray-400 tracking-widest uppercase block mb-3">
                    Unlock Premium Sanctuary
                  </label>
                  <CardAuthForm mode="premium" onSuccess={handleAuthSuccess} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-black/[0.03]">
        <p className="text-xs text-gray-400">Aether &mdash; Your cognitive sanctuary</p>
      </footer>

      {/* Sign In Dialog */}
      <SignInDialog open={showSignIn} onClose={() => setShowSignIn(false)} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── INSPECTION DRAWER ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function InspectionDrawer({
  memory,
  open,
  onClose,
  onPurge,
  onDownload,
}: {
  memory: Memory | null
  open: boolean
  onClose: () => void
  onPurge: (id: string) => void
  onDownload: (memory: Memory) => void
}) {
  const [confirmPurge, setConfirmPurge] = useState(false)

  // Reset confirm state when drawer closes
  const handleClose = useCallback(() => {
    setConfirmPurge(false)
    onClose()
  }, [onClose])

  if (!memory) return null

  const handlePurgeClick = () => {
    if (!confirmPurge) {
      setConfirmPurge(true)
      return
    }
    onPurge(memory.id)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white border-l border-zinc-200 p-6 sm:p-8 shadow-2xl z-50 overflow-y-auto"
        >
          {/* Close button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-500 tracking-wide uppercase">Inspection</span>
            </div>
            <button
              onClick={handleClose}
              className="size-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* AI Summary */}
          {memory.summary && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="size-3 text-purple-500" />
                <span className="text-[11px] font-medium text-purple-500 tracking-wide uppercase">AI Summary</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{memory.summary}</p>
            </div>
          )}

          {/* Raw Original Content */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="size-3 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Original Content</span>
            </div>
            <div className="bg-gray-50 border border-black/[0.04] rounded-xl p-4 max-h-60 overflow-y-auto">
              {memory.imageUrl && (
                <img
                  src={memory.imageUrl}
                  alt="Memory image"
                  className="w-full rounded-lg mb-3 max-h-40 object-cover"
                />
              )}
              {memory.imagePreview && !memory.imageUrl && (
                <img
                  src={memory.imagePreview}
                  alt="Memory image preview"
                  className="w-full rounded-lg mb-3 max-h-40 object-cover"
                />
              )}
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{memory.content}</p>
            </div>
          </div>

          {/* Source URL */}
          {memory.sourceUrl && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 className="size-3 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Source</span>
              </div>
              <a
                href={memory.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:text-purple-800 underline break-all"
              >
                {memory.sourceUrl}
              </a>
            </div>
          )}

          {/* Deep Cognitive Insight */}
          {(memory.deepInsight || memory.recap) && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="size-3 text-purple-500" />
                <span className="text-[11px] font-medium text-purple-500 tracking-wide uppercase">Deep Insight</span>
              </div>
              <div className="bg-purple-50/50 border border-purple-100/60 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{memory.deepInsight || memory.recap}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="size-3 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mb-8">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="size-3 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Metadata</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Type: {memory.type}</p>
              <p>Created: {new Date(memory.createdAt).toLocaleString()}</p>
              {memory.collections && memory.collections.length > 0 && (
                <p>Collections: {memory.collections.map((c) => c.name).join(', ')}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <button
              onClick={() => onDownload(memory)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 font-medium text-sm transition-colors"
            >
              <Download className="size-4" />
              Download Markdown Asset
            </button>
            <button
              onClick={handlePurgeClick}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl h-11 font-medium text-sm transition-colors',
                confirmPurge
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              )}
            >
              <Trash2 className="size-4" />
              {confirmPurge ? 'Confirm Purge Asset' : 'Purge Asset'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MEMORY CARD ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function MemoryCard({
  memory,
  onClick,
}: {
  memory: Memory
  onClick: () => void
}) {
  const TypeIcon = typeIconMap[memory.type] || typeIconMap.note

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="w-full text-left bg-white border border-black/[0.04] rounded-xl p-4 hover:shadow-md hover:border-purple-200/40 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
          <TypeIcon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium truncate leading-tight mb-1">
            {memory.title || 'Untitled'}
          </p>
          {memory.summary && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-1.5">
              {memory.summary}
            </p>
          )}
          {!memory.summary && memory.content && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-1.5">
              {memory.content.slice(0, 120)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
            </span>
            {memory.tags.length > 0 && (
              <div className="flex gap-1">
                {memory.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="size-4 text-gray-300 group-hover:text-purple-400 shrink-0 mt-1 transition-colors" />
      </div>
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── DASHBOARD VIEW ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function DashboardView() {
  const {
    memories,
    addMemory,
    deleteMemory,
    deleteMemoryFromDB,
    isLoading,
    isAuthenticated,
    fetchMemories,
  } = useAetherStore()

  const isMobile = useIsMobile()

  // Capture state
  const [captureText, setCaptureText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showCaptureAnimation, setShowCaptureAnimation] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Image upload state
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inspection drawer state
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Auth modal state (for mobile)
  const [showMobileAuth, setShowMobileAuth] = useState(false)

  // Input ref
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch memories on mount
  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  // Sorted memories
  const sortedMemories = useMemo(() => {
    if (!Array.isArray(memories)) return []
    return [...memories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [memories])

  // ── AUTH GATE FOR CAPTURE (soft gate - guest mode allowed) ──────────
  const gateCapture = useCallback((): boolean => {
    if (!isAuthenticated) {
      if (isMobile) {
        setShowMobileAuth(true)
        return false
      }
      // Desktop: allow guest mode with a soft reminder
      toast.info('Sign in to sync memories across devices', { duration: 3000 })
    }
    return true
  }, [isAuthenticated, isMobile])

  // ── UNIVERSAL CAPTURE SUBMIT ───────────────────────────────────────
  const handleCaptureSubmit = useCallback(async () => {
    if (!gateCapture()) return

    const text = captureText.trim()
    const image = imagePreview

    if (!text && !image) return

    setIsSaving(true)
    setShowCaptureAnimation(true)

    try {
      const formData = new FormData()

      if (text.trim()) {
        formData.append('text', text.trim())
      }

      if (image?.file) {
        formData.append('image', image.file)
        formData.append('type', 'image')
      } else {
        const detected = detectContentType(text || 'note')
        formData.append('type', mapToMemoryType(detected))

        if (detected === 'link') {
          formData.append('url', text.trim())
        }
      }

      const response = await fetch('/api/capture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = (errorData as { error?: string }).error || `Server error: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success && data.memory) {
        const newMemory = data.memory as Memory
        addMemory(newMemory)
      }

      setCaptureText('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)

      toast.success('Memory captured')
    } catch (error) {
      console.error('[Dashboard] Capture failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to save — please try again'
      toast.error(message)
    } finally {
      setIsSaving(false)
      setTimeout(() => setShowCaptureAnimation(false), 300)
    }
  }, [captureText, imagePreview, addMemory, gateCapture])

  // ── VOICE RECORDING ────────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (!gateCapture()) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, gateCapture])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setIsTranscribing(true)

        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          formData.append('type', 'voice')

          const currentText = captureText.trim()
          if (currentText) {
            formData.append('text', currentText)
          }

          const response = await fetch('/api/capture', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.memory) {
              addMemory(data.memory as Memory)
            }
            setCaptureText('')
            setImagePreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            toast.success('Voice memory captured')
          } else {
            toast.error('Voice capture failed')
          }
        } catch {
          toast.error('Voice capture failed')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }, [captureText, addMemory])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // ── IMAGE UPLOAD ───────────────────────────────────────────────────
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gateCapture()) return
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Under 10MB')
      return
    }
    const url = URL.createObjectURL(file)
    setImagePreview({ file, url, name: file.name })
  }, [gateCapture])

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [imagePreview])

  // ── INSPECTION DRAWER ──────────────────────────────────────────────
  const openDrawer = useCallback((memory: Memory) => {
    setSelectedMemory(memory)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedMemory(null), 300)
  }, [])

  // ── PURGE MEMORY ───────────────────────────────────────────────────
  const handlePurge = useCallback(async (id: string) => {
    try {
      await fetch(`/api/capture?id=${id}`, { method: 'DELETE' })
    } catch {
      // Fallback: try the store's delete method
    }
    try {
      await deleteMemoryFromDB(id)
    } catch {
      // Continue anyway
    }
    deleteMemory(id)
    closeDrawer()
    toast.success('Memory purged')
  }, [deleteMemory, deleteMemoryFromDB, closeDrawer])

  // ── DOWNLOAD MARKDOWN ──────────────────────────────────────────────
  const handleDownload = useCallback((memory: Memory) => {
    downloadMemoryAsMarkdown(memory)
    toast.success('Downloaded as markdown')
  }, [])

  // ── Keyboard handler ───────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCaptureSubmit()
    }
  }, [handleCaptureSubmit])

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* ── CAPTURE BAR ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className={cn(
          'relative bg-white border border-black/[0.04] shadow-sm rounded-2xl p-2 transition-all duration-300',
          isRecording && 'border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
          showCaptureAnimation && 'animate-capture-fade-up'
        )}>
          {/* Image preview */}
          {imagePreview && (
            <div className="relative mx-2 mb-2 inline-block">
              <img
                src={imagePreview.url}
                alt="Upload preview"
                className="h-20 rounded-lg object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs shadow-sm hover:bg-gray-800"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={isSaving || isTranscribing}
              className={cn(
                'size-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                isRecording
                  ? 'bg-purple-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.3)]'
                  : 'bg-gray-50 text-gray-400 hover:bg-purple-50 hover:text-purple-500'
              )}
            >
              {isTranscribing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : 'Capture a thought, paste a link, or type anything...'}
              disabled={isSaving || isTranscribing}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none min-w-0 disabled:opacity-50"
            />

            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving || isTranscribing}
              className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-50 text-gray-400 hover:bg-purple-50 hover:text-purple-500 transition-all duration-200 disabled:opacity-50"
            >
              <ImageIcon className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Send button */}
            <button
              onClick={handleCaptureSubmit}
              disabled={isSaving || isTranscribing || (!captureText.trim() && !imagePreview)}
              className={cn(
                'size-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                (captureText.trim() || imagePreview)
                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 text-xs text-purple-600"
          >
            <span className="size-2 rounded-full bg-purple-500 animate-pulse" />
            Recording... tap mic to stop
          </motion.div>
        )}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 text-xs text-purple-600"
          >
            <Loader2 className="size-3 animate-spin" />
            Transcribing audio...
          </motion.div>
        )}
      </div>

      {/* ── MEMORY TIMELINE ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {isLoading && sortedMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="size-6 animate-spin mb-3" />
            <p className="text-sm">Loading memories...</p>
          </div>
        ) : sortedMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Brain className="size-8 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500 mb-1">No memories yet</p>
            <p className="text-xs text-gray-400">Capture your first thought above</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {sortedMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onClick={() => openDrawer(memory)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── INSPECTION DRAWER ────────────────────────────────────────── */}
      <InspectionDrawer
        memory={selectedMemory}
        open={drawerOpen}
        onClose={closeDrawer}
        onPurge={handlePurge}
        onDownload={handleDownload}
      />

      {/* ── MOBILE AUTH DRAWER ───────────────────────────────────────── */}
      {isMobile && (
        <MobileAuthDrawer
          open={showMobileAuth}
          onClose={() => setShowMobileAuth(false)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── APP SHELL (NAVIGATION) ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

type AppView = 'dashboard' | 'ask' | 'collections' | 'settings'

const navItems: { view: AppView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: HomeIcon, label: 'Home' },
  { view: 'ask', icon: Search, label: 'Ask' },
  { view: 'collections', icon: Layers, label: 'Collections' },
  { view: 'settings', icon: Settings, label: 'Settings' },
]

function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, setShowAuthModal } = useAetherStore()
  const isMobile = useIsMobile()
  const [currentView, setCurrentView] = useState<AppView>('dashboard')

  const handleSignOut = async () => {
    await logout()
    toast.success('Signed out')
  }

  const views: Record<AppView, React.ReactNode> = {
    dashboard: <DashboardView />,
    ask: <SimpleAskView />,
    collections: <SimpleCollectionsView />,
    settings: <SimpleSettingsView onSignOut={handleSignOut} isAuthenticated={isAuthenticated} onSignIn={() => setShowAuthModal(true)} />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="h-screen fixed left-0 top-0 z-40 w-14 flex flex-col bg-white/50 backdrop-blur-xl border-r border-black/[0.03]">
            <div className="flex items-center justify-center h-14 shrink-0 border-b border-black/[0.03]">
              <div className="size-9 rounded-xl bg-zinc-900 flex items-center justify-center">
                <Brain className="size-5 text-white" />
              </div>
            </div>

            <nav className="flex-1 py-3 flex flex-col items-center gap-1 px-0">
              {navItems.map((item) => {
                const isActive = currentView === item.view
                const Icon = item.icon
                return (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                      isActive
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60'
                    )}
                    title={item.label}
                  >
                    <Icon className="size-5" />
                  </button>
                )
              })}
            </nav>

            <div className="py-3 flex flex-col items-center shrink-0 border-t border-black/[0.03]">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="size-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60 transition-all duration-200"
                  title="Sign In"
                >
                  <LogIn className="size-5" />
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 transition-all duration-300 md:ml-14">
          {/* Mobile header */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 h-12 shrink-0 bg-white/50 backdrop-blur-xl border-b border-black/[0.03]">
              <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Brain className="size-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                  >
                    <LogOut className="size-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                  >
                    <LogIn className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="p-4 md:p-6 lg:p-10"
              >
                {views[currentView]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/50 backdrop-blur-xl border-t border-black/[0.03]">
          <div className="flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const isActive = currentView === item.view
              const Icon = item.icon
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={cn(
                    'flex items-center justify-center w-12 h-10 rounded-xl transition-all min-w-[44px] min-h-[44px]',
                    isActive ? 'text-purple-600' : 'text-zinc-400'
                  )}
                >
                  <Icon className="size-5" />
                </button>
              )
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}

      {/* Global Auth Drawer (for non-mobile navigation sign-in) */}
      <GlobalAuthDrawer />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── GLOBAL AUTH DRAWER ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function GlobalAuthDrawer() {
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {isMobile ? (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-zinc-200 mx-auto mb-4" />
              <div className="flex justify-end mb-2">{closeButton}</div>
              {formContent}
              {modeSwitch}
            </motion.div>
          ) : (
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
                <div className="absolute top-4 right-4">{closeButton}</div>
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

// ═══════════════════════════════════════════════════════════════════════
// ─── SIMPLE VIEWS (Ask, Collections, Settings) ──────────────────────
// ═══════════════════════════════════════════════════════════════════════

function SimpleAskView() {
  const { memories } = useAetherStore()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Search className="size-8 mb-3 text-gray-300" />
      <p className="text-sm font-medium text-gray-500 mb-1">Ask Aether</p>
      <p className="text-xs text-gray-400">Search across {memories.length} memories</p>
    </div>
  )
}

function SimpleCollectionsView() {
  const { collections } = useAetherStore()
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Collections</h2>
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Layers className="size-8 mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500 mb-1">No collections yet</p>
          <p className="text-xs text-gray-400">Collections auto-create when 10+ memories share tags</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {collections.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-black/[0.04] rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{c.icon}</span>
                <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
              </div>
              <p className="text-xs text-gray-400">{c.memoryCount} memories</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SimpleSettingsView({
  onSignOut,
  isAuthenticated,
  onSignIn,
}: {
  onSignOut: () => void
  isAuthenticated: boolean
  onSignIn: () => void
}) {
  const { user } = useAetherStore()
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
      <div className="bg-white border border-black/[0.04] rounded-xl p-6 space-y-4">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-10 font-medium text-sm transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-3">Sign in to sync your memories across devices</p>
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 font-medium text-sm transition-colors"
            >
              <LogIn className="size-4" />
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN HOME COMPONENT ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export default function Home() {
  const { checkSession, fetchMemories, fetchCollections, isAuthenticated } = useAetherStore()
  const isMobile = useIsMobile()
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    checkSession()
    fetchMemories()
    fetchCollections()
  }, [checkSession, fetchMemories, fetchCollections])

  // On mobile, always show dashboard. On desktop, show dashboard if authenticated or user chose to skip.
  const shouldShowDashboard = isMobile || isAuthenticated || showDashboard

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {shouldShowDashboard ? (
        <AppShell>
          <DashboardView />
        </AppShell>
      ) : (
        <LandingPage onSkipToDashboard={() => setShowDashboard(true)} />
      )}
    </div>
  )
}
