'use client'

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Link2,
  ImageIcon,
  Mic,
  Send,
  Sparkles,
} from 'lucide-react'
import { useAetherStore, type Memory, type MemoryType } from '@/lib/aether-store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const typeIconMap: Record<MemoryType, React.ElementType> = {
  text: FileText,
  link: Link2,
  image: ImageIcon,
  voice: Mic,
}

/** Generate a temp ID for optimistic memories */
function tempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Props ──────────────────────────────────────────────────────────
interface DashboardProps {
  onAddMemory?: (type: MemoryType) => void
}

// ─── Component ──────────────────────────────────────────────────────
export function Dashboard({ onAddMemory }: DashboardProps) {
  const { memories, requireAuth, isAuthenticated, saveMemory, darkMode } = useAetherStore()

  // ── Capture bar state ──────────────────────────────────────────────
  const [captureText, setCaptureText] = useState('')

  // ── Optimistic UI state ────────────────────────────────────────────
  const [pendingMemories, setPendingMemories] = useState<Memory[]>([])
  const [isJustSaved, setIsJustSaved] = useState(false)
  const [showSavedBadge, setShowSavedBadge] = useState(false)
  const justSavedTimer = useRef<ReturnType<typeof setTimeout>>()
  const savedBadgeTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── Daily Recap: computed from memories (no effect) ──────────────
  const dailyRecap = useMemo(() => {
    if (memories.length === 0) return ''
    const randomIndex = Math.floor(Math.random() * memories.length)
    return memories[randomIndex].content
  }, [memories])

  // ── Cleanup timers on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
      if (savedBadgeTimer.current) clearTimeout(savedBadgeTimer.current)
    }
  }, [])

  const handleCapture = useCallback(() => {
    const text = captureText.trim()
    if (!text) return

    // ── Create optimistic fake memory instantly ──────────────────────
    const fakeMemory: Memory = {
      id: tempId(),
      type: 'text',
      title: text.split('\n')[0].slice(0, 80) || 'Quick Note',
      content: text,
      summary: null,
      tags: [],
      sourceUrl: null,
      fileUrl: null,
      imagePreview: null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collections: [],
    }

    // 1. Instantly add to pending (appears in feed NOW)
    setPendingMemories((prev) => [fakeMemory, ...prev])

    // 2. Clear the input bar immediately
    setCaptureText('')

    // 3. Fire dopamine hits
    setIsJustSaved(true)
    setShowSavedBadge(true)
    if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
    if (savedBadgeTimer.current) clearTimeout(savedBadgeTimer.current)
    justSavedTimer.current = setTimeout(() => setIsJustSaved(false), 500)
    savedBadgeTimer.current = setTimeout(() => setShowSavedBadge(false), 1500)

    // 4. Background: save to database (no await for UI)
    if (!isAuthenticated) {
      requireAuth(async () => {
        await saveMemory({
          type: 'text',
          title: text.split('\n')[0].slice(0, 80) || 'Quick Note',
          content: text,
        })
        // After save, remove the fake from pending
        setPendingMemories((prev) => prev.filter((m) => m.id !== fakeMemory.id))
      })
      return
    }

    // Fire-and-forget: save in background, store will add the real memory
    saveMemory({
      type: 'text',
      title: text.split('\n')[0].slice(0, 80) || 'Quick Note',
      content: text,
    }).then(() => {
      // Remove the fake from pending now that the real one is in the store
      setPendingMemories((prev) => prev.filter((m) => m.id !== fakeMemory.id))
    }).catch(() => {
      // If save fails, remove the pending memory
      setPendingMemories((prev) => prev.filter((m) => m.id !== fakeMemory.id))
    })
  }, [captureText, isAuthenticated, requireAuth, saveMemory])

  const handleCaptureKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }, [handleCapture])

  // ── Derived data: merge pending + real memories, deduped ──────────
  const displayMemories = useMemo(() => {
    const real = [...memories]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    // Filter out pending memories whose content already exists in real data
    const realContents = new Set(real.map((m) => m.content))
    const uniquePending = pendingMemories.filter((pm) => !realContents.has(pm.content))

    return [...uniquePending, ...real].slice(0, 6)
  }, [memories, pendingMemories])

  const isDark = darkMode

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-3xl mx-auto pb-24 md:pb-8"
    >
      {/* ── Greeting ──────────────────────────────────────────────── */}
      <section className="relative z-10">
        <h1 className={cn(
          'text-3xl font-bold tracking-tight mb-2',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {getGreeting()}
        </h1>
        <p className={cn('text-base mb-10', isDark ? 'text-white/30' : 'text-gray-400')}>
          What&apos;s on your mind?
        </p>
      </section>

      {/* ── Daily Recap ─────────────────────────────────────────────── */}
      <section className="relative z-10">
        <div className={cn(
          'w-full max-w-2xl mx-auto mb-8 rounded-2xl p-5',
          isDark
            ? 'bg-purple-500/5 border border-purple-500/10'
            : 'bg-purple-50/50 border border-purple-200/50'
        )}>
          <p className={cn(
            'text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2',
            isDark ? 'text-purple-400' : 'text-purple-600'
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            Daily Recap
          </p>
          <p className={cn(
            'text-sm',
            isDark ? 'text-white/50' : 'text-gray-500'
          )}>
            {dailyRecap || 'Start saving thoughts to see your daily recap.'}
          </p>
        </div>
      </section>

      {/* ── Gravity Capture Bar ─────────────────────────────────────── */}
      <section className="relative z-10 mb-4">
        <div className={cn(
          'relative p-1.5 rounded-2xl transition-all duration-300',
          isDark
            ? isJustSaved
              ? 'bg-white/[0.04] border border-purple-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_0_80px_-10px_rgba(139,92,246,0.6)]'
              : 'bg-white/[0.02] border border-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_40px_-10px_rgba(139,92,246,0.15)] focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_80px_-20px_rgba(139,92,246,0.5)] focus-within:border-purple-500/30'
            : isJustSaved
              ? 'bg-white/90 border border-purple-400/50 shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_0_60px_-10px_rgba(139,92,246,0.4)]'
              : 'bg-white/70 border border-gray-200/80 shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_0_30px_-10px_rgba(139,92,246,0.1)] focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_60px_-15px_rgba(139,92,246,0.2)] focus-within:border-purple-400/40'
        )}>
          <div className="flex items-center gap-2">
            <input
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={handleCaptureKeyDown}
              placeholder="Capture a thought... press Enter to save"
              className={cn(
                'w-full bg-transparent text-base focus:outline-none px-4 py-3',
                isDark
                  ? 'text-white placeholder:text-white/25'
                  : 'text-gray-900 placeholder:text-gray-400'
              )}
            />
            <motion.button
              onClick={handleCapture}
              disabled={!captureText.trim()}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className={cn(
                'flex items-center justify-center text-sm font-medium px-4 py-1.5 rounded-lg transition-colors duration-150 shrink-0',
                captureText.trim()
                  ? isDark
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)]'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                  : isDark
                    ? 'bg-white/[0.06] text-white/25'
                    : 'bg-gray-100 text-gray-400'
              )}
            >
              <Send className="size-4" />
            </motion.button>
          </div>
        </div>

        {/* ── "Saved ✨" Badge — dopamine hit ──────────────────────── */}
        <AnimatePresence>
          {showSavedBadge && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex justify-center mt-3"
            >
              <span className={cn(
                'text-xs px-3 py-1 rounded-full',
                isDark
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-50 text-green-600'
              )}>
                Saved ✨
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Recent Memories Feed ───────────────────────────────────── */}
      <section className="relative z-10 mt-6">
        {displayMemories.length === 0 ? (
          <p className={cn('text-sm mt-20 text-center', isDark ? 'text-white/15' : 'text-gray-300')}>
            Your mind is clear. Dump a thought above.
          </p>
        ) : (
          <div className="space-y-3">
            {displayMemories.map((memory) => {
              const isPending = memory.id.startsWith('temp-')
              return (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isNew={isPending}
                />
              )
            })}
          </div>
        )}
      </section>
    </motion.div>
  )
}

