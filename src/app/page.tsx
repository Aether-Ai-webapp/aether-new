'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Loader2,
  Link2,
  FileText,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  LogOut,
  LogIn,
  Search,
  MessageCircle,
  Volume2,
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
// ─── LIVING DEMO COMPONENT (Framer Motion Typing) ───────────────────
// ═══════════════════════════════════════════════════════════════════════

function LivingDemo() {
  const [displayedText, setDisplayedText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'processing' | 'done'>('typing')
  const demoText = "I need to build a PC for video editing — what GPU should I get under $500?"

  useEffect(() => {
    let i = 0
    setDisplayedText('')
    setPhase('typing')
    const interval = setInterval(() => {
      if (i < demoText.length) {
        setDisplayedText(demoText.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('processing'), 400)
        setTimeout(() => setPhase('done'), 1800)
      }
    }, 45)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(() => {
        setDisplayedText('')
        setPhase('typing')
      }, 4500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-50">
          <div className="w-3 h-3 rounded-full bg-red-300" />
          <div className="w-3 h-3 rounded-full bg-yellow-300" />
          <div className="w-3 h-3 rounded-full bg-green-300" />
          <span className="ml-3 text-xs text-zinc-400 font-medium">Aether Capture</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 bg-zinc-50/80 rounded-xl px-4 py-3 mb-4">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm text-zinc-700 min-h-[20px]">
              {displayedText}
              {phase === 'typing' && <span className="animate-pulse text-purple-500">|</span>}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {phase === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-zinc-400"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Synthesizing insight...</span>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm"
              >
                <p className="font-semibold text-sm text-zinc-800 mb-1">PC Build GPU Research</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Considering video editing needs under $500, the RTX 4060 Ti offers excellent value with NVENC encoding support and 16GB VRAM options for timeline scrubbing.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">hardware</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">video-editing</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">budget</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN APPLICATION COMPONENT ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export default function AetherApp() {
  const store = useAetherStore()
  const isMobile = useIsMobile()

  // ── Capture State ────────────────────────────────────────────────
  const [captureText, setCaptureText] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Auth State ───────────────────────────────────────────────────
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [freeEmail, setFreeEmail] = useState('')
  const [freePassword, setFreePassword] = useState('')
  const [premiumEmail, setPremiumEmail] = useState('')
  const [premiumPassword, setPremiumPassword] = useState('')

  // ── Suggestion Box State ─────────────────────────────────────────
  const [newMemoryIds, setNewMemoryIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  // ── Ask AI State ─────────────────────────────────────────────────
  const [askAIOpen, setAskAIOpen] = useState(false)
  const [askAIQuery, setAskAIQuery] = useState('')
  const [askAIResponse, setAskAIResponse] = useState('')
  const [askAILoading, setAskAILoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── Inspection Drawer State ──────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMemory, setDrawerMemory] = useState<Memory | null>(null)

  // ═════════════════════════════════════════════════════════════════
  // ─── EFFECTS ─────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════

  useEffect(() => {
    store.checkSession()
  }, [])

  useEffect(() => {
    if (store.isAuthenticated) {
      store.fetchMemories()
      store.fetchCollections()
    }
  }, [store.isAuthenticated])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [askAIResponse])

  // ═════════════════════════════════════════════════════════════════
  // ─── HANDLERS ────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════

  const handleCapture = useCallback(async () => {
    const text = captureText.trim()
    if (!text && !selectedImage && !isRecording) return

    if (!store.isAuthenticated) {
      store.setShowAuthModal(true)
      store.requireAuth(() => handleCapture())
      return
    }

    setIsCapturing(true)

    try {
      if (selectedImage) {
        const formData = new FormData()
        formData.append('image', selectedImage)
        if (text) formData.append('text', text)

        const res = await fetch('/api/capture', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Capture failed')
        const data = await res.json()

        if (data.memory) {
          store.addMemory(data.memory)
          setNewMemoryIds(prev => new Set([...prev, data.memory.id]))
          toast.success('Image captured!')
        }
      } else {
        const isUrl = /^https?:\/\//i.test(text)
        const memoryType: MemoryType = isUrl ? 'link' : 'text'
        const result = await store.saveMemory({
          type: memoryType,
          title: isUrl ? 'Saved Link' : text.slice(0, 60),
          content: text,
          sourceUrl: isUrl ? text : null,
        })

        if (result) {
          setNewMemoryIds(prev => new Set([...prev, result.id]))
          toast.success('Memory captured!')
        }
      }

      setCaptureText('')
      setSelectedImage(null)
      setImagePreviewUrl(null)
    } catch (err) {
      console.error('Capture error:', err)
      toast.error('Failed to capture. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }, [captureText, selectedImage, isRecording, store])

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())

        if (!store.isAuthenticated) {
          store.setShowAuthModal(true)
          toast.error('Please sign in to capture voice notes')
          return
        }

        setIsCapturing(true)
        try {
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')
          formData.append('text', '')

          const res = await fetch('/api/capture', { method: 'POST', body: formData })
          if (!res.ok) throw new Error('Voice capture failed')
          const data = await res.json()

          if (data.memory) {
            store.addMemory(data.memory)
            setNewMemoryIds(prev => new Set([...prev, data.memory.id]))
            toast.success('Voice note captured!')
          }
        } catch (err) {
          console.error('Voice capture error:', err)
          toast.error('Failed to process voice note')
        } finally {
          setIsCapturing(false)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }, [store])

  const handleStopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }, [mediaRecorder])

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    const url = URL.createObjectURL(file)
    setImagePreviewUrl(url)
  }, [])

  const handleAuth = useCallback(async (mode: 'login' | 'signup', email: string, password: string, name?: string) => {
    setAuthLoading(true)
    try {
      let success = false
      if (mode === 'login') {
        success = await store.login(email, password)
      } else {
        success = await store.signup(email, password, name || '')
      }
      if (success) {
        setAuthModalOpen(false)
        setAuthEmail('')
        setAuthPassword('')
        setAuthName('')
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
      } else {
        toast.error(mode === 'login' ? 'Invalid credentials' : 'Signup failed. Try again.')
      }
    } catch {
      toast.error('Authentication error')
    } finally {
      setAuthLoading(false)
    }
  }, [store])

  const handleApplySuggestion = useCallback((memoryId: string) => {
    setAppliedIds(prev => new Set([...prev, memoryId]))
    toast.success('AI suggestions applied!')
  }, [])

  const handleDeleteMemory = useCallback(async (id: string) => {
    try {
      await store.deleteMemoryFromDB(id)
      setDrawerOpen(false)
      setDrawerMemory(null)
      toast.success('Memory purged')
    } catch {
      toast.error('Failed to delete memory')
    }
  }, [store])

  const handleDownloadMarkdown = useCallback((memory: Memory) => {
    const md = `# ${memory.title || 'Untitled'}\n\n`
      + `**Type:** ${memory.type}\n`
      + `**Date:** ${new Date(memory.createdAt).toLocaleDateString()}\n\n`
      + `## Summary\n${memory.summary || 'No summary available.'}\n\n`
      + `## Raw Content\n${memory.content}\n\n`
      + `## Deep Insight\n${memory.deepInsight || 'No deep insight available.'}\n\n`
      + `## Tags\n${memory.tags.join(', ') || 'None'}\n`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${memory.title?.slice(0, 40) || 'memory'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleAskAI = useCallback(async () => {
    const q = askAIQuery.trim()
    if (!q) return

    setAskAILoading(true)
    setAskAIResponse('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })

      if (!res.ok || !res.body) throw new Error('Chat failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setAskAIResponse(fullText)
      }
    } catch {
      setAskAIResponse('I couldn\'t search your memories right now. Please try again.')
    } finally {
      setAskAILoading(false)
    }
  }, [askAIQuery])

  const handleSignOut = useCallback(async () => {
    await store.logout()
    toast.success('Signed out')
  }, [store])

  // ═════════════════════════════════════════════════════════════════
  // ─── COMPUTED VALUES ─────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════

  const showLanding = !isMobile && !store.isAuthenticated

  const filteredMemories = store.memories.filter(m => {
    if (store.filterType !== 'all' && m.type !== store.filterType) return false
    if (store.searchQuery) {
      const q = store.searchQuery.toLowerCase()
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  // ═════════════════════════════════════════════════════════════════
  // ─── RENDER: STATE A — LANDING PAGE ──────────────────────────────
  // ═════════════════════════════════════════════════════════════════

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-zinc-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-zinc-900 tracking-tight">Aether</span>
            </div>
            <button
              onClick={() => { setAuthMode('login'); setAuthModalOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </header>

        {/* Purpose Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
              A sanctuary for thoughts
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                that move too fast.
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Built for builders, creators, and divergent minds who need zero-friction mental clarity.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Sub-second voice capture</span>
              <span className="text-zinc-200">·</span>
              <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> AI-powered synthesis</span>
              <span className="text-zinc-200">·</span>
              <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Semantic search</span>
            </div>
          </motion.div>
        </section>

        {/* Interactive Living Demo */}
        <section className="px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <LivingDemo />
          </motion.div>
        </section>

        {/* Asymmetric Pricing & Registration Matrix */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {/* Free Tier Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-2xl border border-zinc-100 p-8 flex flex-col"
            >
              <div className="mb-6">
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Ambient</p>
                <p className="text-4xl font-bold text-zinc-900">$0.00 <span className="text-base font-normal text-zinc-400">/ Free</span></p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  15 Cognitive Captures per month
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Standard text and local timeline indexing
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  AI-powered summaries
                </li>
              </ul>
              <div className="space-y-3 border-t border-zinc-50 pt-6">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Create Free Account</p>
                <input
                  type="email"
                  placeholder="Email"
                  value={freeEmail}
                  onChange={e => setFreeEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={freePassword}
                  onChange={e => setFreePassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
                />
                <button
                  onClick={async () => {
                    if (!freeEmail || !freePassword) { toast.error('Please fill in all fields'); return }
                    setAuthLoading(true)
                    const ok = await store.signup(freeEmail, freePassword, '')
                    setAuthLoading(false)
                    if (ok) { setFreeEmail(''); setFreePassword(''); toast.success('Welcome to Aether!') }
                    else toast.error('Signup failed. Try again.')
                  }}
                  disabled={authLoading}
                  className="w-full py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Get Started Free'}
                </button>
              </div>
            </motion.div>

            {/* Premium Tier Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative rounded-2xl p-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-xl"
            >
              <div className="bg-white rounded-2xl p-8 flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-purple-400 uppercase tracking-wider">Ascent</p>
                    <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 rounded-full font-medium">Premium</span>
                  </div>
                  <p className="text-4xl font-bold text-zinc-900">$5.99 <span className="text-base font-normal text-zinc-400">/ month</span></p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    Infinite Cognitive Scale
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    Sub-second Groq voice processing
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    Deep AI insights &amp; synthesis
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    Autonomous 10-memory collection auto-clustering
                  </li>
                </ul>
                <div className="space-y-3 border-t border-zinc-50 pt-6">
                  <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Unlock Premium Sanctuary</p>
                  <input
                    type="email"
                    placeholder="Email"
                    value={premiumEmail}
                    onChange={e => setPremiumEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={premiumPassword}
                    onChange={e => setPremiumPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
                  />
                  <button
                    onClick={async () => {
                      if (!premiumEmail || !premiumPassword) { toast.error('Please fill in all fields'); return }
                      setAuthLoading(true)
                      const ok = await store.signup(premiumEmail, premiumPassword, '')
                      setAuthLoading(false)
                      if (ok) { setPremiumEmail(''); setPremiumPassword(''); toast.success('Welcome to Aether Premium!') }
                      else toast.error('Signup failed. Try again.')
                    }}
                    disabled={authLoading}
                    className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Unlock Premium'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-100 py-8 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-400">
            <span>&copy; {new Date().getFullYear()} Aether</span>
            <span>Your second brain, always listening.</span>
          </div>
        </footer>

        {/* Sign In Modal */}
        <AnimatePresence>
          {authModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
              onClick={() => setAuthModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-zinc-900">Sign In</h2>
                  <button onClick={() => setAuthModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                  />
                  <button
                    onClick={() => handleAuth('login', authEmail, authPassword)}
                    disabled={authLoading}
                    className="w-full py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign In'}
                  </button>
                  <p className="text-center text-xs text-zinc-400">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => setAuthModalOpen(false)}
                      className="text-purple-600 hover:underline"
                    >
                      Sign up below
                    </button>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════
  // ─── RENDER: STATE B — SANCTUARY DASHBOARD ──────────────────────
  // ═════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-900 tracking-tight">Aether</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAskAIOpen(!askAIOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                askAIOpen
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 border border-transparent"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Ask Your Mind
            </button>
            {store.isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            {!store.isAuthenticated && (
              <button
                onClick={() => { setAuthMode('login'); setAuthModalOpen(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-20">
        {/* Capture Capsule Bar */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-indigo-500 blur-2xl opacity-15 rounded-3xl pointer-events-none" />
          <div className="relative bg-white rounded-2xl border border-zinc-100 shadow-sm p-3">
            {imagePreviewUrl && (
              <div className="mb-3 flex items-center gap-2">
                <img src={imagePreviewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-zinc-100" />
                <button
                  onClick={() => { setSelectedImage(null); setImagePreviewUrl(null) }}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 p-2 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                title="Attach image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={cn(
                  "shrink-0 p-2 rounded-lg transition-all",
                  isRecording
                    ? "text-red-500 bg-red-50 animate-pulse"
                    : "text-zinc-400 hover:text-purple-600 hover:bg-purple-50"
                )}
                title={isRecording ? "Stop recording" : "Record voice"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={captureText}
                onChange={e => setCaptureText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCapture() } }}
                placeholder={isRecording ? "Recording..." : "Capture a thought, paste a link, or type a note..."}
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-zinc-300 text-zinc-800"
                disabled={isRecording || isCapturing}
              />
              <button
                onClick={handleCapture}
                disabled={isCapturing || (!captureText.trim() && !selectedImage && !isRecording)}
                className={cn(
                  "shrink-0 p-2 rounded-lg transition-all",
                  isCapturing
                    ? "bg-purple-100 text-purple-400"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {isRecording && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording... tap the mic to stop
              </div>
            )}
          </div>
        </div>

        {/* Ask Your Mind Panel */}
        <AnimatePresence>
          {askAIOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-zinc-800">Ask Your Mind</h3>
                </div>
                {askAIResponse && (
                  <div className="mb-4 p-4 bg-zinc-50 rounded-xl text-sm text-zinc-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {askAIResponse}
                    <div ref={chatEndRef} />
                  </div>
                )}
                {askAILoading && !askAIResponse && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching your memories...
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={askAIQuery}
                    onChange={e => setAskAIQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAskAI() }}
                    placeholder="What was that thing I mentioned about..."
                    className="flex-1 px-3 py-2 text-sm bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 placeholder:text-zinc-300"
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={askAILoading || !askAIQuery.trim()}
                    className="shrink-0 p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'text', 'voice', 'link', 'image'] as const).map(type => (
            <button
              key={type}
              onClick={() => store.setFilterType(type)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-all shrink-0",
                store.filterType === type
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
            <input
              type="text"
              value={store.searchQuery}
              onChange={e => store.setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 placeholder:text-zinc-300 w-40"
            />
          </div>
        </div>

        {/* Timeline Feed */}
        {store.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">No memories yet</p>
            <p className="text-xs text-zinc-300 mt-1">Capture your first thought above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map(memory => {
              const isNew = newMemoryIds.has(memory.id) && !appliedIds.has(memory.id)
              const isApplied = appliedIds.has(memory.id)

              return (
                <div key={memory.id}>
                  {/* Memory Card */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => { setDrawerMemory(memory); setDrawerOpen(true) }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                          memory.type === 'voice' ? 'bg-red-50 text-red-500' :
                          memory.type === 'link' ? 'bg-blue-50 text-blue-500' :
                          memory.type === 'image' ? 'bg-green-50 text-green-500' :
                          'bg-purple-50 text-purple-500'
                        )}>
                          {memory.type === 'voice' ? <Volume2 className="w-4 h-4" /> :
                           memory.type === 'link' ? <Link2 className="w-4 h-4" /> :
                           memory.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                           <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-800 truncate">
                              {memory.title || 'Untitled'}
                            </h3>
                            {isApplied && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                          </div>
                          {memory.summary && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{memory.summary}</p>
                          )}
                          {!memory.summary && memory.content && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{memory.content}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {memory.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                                {tag}
                              </span>
                            ))}
                            <span className="text-[10px] text-zinc-300 ml-auto flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-zinc-200 group-hover:text-zinc-400 transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  </motion.div>

                  {/* AI Suggestion Box (Saner-style) */}
                  {isNew && (memory.summary || memory.tags.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-8 mt-1 overflow-hidden"
                    >
                      <div className="bg-zinc-50/80 rounded-xl border border-zinc-100/60 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">AI Suggestion</span>
                        </div>
                        {memory.title && (
                          <p className="text-xs font-medium text-zinc-600 mb-1.5">{memory.title}</p>
                        )}
                        {memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {memory.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white text-zinc-500 rounded border border-zinc-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApplySuggestion(memory.id) }}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Apply &amp; Sync
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Dashboard Footer */}
      <footer className="border-t border-zinc-100 py-4 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px] text-zinc-300">
          <span>&copy; {new Date().getFullYear()} Aether</span>
          <span>{store.memories.length} memories</span>
        </div>
      </footer>

      {/* ─── Inspection Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && drawerMemory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
              onClick={() => { setDrawerOpen(false); setDrawerMemory(null) }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between p-4 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-900">Memory Detail</h2>
                <button
                  onClick={() => { setDrawerOpen(false); setDrawerMemory(null) }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Title & Type */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-medium rounded-full",
                      drawerMemory.type === 'voice' ? 'bg-red-50 text-red-600' :
                      drawerMemory.type === 'link' ? 'bg-blue-50 text-blue-600' :
                      drawerMemory.type === 'image' ? 'bg-green-50 text-green-600' :
                      'bg-purple-50 text-purple-600'
                    )}>
                      {drawerMemory.type}
                    </span>
                    <span className="text-[10px] text-zinc-300">
                      {formatDistanceToNow(new Date(drawerMemory.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {drawerMemory.title || 'Untitled'}
                  </h3>
                </div>

                {/* AI Summary */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-zinc-500">AI Summary</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed bg-purple-50/50 rounded-xl p-4 border border-purple-100/50">
                    {drawerMemory.summary || 'Summary not yet generated...'}
                  </p>
                </div>

                {/* Raw Content */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-500">Raw Content</span>
                  </div>
                  {drawerMemory.imageUrl ? (
                    <img
                      src={drawerMemory.imageUrl}
                      alt="Captured image"
                      className="w-full rounded-xl border border-zinc-100"
                    />
                  ) : (
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {drawerMemory.content || 'No content'}
                    </div>
                  )}
                </div>

                {/* Deep Insight */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-zinc-500">Deep Insight</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                    {drawerMemory.deepInsight || 'Deep insight not yet generated...'}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <span className="text-xs font-semibold text-zinc-500 mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {drawerMemory.tags.length > 0 ? drawerMemory.tags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                        {tag}
                      </span>
                    )) : (
                      <span className="text-xs text-zinc-300">No tags</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => handleDownloadMarkdown(drawerMemory)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(drawerMemory!.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge Memory
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Auth Modal (Mobile / Dashboard) ────────────────────────── */}
      <AnimatePresence>
        {(authModalOpen || store.showAuthModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => { setAuthModalOpen(false); store.setShowAuthModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={cn(
                      "text-sm font-semibold pb-1 transition-colors",
                      authMode === 'login' ? "text-zinc-900 border-b-2 border-purple-500" : "text-zinc-400"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={cn(
                      "text-sm font-semibold pb-1 transition-colors",
                      authMode === 'signup' ? "text-zinc-900 border-b-2 border-purple-500" : "text-zinc-400"
                    )}
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  onClick={() => { setAuthModalOpen(false); store.setShowAuthModal(false) }}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {authMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Name"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAuth(authMode, authEmail, authPassword, authName)
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                />
                <button
                  onClick={() => handleAuth(authMode, authEmail, authPassword, authName)}
                  disabled={authLoading}
                  className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
