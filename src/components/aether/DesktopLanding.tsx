'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Star, Loader2 } from 'lucide-react'
import { useAetherStore } from '@/lib/aether-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const features = [
  'Unlimited Cognitive Storage',
  'Zero-Friction Voice Ingestion',
  'Continuous Multi-Note AI Synchronization',
]

const testimonials = [
  { name: 'Sarah K.', text: 'Aether completely transformed how I capture and connect my ideas.' },
  { name: 'James L.', text: 'The AI recall is unreal — it surfaces thoughts I forgot I even had.' },
  { name: 'Priya M.', text: 'I use this for every meeting, idea, and insight. It never lets me down.' },
  { name: 'David R.', text: 'Elegant, fast, and actually useful. This is what note-taking should be.' },
  { name: 'Elena T.', text: 'My students and I rely on Aether for literature synthesis. Game changer.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.2, ease: 'easeInOut' as const },
  }),
}

export function DesktopLanding() {
  const { login, signup, isAuthenticated } = useAetherStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  // If authenticated, don't show landing
  if (isAuthenticated) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F9FAFB] flex flex-col items-center justify-center">
      {/* Ambient gradient blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30 animate-ambient-drift"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0) 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-25 animate-ambient-drift-alt"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0) 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-20 animate-ambient-drift"
        style={{ background: 'radial-gradient(ellipse, rgba(192,132,252,0.10) 0%, rgba(192,132,252,0) 70%)', animationDelay: '3s' }}
      />

      {/* Title */}
      <motion.h1
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 text-center max-w-3xl px-6"
      >
        Your mind, entirely unified.
      </motion.h1>

      {/* Pricing Card + Inline Auth */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-14 w-full max-w-md mx-6 rounded-3xl bg-white/90 border border-black/[0.04] shadow-2xl backdrop-blur-md p-10"
      >
        <p className="uppercase text-sm font-semibold tracking-wider text-purple-600 text-center">
          INFINITE COGNITIVE SCALE
        </p>

        <div className="mt-5 flex items-baseline justify-center gap-1.5">
          <span className="text-5xl font-bold text-zinc-900">$5.99</span>
          <span className="text-base font-medium text-zinc-400">/ month</span>
        </div>

        <div className="border-t border-black/[0.04] my-6" />

        <ul className="space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <Sparkles className="size-4 text-purple-500 shrink-0" />
              <span className="text-sm text-zinc-600">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Inline Auth Form */}
        <div className="border-t border-black/[0.04] mt-6 pt-6">
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

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              disabled={isLoading}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Testimonial Ticker */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-16 w-full overflow-hidden"
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
    </div>
  )
}
