'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Star,
  Loader2,
  Terminal,
  Palette,
  Wind,
  Send,
  Brain,
  Mic,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { useAetherStore } from '@/lib/aether-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════
// ─── ANIMATION VARIANTS ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
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
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ═══════════════════════════════════════════════════════════════════════
// ─── SECTION 1 DATA: PURPOSE CARDS ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const purposeCards = [
  {
    icon: Terminal,
    title: 'The Builder',
    description:
      'Capture raw terminal logic, API schemas, and late-night feature pivots in one spoken sentence.',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: Palette,
    title: 'The Creative',
    description:
      'Drop design URLs, color mood boards, and aesthetic flashes before the spark vanishes.',
    gradient: 'from-rose-500/10 to-pink-500/10',
    iconColor: 'text-rose-500',
  },
  {
    icon: Wind,
    title: 'The Divergent Mind',
    description:
      'Zero folders. Zero tagging chores. Just talk, close the tab, and breathe. The system organizes behind the scenes.',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-500',
  },
]

// ═══════════════════════════════════════════════════════════════════════
// ─── SECTION 2: TYPING SIMULATION ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const TYPING_TEXT =
  'Need to design the custom PC build matrix tomorrow using an AMD Ryzen 5 7600X and a minimalist purple case layout...'

const AI_SYNTHESIS =
  'Project Hub: PC Custom Matrix Architecture configured with high-performance Ryzen components and a minimalist purple aesthetic.'

// ═══════════════════════════════════════════════════════════════════════
// ─── SECTION 3: PRICING DATA ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const ambientFeatures = [
  '15 Cognitive Captures per month',
  'Standard Voice Transcription',
  'Local Device Cache Timelines',
]

const ascentFeatures = [
  'Infinite Cognitive Scale',
  'Sub-second Groq Whisper Engine',
  'Continuous Gemini Multi-Note Synthesis',
  'Autonomous Vector Collections',
  'Deep Cognitive Insights',
]

// ═══════════════════════════════════════════════════════════════════════
// ─── TESTIMONIALS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const testimonials = [
  { name: 'Sarah K.', text: 'Aether completely transformed how I capture and connect my ideas.' },
  { name: 'James L.', text: 'The AI recall is unreal — it surfaces thoughts I forgot I even had.' },
  { name: 'Priya M.', text: 'I use this for every meeting, idea, and insight. It never lets me down.' },
  { name: 'David R.', text: 'Elegant, fast, and actually useful. This is what note-taking should be.' },
  { name: 'Elena T.', text: 'My students and I rely on Aether for literature synthesis. Game changer.' },
]

