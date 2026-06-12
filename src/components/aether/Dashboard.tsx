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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative max-w-3xl mx-auto pb-24 md:pb-8"
    >
      {/* ── Greeting ──────────────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            'text-3xl font-bold tracking-tight mb-2',
            isDark ? 'text-white' : 'text-foreground'
          )}
        >
          {getGreeting()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn('text-base mb-10', isDark ? 'text-white/30' : 'text-muted-foreground/60')}
        >
          What&apos;s on your mind?
        </motion.p>
      </motion.section>

      {/* ── Gravity Capture Bar ─────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mb-10"
      >
        <div className={cn(
          'relative p-1.5 transition-all duration-300',
          isDark
            ? 'bg-white/[0.02] border border-white/[0.06] rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_40px_-10px_rgba(139,92,246,0.15)] focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_80px_-20px_rgba(139,92,246,0.5)] focus-within:border-purple-500/30'
            : 'bg-white border border-border rounded-xl shadow-sm focus-within:shadow-md focus-within:border-primary/50'
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
                  : 'text-foreground placeholder:text-muted-foreground/60'
              )}
            />
            <button
              onClick={handleCapture}
              disabled={!captureText.trim() || isCapturing}
              className={cn(
                'flex items-center justify-center text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 active:scale-95 shrink-0',
                captureText.trim()
                  ? isDark
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_-3px_rgba(139,92,246,0.6)] hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.8)]'
                    : 'bg-gradient-to-r from-primary to-[#8B6F9A] text-white shadow-md hover:opacity-90'
                  : isDark
                    ? 'bg-white/[0.06] text-white/25'
                    : 'bg-muted text-muted-foreground'
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
      </motion.section>

      {/* ── Recent Memories Feed ───────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {recentMemories.length === 0 ? (
          <p className={cn('text-sm mt-20 text-center', isDark ? 'text-white/15' : 'text-muted-foreground/40')}>
            Your mind is clear. Dump a thought above.
          </p>
        ) : (
          <div className="space-y-3">
            {recentMemories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} index={i} />
            ))}
          </div>
        )}
      </motion.section>
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
    >
      <div
        className={cn(
          'rounded-xl p-5 transition-all duration-200 cursor-pointer group',
          isDark
            ? 'bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03]'
            : 'bg-white border border-border shadow-sm hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div className={cn(
            'flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5',
            isDark ? 'bg-white/[0.04]' : 'bg-[#F5EDE6]'
          )}>
            <Icon className={cn('size-4', isDark ? 'text-white/40' : 'text-[#6D597A]')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className={cn(
                'text-sm font-medium leading-snug',
                isDark ? 'text-white/80' : 'text-foreground'
              )}>
                {displayTitle}
              </p>
              <span className={cn(
                'text-[11px] whitespace-nowrap shrink-0 mt-0.5',
                isDark ? 'text-white/20' : 'text-muted-foreground'
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
                      isDark ? 'bg-white/[0.04] text-white/30' : 'bg-[#F5EDE6] text-[#6D597A]'
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
                      isDark ? 'bg-white/[0.04] text-white/20' : 'bg-[#F5EDE6] text-muted-foreground'
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
