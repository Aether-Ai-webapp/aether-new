'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format, isThisWeek } from 'date-fns'
import {
  BookOpen,
  FolderOpen,
  TrendingUp,
  Heart,
  FileText,
  Link2,
  ImageIcon,
  Mic,
  ArrowRight,
  Sparkles,
  Send,
  Loader2,
  Layers,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Music,
  Plane,
  Coffee,
  Code,
} from 'lucide-react'
// Note: FileText, Link2, ImageIcon, Mic are still used in typeIconMap for memory cards
import { useAetherStore, type Memory, type MemoryType, type Collection } from '@/lib/aether-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Animation variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

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

function getFormattedDate(): string {
  return format(new Date(), 'EEEE, MMMM d')
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
  const { memories, collections, setCurrentView, requireAuth, isAuthenticated, saveMemory, darkMode } = useAetherStore()

  // ── Capture bar state ──────────────────────────────────────────────
  const [captureText, setCaptureText] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCapture = useCallback(async () => {
    const text = captureText.trim()
    if (!text) return

    // Gate: if not authenticated, show auth modal and queue this save
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
  const thisWeekCount = useMemo(
    () =>
      memories.filter((m) => isThisWeek(new Date(m.createdAt))).length,
    [memories]
  )

  const favoriteCount = useMemo(
    () => memories.filter((m) => m.isFavorite).length,
    [memories]
  )

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

  

  // ── Stat cards ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Memories',
      value: memories.length,
      icon: BookOpen,
      color: 'text-purple-400',
      bg: 'bg-purple-600/10',
    },
    {
      label: 'Collections',
      value: collections.length,
      icon: Layers,
      color: 'text-orange-400',
      bg: 'bg-orange-600/10',
    },
    {
      label: 'This Week',
      value: thisWeekCount,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10',
    },
    {
      label: 'Favorites',
      value: favoriteCount,
      icon: Heart,
      color: 'text-yellow-400',
      bg: 'bg-yellow-600/10',
    },
  ]

  const isDark = darkMode

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative space-y-8 max-w-5xl mx-auto pb-24 md:pb-8"
    >
      {/* ── Greeting Section ──────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-1"
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            'text-3xl md:text-4xl font-bold tracking-tight',
            isDark ? 'text-white' : 'text-foreground'
          )}
        >
          {getGreeting()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn('text-lg', isDark ? 'text-white/50' : 'text-muted-foreground')}
        >
          What&apos;s on your mind?
        </motion.p>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={cn('text-sm', isDark ? 'text-white/30' : 'text-muted-foreground/70')}
        >
          {getFormattedDate()}
        </motion.p>
      </motion.section>

      {/* ── Gravity Capture Bar — Enhanced Glow ─────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
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



      {/* ── Stats Cards ───────────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                custom={i}
              >
                <Card className={cn(
                  'border-0 transition-shadow duration-200',
                  isDark
                    ? 'bg-white/[0.03] shadow-none hover:bg-white/[0.05]'
                    : 'bg-white shadow-sm hover:shadow-md'
                )}>
                  <CardContent className="flex items-center gap-4 p-4 md:p-5">
                    <div
                      className={cn(
                        'flex items-center justify-center size-10 rounded-xl shrink-0',
                        stat.bg
                      )}
                    >
                      <Icon className={cn('size-5', stat.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'text-2xl font-bold tracking-tight leading-none',
                        isDark ? 'text-white' : 'text-foreground'
                      )}>
                        {stat.value}
                      </p>
                      <p className={cn(
                        'text-xs mt-0.5 truncate',
                        isDark ? 'text-white/40' : 'text-muted-foreground'
                      )}>
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── Recent Memories ───────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className={cn(
            'text-lg font-semibold flex items-center gap-2',
            isDark ? 'text-white' : 'text-foreground'
          )}>
            <Sparkles className={cn('size-5', isDark ? 'text-purple-400' : 'text-[#6D597A]')} />
            Recent Memories
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1 -mr-2',
              isDark ? 'text-white/40 hover:text-white hover:bg-white/[0.06]' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setCurrentView('memories')}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {recentMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4"
            >
              <FileText className={cn('size-10', isDark ? 'text-purple-400/50' : 'text-[#6D597A]/30')} />
            </motion.div>
            <p className={cn('text-sm font-medium', isDark ? 'text-white/20' : 'text-muted-foreground')}>
              Your mind is clear. Dump a thought above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMemories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} index={i} />
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Pinned Collections ────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className={cn(
            'text-lg font-semibold flex items-center gap-2',
            isDark ? 'text-white' : 'text-foreground'
          )}>
            <Layers className={cn('size-5', isDark ? 'text-orange-400' : 'text-[#E07A5F]')} />
            Collections
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1 -mr-2',
              isDark ? 'text-white/40 hover:text-white hover:bg-white/[0.06]' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setCurrentView('collections')}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4"
            >
              <Layers className={cn('size-10', isDark ? 'text-orange-400/50' : 'text-[#E07A5F]/30')} />
            </motion.div>
            <p className={cn('text-sm font-medium', isDark ? 'text-white/20' : 'text-muted-foreground')}>
              Collections will appear as you save thoughts.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}

// ─── Collection icon map ────────────────────────────────────────────
const collectionIconMap: Record<string, React.ElementType> = {
  '💡': Lightbulb,
  '❤️': Heart,
  '💼': Briefcase,
  '🎓': GraduationCap,
  '🎵': Music,
  '✈️': Plane,
  '☕': Coffee,
  '💻': Code,
  '📁': FolderOpen,
}

function getCollectionIcon(iconStr: string): React.ElementType {
  return collectionIconMap[iconStr] || Layers
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
      <Card className={cn(
        'border-0 transition-shadow duration-200 cursor-pointer group',
        isDark
          ? 'bg-white/[0.03] shadow-none hover:bg-white/[0.05]'
          : 'bg-white shadow-sm hover:shadow-md'
      )}>
        <CardContent className="flex items-start gap-3 p-3 md:p-4">
          {/* Type icon */}
          <div className={cn(
            'flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5',
            isDark ? 'bg-purple-600/10' : 'bg-[#F5EDE6]'
          )}>
            <Icon className={cn('size-4', isDark ? 'text-purple-400' : 'text-[#6D597A]')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                'text-sm font-medium leading-snug truncate',
                isDark ? 'text-white' : 'text-foreground'
              )}>
                {displayTitle}
              </p>
              <span className={cn(
                'text-[11px] whitespace-nowrap shrink-0 mt-0.5',
                isDark ? 'text-white/30' : 'text-muted-foreground'
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
                      isDark ? 'bg-purple-600/15 text-purple-300' : 'bg-[#F5EDE6] text-[#6D597A]'
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
                      isDark ? 'bg-white/[0.06] text-white/30' : 'bg-[#F5EDE6] text-muted-foreground'
                    )}
                  >
                    +{memory.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Collection Card ────────────────────────────────────────────────
function CollectionCard({
  collection,
}: {
  collection: Collection
}) {
  const darkMode = useAetherStore((s) => s.darkMode)
  const isDark = darkMode
  const Icon = getCollectionIcon(collection.icon)

  return (
    <motion.div variants={itemVariants}>
      <Card className={cn(
        'border-0 transition-shadow duration-200 cursor-pointer min-w-[160px] max-w-[200px] shrink-0 overflow-hidden',
        isDark
          ? 'bg-white/[0.03] shadow-none hover:bg-white/[0.05]'
          : 'bg-white shadow-sm hover:shadow-md'
      )}>
        <div
          className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl"
          style={{ backgroundColor: collection.color }}
        />
        <CardContent className="p-4 pl-5 space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center justify-center size-7 rounded-lg shrink-0',
              isDark ? 'bg-white/[0.06]' : 'bg-white'
            )}>
              {React.createElement(Icon, { className: 'size-4', style: { color: collection.color } })}
            </div>
            <p className={cn(
              'text-sm font-medium truncate',
              isDark ? 'text-white' : 'text-foreground'
            )}>
              {collection.name}
            </p>
          </div>
          <p className={cn(
            'text-xs',
            isDark ? 'text-white/30' : 'text-muted-foreground'
          )}>
            {collection.memoryCount}{' '}
            {collection.memoryCount === 1 ? 'memory' : 'memories'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
