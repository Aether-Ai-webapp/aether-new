'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format, isToday, isThisWeek } from 'date-fns'
import {
  BookOpen,
  FolderOpen,
  TrendingUp,
  Heart,
  FileText,
  LinkIcon,
  ImageIcon,
  Mic,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useAetherStore, type Memory, type MemoryType } from '@/lib/aether-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  link: LinkIcon,
  image: ImageIcon,
  voice: Mic,
}

const typeLabelMap: Record<MemoryType, string> = {
  text: 'Note',
  link: 'Link',
  image: 'Image',
  voice: 'Voice',
}

// ─── Props ──────────────────────────────────────────────────────────
interface DashboardProps {
  onAddMemory?: (type: MemoryType) => void
}

// ─── Component ──────────────────────────────────────────────────────
export function Dashboard({ onAddMemory }: DashboardProps) {
  const { memories, collections, setCurrentView } = useAetherStore()

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

  // ── Quick-add definitions ──────────────────────────────────────────
  const quickAddItems: {
    type: MemoryType
    label: string
    emoji: string
    bg: string
  }[] = [
    { type: 'text', label: 'Note', emoji: '📝', bg: 'bg-[#EAD8D0]/60' },
    { type: 'link', label: 'Link', emoji: '🔗', bg: 'bg-[#D4E8DB]/60' },
    { type: 'image', label: 'Image', emoji: '📷', bg: 'bg-[#D6D8EB]/60' },
    { type: 'voice', label: 'Voice', emoji: '🎤', bg: 'bg-[#EAD6E0]/60' },
  ]

  // ── Stat cards ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Memories',
      value: memories.length,
      icon: BookOpen,
      color: 'text-[#6D597A]',
      bg: 'bg-[#6D597A]/10',
    },
    {
      label: 'Collections',
      value: collections.length,
      icon: FolderOpen,
      color: 'text-[#E07A5F]',
      bg: 'bg-[#E07A5F]/10',
    },
    {
      label: 'This Week',
      value: thisWeekCount,
      icon: TrendingUp,
      color: 'text-[#81B29A]',
      bg: 'bg-[#81B29A]/10',
    },
    {
      label: 'Favorites',
      value: favoriteCount,
      icon: Heart,
      color: 'text-[#F2CC8F]',
      bg: 'bg-[#F2CC8F]/10',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-5xl mx-auto pb-24 md:pb-8"
    >
      {/* ── Greeting Section ──────────────────────────────────────── */}
      <motion.section variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {getGreeting()} ✨
        </h1>
        <p className="text-lg text-muted-foreground">What&apos;s on your mind?</p>
        <p className="text-sm text-muted-foreground/70">{getFormattedDate()}</p>
      </motion.section>

      {/* ── Quick-Add Buttons ─────────────────────────────────────── */}
      <motion.section variants={itemVariants}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {quickAddItems.map((item) => (
            <button
              key={item.type}
              onClick={() => onAddMemory?.(item.type)}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap',
                'transition-all duration-150 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]',
                'border border-transparent hover:border-border/50',
                item.bg
              )}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* ── Stats Cards ───────────────────────────────────────────── */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                custom={i}
              >
                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
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
                      <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-[#6D597A]" />
            Recent Memories
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1 -mr-2"
            onClick={() => setCurrentView('memories')}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {recentMemories.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-14 rounded-full bg-[#F5EDE6] flex items-center justify-center mb-4">
                <BookOpen className="size-6 text-[#6D597A]/50" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No memories yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Start by adding your first memory!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => onAddMemory?.('text')}
              >
                <FileText className="size-3.5" />
                Add a note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentMemories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} index={i} />
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Pinned Collections ────────────────────────────────────── */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="size-5 text-[#E07A5F]" />
            Collections
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1 -mr-2"
            onClick={() => setCurrentView('collections')}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {collections.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-14 rounded-full bg-[#F5EDE6] flex items-center justify-center mb-4">
                <FolderOpen className="size-6 text-[#E07A5F]/50" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No collections yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Create collections to organize your memories.
              </p>
            </CardContent>
          </Card>
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

// ─── Memory Card ────────────────────────────────────────────────────
function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  const Icon = typeIconMap[memory.type]
  const displayTitle =
    memory.title || memory.content.split('\n')[0].slice(0, 80) || 'Untitled'
  const relativeTime = formatDistanceToNow(new Date(memory.createdAt), {
    addSuffix: true,
  })

  return (
    <motion.div
      variants={itemVariants}
      custom={index}
    >
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group">
        <CardContent className="flex items-start gap-3 p-3 md:p-4">
          {/* Type icon */}
          <div className="flex items-center justify-center size-9 rounded-lg bg-[#F5EDE6] shrink-0 mt-0.5">
            <Icon className="size-4 text-[#6D597A]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-snug truncate">
                {displayTitle}
              </p>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
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
                    className="text-[10px] px-1.5 py-0 h-5 font-normal bg-[#F5EDE6] text-[#6D597A] border-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {memory.tags.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 font-normal bg-[#F5EDE6] text-muted-foreground border-0"
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
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer min-w-[160px] max-w-[200px] shrink-0 overflow-hidden">
        <div
          className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl"
          style={{ backgroundColor: collection.color }}
        />
        <CardContent className="p-4 pl-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={collection.name}>
              {collection.icon}
            </span>
            <p className="text-sm font-medium text-foreground truncate">
              {collection.name}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {collection.memoryCount}{' '}
            {collection.memoryCount === 1 ? 'memory' : 'memories'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
