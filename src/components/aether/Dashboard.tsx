'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Link2,
  ImageIcon,
  Mic,
  Send,
  Loader2,
} from 'lucide-react'
import { useAetherStore, type Memory, type MemoryType } from '@/lib/aether-store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Animation variants ────────────────────────────────────────────
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

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

// ─── Props ──────────────────────────────────────────────────────────
interface DashboardProps {
  onAddMemory?: (type: MemoryType) => void
}

// ─── Component ──────────────────────────────────────────────────────
export function Dashboard({ onAddMemory }: DashboardProps) {
  const { memories, requireAuth, isAuthenticated, saveMemory, darkMode } = useAetherStore()

  // ── Capture bar state ──────────────────────────────────────────────
  const [captureText, setCaptureText] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCapture = useCallback(async () => {
    const text = captureText.trim()
    if (!text) return

    if (!isAuthenticated) {
      const savedText = text
      requireAuth(async () => {
        const result = await saveMemory({
          type: 'text',
          title: savedText.split('\n')[0].slice(0, 80) || 'Quick Note',
          content: savedText,
        })
        if (result) {
          toast.success('Memory saved!')
        }
      })
      setCaptureText('')
      return
    }

    setIsCapturing(true)
    try {
      const result = await saveMemory({
        type: 'text',
        title: text.split('\n')[0].slice(0, 80) || 'Quick Note',
        content: text,
      })
      if (result) {
        setCaptureText('')
        toast.success('Memory saved!')
      } else {
        toast.error('Failed to save memory')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsCapturing(false)
    }
  }, [captureText, isAuthenticated, requireAuth, saveMemory])

  const handleCaptureKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }, [handleCapture])

  // ── Derived data ───────────────────────────────────────────────────
  const recentMemories = useMemo(
    () =>
      [...memories]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [memories]
  )

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

      {/* ── Gravity Capture Bar ─────────────────────────────────────── */}
      <section className="relative z-10 mb-10">
        <div className={cn(
          'relative p-1.5 rounded-2xl transition-all duration-500',
          isDark
            ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_40px_-10px_rgba(139,92,246,0.15)] focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_80px_-20px_rgba(139,92,246,0.5)] focus-within:border-purple-500/30'
            : 'bg-white/70 border border-gray-200/80 shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_0_30px_-10px_rgba(139,92,246,0.1)] focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_60px_-15px_rgba(139,92,246,0.2)] focus-within:border-purple-400/40'
        )}>
          <div className="flex items-center gap-2">
            <input
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={handleCaptureKeyDown}
              placeholder="Capture a thought... press Enter to save"
              disabled={isCapturing}
              className={cn(
                'w-full bg-transparent text-base focus:outline-none px-4 py-3',
                isDark
                  ? 'text-white placeholder:text-white/25'
                  : 'text-gray-900 placeholder:text-gray-400'
              )}
            />
            <button
              onClick={handleCapture}
              disabled={!captureText.trim() || isCapturing}
              className={cn(
                'flex items-center justify-center text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 active:scale-95 shrink-0',
                captureText.trim()
                  ? isDark
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)]'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                  : isDark
                    ? 'bg-white/[0.06] text-white/25'
                    : 'bg-gray-100 text-gray-400'
              )}
            >
              {isCapturing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Recent Memories Feed ───────────────────────────────────── */}
      <section className="relative z-10">
        {recentMemories.length === 0 ? (
          <p className={cn('text-sm mt-20 text-center', isDark ? 'text-white/15' : 'text-gray-300')}>
            Your mind is clear. Dump a thought above.
          </p>
        ) : (
          <div className="space-y-3">
            {recentMemories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} index={i} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}

// ─── Memory Card ────────────────────────────────────────────────────
function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
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
      variants={itemVariants}
      custom={index}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className={cn(
          'rounded-xl p-5 transition-all duration-300 cursor-pointer group',
          isDark
            ? 'bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
            : 'bg-white/80 border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-lg'
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
