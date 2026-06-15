'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  FileText,
  Link2,
  ImageIcon,
  Mic,
  MicOff,
  Loader2,
  Crown,
  Upload,
  X,
  Play,
  Square,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useAetherStore } from '@/lib/aether-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCapture } from '@/hooks/useCapture'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════
// ─── TYPES ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

interface AddMemorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ═══════════════════════════════════════════════════════════════════════
// ─── WAVEFORM ANIMATION COMPONENT ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function WaveformBars({ isActive }: { isActive: boolean }) {
  const bars = 24
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary/60 to-primary"
          animate={
            isActive
              ? {
                  height: [8, Math.random() * 40 + 8, 8],
                }
              : { height: 8 }
          }
          transition={
            isActive
              ? {
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.03,
                  ease: 'easeInOut',
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── SUCCESS ANIMATION ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function SuccessOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <div className="relative">
              <CheckCircle2 className="size-16 text-emerald-500" />
              <motion.div
                className="absolute inset-0 size-16 rounded-full bg-emerald-500/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <motion.p
            className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Memory captured
          </motion.p>
          <motion.div
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="size-3" />
            AI is synthesizing your memory...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export function AddMemorySheet({ open, onOpenChange }: AddMemorySheetProps) {
  const isMobile = useIsMobile()
  const memories = useAetherStore((s) => s.memories)
  const isAuthenticated = useAetherStore((s) => s.isAuthenticated)
  const setShowAuthModal = useAetherStore((s) => s.setShowAuthModal)
  const requireAuth = useAetherStore((s) => s.requireAuth)

  const {
    captureText,
    captureLink,
    captureImage,
    captureVoice,
    isRecording,
    startRecording,
    stopRecording,
    recordingDuration,
    isCapturing,
  } = useCapture()

  // ── Free plan limit ────────────────────────────────────────────────
  const FREE_MEMORY_LIMIT = 15

  // Text tab state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // Link tab state
  const [url, setUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  // Image tab state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageTitle, setImageTitle] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Voice tab state
  const [voiceTitle, setVoiceTitle] = useState('')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Common state
  const [activeTab, setActiveTab] = useState('text')
  const [showSuccess, setShowSuccess] = useState(false)

  // ── Cleanup image preview URL ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  // ── Format recording duration ──────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ── Reset form ─────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setTitle('')
    setContent('')
    setUrl('')
    setLinkTitle('')
    setLinkNotes('')
    setImageFile(null)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(null)
    setImageTitle('')
    setVoiceTitle('')
    setRecordedBlob(null)
    setIsPlaying(false)
    setActiveTab('text')
    setShowSuccess(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [imagePreviewUrl])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setTimeout(resetForm, 300)
  }, [onOpenChange, resetForm])

  // ── Fetch link title ───────────────────────────────────────────────
  const fetchLinkTitle = useCallback(async () => {
    if (!url.trim()) return
    setIsFetchingTitle(true)
    try {
      const res = await fetch('/api/memories/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.title) {
          setLinkTitle(data.title)
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsFetchingTitle(false)
    }
  }, [url])

  // ── Image file selection ───────────────────────────────────────────
  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are accepted')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    const url = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreviewUrl(url)
  }, [imagePreviewUrl])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageSelect(file)
  }, [handleImageSelect])

  const removeImage = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [imagePreviewUrl])

  // ── Drag and drop handlers ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageSelect(file)
  }, [handleImageSelect])

  // ── Voice recording ────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      toast.error('Sign in to capture memories')
      return
    }
    try {
      setRecordedBlob(null)
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      await startRecording()
    } catch {
      toast.error('Could not start recording')
    }
  }, [isAuthenticated, setShowAuthModal, startRecording])

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording()
    if (blob) {
      setRecordedBlob(blob)
    }
  }, [stopRecording])

  // ── Voice playback ─────────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    if (!recordedBlob) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      return
    }

    const audioUrl = URL.createObjectURL(recordedBlob)
    const audio = new Audio(audioUrl)
    audio.onended = () => {
      setIsPlaying(false)
      URL.revokeObjectURL(audioUrl)
    }
    audio.play()
    audioRef.current = audio
    setIsPlaying(true)
  }, [recordedBlob, isPlaying])

  // ── Save handlers ──────────────────────────────────────────────────
  const showSuccessAnimation = useCallback(() => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }, [])

  const handleSave = useCallback(async () => {
    // Free plan paywall
    if (memories.length >= FREE_MEMORY_LIMIT) {
      toast.error('Free limit reached — upgrade to Pro for unlimited memories', {
        icon: <Crown className="size-4" />,
      })
      return
    }

    // Auth gate
    if (!isAuthenticated) {
      requireAuth(() => {
        // After auth, the user can try saving again
        setShowAuthModal(true)
      })
      handleClose()
      return
    }

    if (activeTab === 'text') {
      if (!content.trim()) return
      const result = await captureText(title.trim() || 'Untitled Note', content.trim())
      if (result.success) {
        showSuccessAnimation()
        setTimeout(handleClose, 1200)
        toast.success('Memory captured')
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } else if (activeTab === 'link') {
      if (!url.trim()) return
      const result = await captureLink(url.trim(), linkTitle.trim() || undefined, linkNotes.trim() || undefined)
      if (result.success) {
        showSuccessAnimation()
        setTimeout(handleClose, 1200)
        toast.success('Link captured')
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } else if (activeTab === 'image') {
      if (!imageFile) {
        toast.error('Please select an image')
        return
      }
      const result = await captureImage(imageFile, imageTitle.trim() || undefined)
      if (result.success) {
        showSuccessAnimation()
        setTimeout(handleClose, 1200)
        toast.success('Image captured')
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } else if (activeTab === 'voice') {
      if (!recordedBlob) {
        toast.error('Please record audio first')
        return
      }
      const result = await captureVoice(recordedBlob, voiceTitle.trim() || undefined)
      if (result.success) {
        showSuccessAnimation()
        setTimeout(handleClose, 1200)
        toast.success('Voice note captured')
      } else {
        toast.error(result.error || 'Failed to save')
      }
    }
  }, [
    activeTab, title, content, url, linkTitle, linkNotes,
    imageFile, imageTitle, recordedBlob, voiceTitle,
    isAuthenticated, memories.length, requireAuth, handleClose,
    captureText, captureLink, captureImage, captureVoice,
    showSuccessAnimation,
  ])

  // ── Determine if save is disabled ──────────────────────────────────
  const isSaveDisabled = () => {
    if (isCapturing || isRecording) return true
    if (activeTab === 'text') return !content.trim()
    if (activeTab === 'link') return !url.trim()
    if (activeTab === 'image') return !imageFile
    if (activeTab === 'voice') return !recordedBlob
    return false
  }

  // ═════════════════════════════════════════════════════════════════
  // ─── TAB CONTENT ──────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════

  const tabContent = (
    <div className="relative">
      <SuccessOverlay show={showSuccess} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="text" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <FileText className="size-4" />
            <span className="hidden sm:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="link" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Link2 className="size-4" />
            <span className="hidden sm:inline">Link</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Mic className="size-4" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Text Tab ─────────────────────────────────────────────── */}
        <TabsContent value="text" className="space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="memory-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                id="memory-title"
                placeholder="Give your memory a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-content" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</Label>
              <Textarea
                id="memory-content"
                placeholder="Write your thoughts, notes, ideas..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[160px] resize-y bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Link Tab ─────────────────────────────────────────────── */}
        <TabsContent value="link" className="space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="link-url" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="link-url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => fetchLinkTitle()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchLinkTitle()
                  }}
                  className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchLinkTitle}
                  disabled={isFetchingTitle || !url.trim()}
                  className="shrink-0 bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  {isFetchingTitle ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                id="link-title"
                placeholder="Link title (auto-fetched or type manually)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</Label>
              <Textarea
                id="link-notes"
                placeholder="Add notes about this link..."
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                className="min-h-[100px] resize-y bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Image Tab ────────────────────────────────────────────── */}
        <TabsContent value="image" className="space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="image-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                id="image-title"
                placeholder="Image title..."
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>

            {!imagePreviewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300',
                  'bg-white/30 dark:bg-white/5 backdrop-blur-sm',
                  isDragging
                    ? 'border-primary/60 bg-primary/5 scale-[1.02]'
                    : 'border-white/30 hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <Upload className="size-10 text-muted-foreground/60 mb-3" />
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isDragging ? 'Drop your image here' : 'Drop an image or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  PNG, JPG, GIF, WebP — up to 10MB
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="rounded-xl overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(109,89,122,0.08)]">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[280px] object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
                  onClick={removeImage}
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        {/* ── Voice Tab ────────────────────────────────────────────── */}
        <TabsContent value="voice" className="space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="voice-title" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                id="voice-title"
                placeholder="Voice note title..."
                value={voiceTitle}
                onChange={(e) => setVoiceTitle(e.target.value)}
                className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_20px_50px_rgba(109,89,122,0.05)]">
              {/* Waveform visualization */}
              <WaveformBars isActive={isRecording} />

              {/* Timer */}
              <div className="text-center mt-3">
                <motion.span
                  className={cn(
                    'text-2xl font-mono font-light tracking-widest',
                    isRecording ? 'text-red-500' : 'text-muted-foreground'
                  )}
                  animate={isRecording ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {formatDuration(recordingDuration)}
                </motion.span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-5">
                {!isRecording ? (
                  <motion.div whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={handleStartRecording}
                      size="lg"
                      className={cn(
                        'rounded-full size-14 p-0 shadow-lg transition-all',
                        'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
                        'shadow-red-500/20 hover:shadow-red-500/30'
                      )}
                    >
                      <Mic className="size-6" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={handleStopRecording}
                      size="lg"
                      className="rounded-full size-14 p-0 shadow-lg bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                    >
                      <Square className="size-5" />
                    </Button>
                  </motion.div>
                )}

                {/* Playback button */}
                {recordedBlob && !isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Button
                      onClick={togglePlayback}
                      variant="outline"
                      size="lg"
                      className="rounded-full size-12 p-0 bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 hover:bg-primary/10 hover:border-primary/30"
                    >
                      {isPlaying ? (
                        <Square className="size-4" />
                      ) : (
                        <Play className="size-4 ml-0.5" />
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Status text */}
              <p className="text-center text-xs text-muted-foreground mt-3">
                {isRecording
                  ? 'Tap to stop recording'
                  : recordedBlob
                    ? 'Recording ready — listen back or save'
                    : 'Tap the microphone to start recording'}
              </p>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Save Button ────────────────────────────────────────────── */}
      <div className="pt-5 pb-2">
        <Button
          onClick={handleSave}
          disabled={isSaveDisabled()}
          className={cn(
            'w-full relative overflow-hidden transition-all duration-300',
            'bg-gradient-to-r from-primary to-[#8B6F9A] text-primary-foreground',
            'hover:opacity-90 hover:shadow-lg hover:shadow-primary/20',
            isCapturing && 'cursor-wait',
          )}
        >
          {isCapturing ? (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Loader2 className="size-4 animate-spin" />
              Saving & Synthesizing...
            </motion.div>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="size-4" />
              Save Memory
            </motion.span>
          )}
        </Button>
      </div>
    </div>
  )

  // ═════════════════════════════════════════════════════════════════
  // ─── RESPONSIVE: SHEET (desktop) / DRAWER (mobile) ──────────────
  // ═════════════════════════════════════════════════════════════════

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-lg font-semibold">New Memory</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Capture a thought, link, image, or voice note.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {tabContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-md overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-white/10"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">New Memory</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Capture a thought, link, image, or voice note.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {tabContent}
        </div>
      </SheetContent>
    </Sheet>
  )
}
