'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAetherStore, type Memory, type MemoryType } from '@/lib/aether-store'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  X,
  Trash2,
  Link2,
  FileText,
  CheckCircle2,
  Brain,
  Clock,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PaywallModal } from '@/components/aether/PaywallModal'

// ─── Helpers ────────────────────────────────────────────────────────

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
}

// ─── Mobile Auth Drawer (built into Dashboard) ─────────────────────

function MobileAuthDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { login, signup } = useAetherStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const resetForm = useCallback(() => {
    setEmail('')
    setPassword('')
    setName('')
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    setTimeout(resetForm, 300)
  }, [onClose, resetForm])

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
        handleClose()
      } else {
        toast.error(mode === 'login' ? 'Invalid email or password' : 'Signup failed')
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
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-50"
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
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Dashboard Component ────────────────────────────────────────────

export function Dashboard() {
  const {
    memories,
    saveMemory,
    addMemory,
    deleteMemoryFromDB,
    isLoading,
    isAuthenticated,
    requireAuth,
    fetchMemories,
  } = useAetherStore()

  // ── Local State ──────────────────────────────────────────────────
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

  // Memory drawer state
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false)

  // BUG 2 FIX: Mobile auth drawer state
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)

  // Pending capture for auth gate
  const pendingCaptureTextRef = useRef<string>('')
  const pendingImageRef = useRef<{ file: File; url: string; name: string } | null>(null)

  // Input ref
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Fetch memories on mount ──────────────────────────────────────
  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  // ── Sorted memories ──────────────────────────────────────────────
  const sortedMemories = useMemo(() => {
    return [...memories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [memories])

  // ── BUG 1 FIX: Save with explicit optimistic state push ────────
  const handleSave = useCallback(async (text: string, imageFile: File | null = null) => {
    const trimmed = text.trim()
    if (!trimmed && !imageFile) return

    setIsSaving(true)
    setShowCaptureAnimation(true)

    try {
      const detected = detectContentType(trimmed || 'image')
      const memoryType = mapToMemoryType(detected)

      let imageUrl: string | null = null
      if (imageFile) {
        try {
          const formData = new FormData()
          formData.append('file', imageFile)
          formData.append('type', 'image')

          const uploadRes = await fetch('/api/memories', {
            method: 'POST',
            body: formData,
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            imageUrl = uploadData.fileUrl || uploadData.imagePreview || null
          }
        } catch {
          // continue without image URL
        }
      }

      const contentToSave = trimmed || (imageFile ? `Image: ${imageFile.name}` : '')
      const titleToSave = trimmed
        ? trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed
        : imageFile ? `Image: ${imageFile.name}` : ''

      // Call saveMemory which persists to DB
      const savedMemory = await saveMemory({
        type: imageFile ? 'image' : memoryType,
        title: titleToSave,
        content: contentToSave,
        sourceUrl: detected === 'link' ? trimmed : null,
        ...(imageUrl ? { imageUrl } : {}),
      })

      // BUG 1 FIX: Explicitly push the saved memory to the top of the feed
      // This guarantees the UI updates even if store reactivity is delayed
      if (savedMemory) {
        addMemory(savedMemory)
      }

      setCaptureText('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } catch (error) {
      console.error('Failed to save memory:', error)
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
      setTimeout(() => setShowCaptureAnimation(false), 300)
    }
  }, [saveMemory, addMemory])

  // ── BUG 2 FIX: Auth-gated capture with mobile drawer ────────────
  const handleCaptureSubmit = useCallback(() => {
    const text = captureText
    const image = imagePreview

    if (!text.trim() && !image) return

    // Paywall check
    if (memories.length >= 10 && !isAuthenticated) {
      setShowPaywall(true)
      return
    }

    if (!isAuthenticated) {
      // Stash the capture text and image
      pendingCaptureTextRef.current = text
      pendingImageRef.current = image

      // Clear input immediately
      setCaptureText('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // BUG 2 FIX: Show mobile auth drawer directly
      setIsAuthDrawerOpen(true)

      // Also use requireAuth so the store queues the pending action
      // When login succeeds, the store will execute this callback
      requireAuth(async () => {
        const pendingText = pendingCaptureTextRef.current
        const pendingImage = pendingImageRef.current
        pendingCaptureTextRef.current = ''
        pendingImageRef.current = null

        if (pendingText.trim() || pendingImage) {
          await handleSave(pendingText, pendingImage?.file ?? null)
        }
      })
      return
    }

    handleSave(text, image?.file ?? null)
  }, [captureText, imagePreview, memories.length, isAuthenticated, requireAuth, handleSave])

  // ── BUG 2 FIX: Mic button auth gate ─────────────────────────────
  const handleMicClick = useCallback(() => {
    if (!isAuthenticated) {
      setIsAuthDrawerOpen(true)
      requireAuth(async () => {
        // After auth, user can try recording again
      })
      return
    }
    // If authenticated, start/stop recording
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isAuthenticated, isRecording, requireAuth])

  // ── Voice recording ──────────────────────────────────────────────
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

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (res.ok) {
            const data = await res.json()
            if (data.text?.trim()) {
              setCaptureText((prev) => prev ? `${prev} ${data.text.trim()}` : data.text.trim())
            }
          } else {
            toast.error('Transcription failed')
          }
        } catch {
          toast.error('Transcription failed')
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
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // ── Image upload ─────────────────────────────────────────────────
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [imagePreview])

  // ── Memory drawer ────────────────────────────────────────────────
  const openDrawer = useCallback((memory: Memory) => {
    setSelectedMemory(memory)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedMemory(null), 300)
  }, [])

  // ── Delete memory ────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMemoryFromDB(id)
      closeDrawer()
    } catch {
      toast.error('Failed to delete')
    }
  }, [deleteMemoryFromDB, closeDrawer])

  // ── Keyboard handler ─────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCaptureSubmit()
    }
  }, [handleCaptureSubmit])

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* ── Memory Feed ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <div className="max-w-2xl mx-auto">
          {isLoading && memories.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-6 animate-spin text-gray-300" />
            </div>
          ) : sortedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Brain className="size-10 text-gray-200" />
            </div>
          ) : (
            <div className="divide-y divide-black/[0.03]">
              <AnimatePresence mode="popLayout">
                {sortedMemories.map((memory, index) => {
                  const detected = detectContentType(memory.content || memory.title)
                  const IconComponent = typeIconMap[detected] || FileText
                  const staggerDelay = Math.min(index * 0.03, 0.15)

                  return (
                    <motion.button
                      key={memory.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, delay: staggerDelay, ease: 'easeOut' }}
                      onClick={() => openDrawer(memory)}
                      className="w-full flex items-center gap-3 py-3.5 px-1 text-left group hover:bg-black/[0.015] rounded-lg transition-colors"
                    >
                      <div className="shrink-0 size-8 flex items-center justify-center">
                        <IconComponent className="size-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
                          {memory.title || memory.content}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-300 tabular-nums">
                        {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                      </span>
                      <ChevronRight className="size-4 text-gray-200 group-hover:text-gray-300 shrink-0 transition-colors" />
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Capture Bar ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-4 pt-2 md:px-0">
        <div className="max-w-2xl mx-auto">
          {/* Image preview pill */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mb-2 inline-flex items-center gap-2 bg-white/90 border border-black/[0.06] rounded-xl pl-1.5 pr-2.5 py-1.5 shadow-sm"
              >
                <img src={imagePreview.url} alt={imagePreview.name} className="size-8 rounded-lg object-cover" />
                <span className="text-xs text-gray-500 max-w-[120px] truncate">{imagePreview.name}</span>
                <button onClick={removeImage} className="size-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X className="size-3 text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass capsule input */}
          <div
            className={cn(
              'bg-white/80 border border-black/[0.04] shadow-sm backdrop-blur-xl rounded-2xl p-2',
              'focus-within:border-purple-300/60 focus-within:shadow-[0_0_40px_rgba(168,85,247,0.04)]',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-center gap-1.5">
              {/* Mic button */}
              <button
                onClick={handleMicClick}
                disabled={isTranscribing || isSaving}
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center transition-all shrink-0',
                  isRecording
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : isTranscribing
                      ? 'bg-gray-50 text-gray-400'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
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
                placeholder=""
                disabled={isSaving}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 outline-none min-w-0 py-1.5 px-1"
              />

              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all shrink-0"
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
                disabled={(!captureText.trim() && !imagePreview) || isSaving}
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center transition-all shrink-0',
                  captureText.trim() || imagePreview
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
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
        </div>
      </div>

      {/* ── Memory Drawer (slide-out from right) ──────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
              onClick={closeDrawer}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white/95 backdrop-blur-2xl border-l border-black/[0.04] z-50 flex flex-col overflow-hidden"
            >
              {selectedMemory && (
                <>
                  <div className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-black/[0.04]">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="size-3.5" />
                      {formatDistanceToNow(new Date(selectedMemory.createdAt), { addSuffix: true })}
                    </div>
                    <button
                      onClick={closeDrawer}
                      className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                      {selectedMemory.title || selectedMemory.content}
                    </h2>

                    {selectedMemory.summary && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                          <Sparkles className="size-3" />
                          AI Recap
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {selectedMemory.summary}
                        </p>
                      </div>
                    )}

                    {selectedMemory.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-black/[0.04]">
                        <img src={selectedMemory.imageUrl} alt={selectedMemory.title} className="w-full object-cover max-h-64" />
                      </div>
                    )}

                    {(selectedMemory.imagePreview || selectedMemory.fileUrl) && !selectedMemory.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-black/[0.04]">
                        <img src={selectedMemory.imagePreview || selectedMemory.fileUrl || ''} alt={selectedMemory.title} className="w-full object-cover max-h-64" />
                      </div>
                    )}

                    {selectedMemory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMemory.tags.map((tag) => (
                          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{tag}</span>
                        ))}
                      </div>
                    )}

                    {selectedMemory.collections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMemory.collections.map((col) => (
                          <span key={col.id} className="text-[11px] px-2 py-0.5 rounded-full border border-black/[0.06] text-gray-500 font-medium flex items-center gap-1">
                            {col.icon && <span>{col.icon}</span>}
                            {col.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedMemory.content && selectedMemory.content !== selectedMemory.title && (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedMemory.content}
                      </div>
                    )}

                    {selectedMemory.sourceUrl && (
                      <a href={selectedMemory.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 transition-colors break-all">
                        <Link2 className="size-3 shrink-0" />
                        {selectedMemory.sourceUrl}
                      </a>
                    )}

                    <div className="text-[11px] text-gray-300">
                      {new Date(selectedMemory.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="shrink-0 px-6 py-4 border-t border-black/[0.04]">
                    <button
                      onClick={() => handleDelete(selectedMemory.id)}
                      className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BUG 2 FIX: Mobile Auth Drawer ────────────────────────── */}
      <MobileAuthDrawer
        open={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
      />

      {/* ── Paywall Modal ────────────────────────────────────────── */}
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isDark={false} />
    </div>
  )
}