// ═══════════════════════════════════════════════════════════════════════
// ─── INTERACTIVE DEMO COMPONENT ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function InteractiveDemo() {
  const [typingIndex, setTypingIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'morphing' | 'reveal' | 'idle'>('idle')
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const startDemo = useCallback(() => {
    if (hasStarted) return
    setHasStarted(true)
    setPhase('typing')
    setTypingIndex(0)
  }, [hasStarted])

  // Auto-start when scrolled into view
  useEffect(() => {
    if (hasStarted) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startDemo()
        }
      },
      { threshold: 0.5 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasStarted, startDemo])

  // Typing effect
  useEffect(() => {
    if (phase !== 'typing') return
    if (typingIndex >= TYPING_TEXT.length) {
      const timer = setTimeout(() => setPhase('morphing'), 600)
      return () => clearTimeout(timer)
    }
    const speed = 28 + Math.random() * 20
    const timer = setTimeout(() => setTypingIndex((i) => i + 1), speed)
    return () => clearTimeout(timer)
  }, [phase, typingIndex])

  // Morphing phase
  useEffect(() => {
    if (phase !== 'morphing') return
    const timer = setTimeout(() => setPhase('reveal'), 500)
    return () => clearTimeout(timer)
  }, [phase])

  // Reveal phase — reset after 5 seconds
  useEffect(() => {
    if (phase !== 'reveal') return
    const timer = setTimeout(() => {
      setPhase('idle')
      setHasStarted(false)
      setTypingIndex(0)
    }, 6000)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* ── Desktop Device Frame ──────────────────────────────────── */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="relative rounded-2xl border border-black/[0.06] bg-white shadow-2xl overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.04] bg-gray-50/80">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-400/70" />
            <div className="size-2.5 rounded-full bg-amber-400/70" />
            <div className="size-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 border border-black/[0.04] text-center font-mono">
              aether.app
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* App content area */}
        <div className="p-6 min-h-[220px] flex flex-col justify-end relative">
          {/* Breathing gradient aura behind input */}
          <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
            <div
              className="w-[80%] h-32 rounded-full opacity-40 animate-ambient-drift"
              style={{
                background:
                  'radial-gradient(ellipse, rgba(139,92,246,0.25) 0%, rgba(168,85,247,0.10) 40%, transparent 70%)',
              }}
            />
          </div>

          {/* ── Input Phase (typing + idle) ────────────────────────── */}
          <AnimatePresence mode="wait">
            {(phase === 'idle' || phase === 'typing') && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4, scaleY: 0.96, transition: { duration: 0.2, ease: 'easeInOut' } }}
                className="relative z-10"
              >
                <div className="bg-white/90 border border-black/[0.04] shadow-sm backdrop-blur-xl rounded-2xl p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-8 rounded-xl flex items-center justify-center text-gray-300">
                      <Mic className="size-4" />
                    </div>
                    <div className="flex-1 text-sm text-gray-800 min-h-[28px] flex items-center">
                      {phase === 'typing' ? (
                        <span>
                          {TYPING_TEXT.slice(0, typingIndex)}
                          <span className="inline-block w-[2px] h-4 bg-purple-500 animate-pulse ml-0.5 align-middle" />
                        </span>
                      ) : (
                        <span className="text-gray-300">Capture a thought...</span>
                      )}
                    </div>
                    <div className="size-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400">
                      <Send className="size-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Morphing Phase ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {(phase === 'morphing' || phase === 'reveal') && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: -4, height: 44 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: 'auto',
                  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                }}
                className="relative z-10"
              >
                <div className="bg-white border border-black/[0.04] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-5 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Brain className="size-3 text-purple-500" />
                    </div>
                    <span className="text-[11px] font-medium text-purple-500 tracking-wide uppercase">
                      Cognitive Synthesis
                    </span>
                  </div>
                  <AnimatePresence>
                    {phase === 'reveal' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {AI_SYNTHESIS}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {phase === 'morphing' && (
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  )}
                  <AnimatePresence>
                    {phase === 'reveal' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="flex gap-1.5 mt-2.5"
                      >
                        {['hardware', 'design', 'pc-build'].map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── ANIMATED GRADIENT BORDER COMPONENT ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function GradientBorderWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-3xl p-[2px] overflow-hidden', className)}>
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 animate-gradient-border"
        style={{
          background:
            'linear-gradient(90deg, #8B5CF6, #6366F1, #3B82F6, #8B5CF6)',
          backgroundSize: '300% 100%',
        }}
      />
      {/* Inner content */}
      <div className="relative rounded-[calc(1.5rem-2px)] bg-white h-full">
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN DESKTOP LANDING COMPONENT ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export function DesktopLanding() {
  const { login, signup } = useAetherStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredPremium, setHoveredPremium] = useState(false)

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

      if (!success) {
        toast.error(mode === 'login' ? 'Invalid email or password' : 'Signup failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAFAFA] flex flex-col">

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: THE PURPOSE HERO ────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 px-6 flex flex-col items-center">
        {/* Ambient gradient blobs */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30 animate-ambient-drift"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-25 animate-ambient-drift-alt"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }}
        />

        {/* Atmospheric Typography */}
        <motion.h1
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-zinc-900 text-center max-w-4xl leading-[1.1]"
        >
          A sanctuary for thoughts
          <br />
          <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
            that move too fast.
          </span>
        </motion.h1>

        <motion.p
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-6 text-base lg:text-lg text-zinc-400 text-center max-w-xl leading-relaxed"
        >
          Built for developers, builders, and creative minds who need zero-friction mental clarity.
        </motion.p>

        {/* ── Purpose Cards ──────────────────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl w-full"
        >
          {purposeCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                variants={staggerChild}
                className={cn(
                  'group relative rounded-2xl p-6',
                  'bg-white/60 backdrop-blur-xl border border-white/40',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
                  'hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/80',
                  'transition-all duration-500'
                )}
              >
                {/* Subtle gradient overlay on hover */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    card.gradient
                  )}
                />
                <div className="relative z-10">
                  <div className={cn('mb-4', card.iconColor)}>
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: THE INTERACTIVE LIVING DEMO ────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 flex flex-col items-center bg-gradient-to-b from-[#FAFAFA] via-white to-[#FAFAFA]">
        {/* Section label */}
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="flex items-center gap-2 mb-4"
        >
          <Sparkles className="size-4 text-purple-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-purple-500">
            Live Experience
          </span>
        </motion.div>

        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 text-center max-w-2xl"
        >
          Watch your thoughts crystallize
        </motion.h2>

        <motion.p
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="mt-4 text-sm text-zinc-400 text-center max-w-md"
        >
          From raw idea to structured insight — in the time it takes to blink.
        </motion.p>

        {/* Interactive Demo Component */}
        <motion.div
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="mt-14 w-full max-w-2xl"
        >
          <InteractiveDemo />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 3: THE ASYMMETRIC PRICING MATRIX ──────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 flex flex-col items-center">
        {/* Section label */}
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="flex items-center gap-2 mb-4"
        >
          <CheckCircle2 className="size-4 text-zinc-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            Pricing
          </span>
        </motion.div>

        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 text-center max-w-xl"
        >
          Start free. Scale infinitely.
        </motion.h2>

        <motion.p
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="mt-4 text-sm text-zinc-400 text-center max-w-md"
        >
          No credit card required. Upgrade when your mind outgrows the margins.
        </motion.p>

        {/* ── Pricing Grid ─────────────────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl w-full items-start">
          {/* ── AMBIENT TIER (Free) ──────────────────────────────────── */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="rounded-3xl bg-white border border-zinc-200/80 p-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <p className="uppercase text-sm font-semibold tracking-wider text-zinc-400 text-center">
              Ambient Tier
            </p>

            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-zinc-900">$0.00</span>
            </div>
            <p className="text-center text-xs text-zinc-400 mt-1">Free forever</p>

            <div className="border-t border-zinc-100 my-6" />

            <ul className="space-y-4">
              {ambientFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-zinc-300 shrink-0" />
                  <span className="text-sm text-zinc-500">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Inline Auth Form — signup for free tier */}
            <div className="border-t border-zinc-100 mt-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full border-b border-zinc-200 focus:border-purple-500 bg-transparent rounded-none px-0 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl h-10 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>
              <div className="mt-3 text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                  disabled={isLoading}
                >
                  {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── ASCENT PREMIUM ──────────────────────────────────────── */}
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            onMouseEnter={() => setHoveredPremium(true)}
            onMouseLeave={() => setHoveredPremium(false)}
          >
            <GradientBorderWrapper
              className={cn(
                'transition-shadow duration-500',
                hoveredPremium
                  ? 'shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)]'
                  : 'shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]'
              )}
            >
              <div className="p-10">
                <p className="uppercase text-sm font-semibold tracking-wider text-purple-600 text-center">
                  Ascent Premium
                </p>

                <div className="mt-5 flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl font-bold text-zinc-900">$5.99</span>
                  <span className="text-base font-medium text-zinc-400">/ month</span>
                </div>

                <div className="border-t border-black/[0.04] my-6" />

                <ul className="space-y-4">
                  {ascentFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Sparkles className="size-4 text-purple-500 shrink-0" />
                      <span className="text-sm text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Conversion CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-8 w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-3.5 font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Upgrade to Ascent
                  <ArrowRight className="size-4" />
                </motion.button>
              </div>
            </GradientBorderWrapper>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── TESTIMONIAL TICKER ─────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 w-full overflow-hidden border-t border-black/[0.03]">
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="w-full"
        >
          <div className="animate-ticker flex gap-8 w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="w-72 shrink-0 rounded-2xl bg-white/70 border border-black/[0.04] backdrop-blur-sm p-5"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="mt-2 text-xs text-zinc-400 font-medium">{t.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <footer className="mt-auto py-8 text-center border-t border-black/[0.03]">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Brain className="size-4" />
          <span className="text-sm font-medium">Aether</span>
        </div>
        <p className="mt-2 text-xs text-zinc-300">
          Your mind, entirely unified.
        </p>
      </footer>
    </div>
  )
}