// ─── Memory Card ────────────────────────────────────────────────────
function MemoryCard({ memory, isNew }: { memory: Memory; isNew: boolean }) {
  const Icon = typeIconMap[memory.type]
  const displayTitle =
    memory.title || memory.content.split('\n')[0].slice(0, 80) || 'Untitled'
  const relativeTime = formatDistanceToNow(new Date(memory.createdAt), {
    addSuffix: true,
  })
  const darkMode = useAetherStore((s) => s.darkMode)
  const isDark = darkMode

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -30, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        isNew
          ? { type: 'spring', stiffness: 300, damping: 20 }
          : { duration: 0 }
      }
      whileHover={{ y: -2 }}
    >
      <div
        className={cn(
          'rounded-xl p-5 transition-all duration-300 cursor-pointer group',
          isDark
            ? 'bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
            : 'bg-white/80 border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-lg',
          isNew && (isDark ? 'border-purple-500/20' : 'border-purple-200/60')
        )}
      >
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div className={cn(
            'flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5',
            isDark ? 'bg-white/[0.04]' : 'bg-purple-50'
          )}>
            <Icon className={cn('size-4', isDark ? 'text-white/40' : 'text-purple-600')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className={cn(
                'text-sm font-medium leading-snug',
                isDark ? 'text-white/80' : 'text-gray-900'
              )}>
                {displayTitle}
              </p>
              <span className={cn(
                'text-[11px] whitespace-nowrap shrink-0 mt-0.5',
                isDark ? 'text-white/20' : 'text-gray-400'
              )}>
                {relativeTime}
              </span>
            </div>

            {/* Tags */}
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {memory.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 font-normal border-0',
                      isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
                {memory.tags.length > 3 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 font-normal border-0',
                      isDark ? 'bg-white/[0.04] text-white/20' : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    +{memory.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
