'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Sparkles, MessageCircle } from 'lucide-react'
import { useAetherStore, type ChatMessage } from '@/lib/aether-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

// ─── Suggestion chips ────────────────────────────────────────────────
const suggestions = [
  'What did I save this week?',
  'Summarize my recent notes',
  'Find links about design',
  'What are my favorite memories?',
]

// ─── Animation variants ──────────────────────────────────────────────
const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

const dotBounce = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ─── Typing indicator ────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className="flex items-end gap-2"
    >
      {/* Aether avatar */}
      <div className="size-7 rounded-full bg-gradient-to-br from-primary to-[#8B6F9A] flex items-center justify-center shrink-0 shadow-sm">
        <Brain className="size-3.5 text-white" />
      </div>

      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-2 rounded-full bg-muted-foreground/40"
              {...dotBounce}
              transition={{
                ...dotBounce.animate.transition,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Single message bubble ───────────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Aether avatar for assistant */}
      {!isUser && (
        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-[#8B6F9A] flex items-center justify-center shrink-0 shadow-sm">
          <Brain className="size-3.5 text-white" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-primary to-[#8B6F9A] text-white rounded-br-sm'
            : 'bg-card border border-border text-card-foreground rounded-bl-sm'
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert
            prose-p:leading-relaxed prose-p:my-1
            prose-headings:my-2 prose-headings:text-foreground
            prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
            prose-code:text-[#6D597A] prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border
            prose-strong:text-foreground
            prose-a:text-primary prose-a:underline">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="size-7 rounded-full bg-[#E07A5F] flex items-center justify-center shrink-0 shadow-sm">
          <MessageCircle className="size-3.5 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────
function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-full px-4 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        className="size-20 rounded-2xl bg-gradient-to-br from-primary/10 to-[#8B6F9A]/10 flex items-center justify-center mb-6 shadow-sm"
      >
        <Brain className="size-10 text-primary" />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        Ask me anything about your memories
      </h3>

      <p className="text-sm text-muted-foreground max-w-[280px] mb-8">
        I can search, summarize, and find patterns across everything you&apos;ve saved.
      </p>

      <div className="flex flex-wrap justify-center gap-2 max-w-[360px]">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground
              hover:bg-accent hover:border-primary/30 hover:shadow-sm
              active:scale-[0.97] transition-all duration-150"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main AskAether component ────────────────────────────────────────
export function AskAether() {
  const { chatMessages, addChatMessage, clearChat } = useAetherStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Auto-scroll to bottom ─────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isLoading, scrollToBottom])

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      addChatMessage(userMessage)
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed }),
        })

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`)
        }

        // Stream response
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        const assistantId = `assistant-${Date.now()}`

        // Add empty assistant message that we'll update
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }
        addChatMessage(assistantMessage)

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            accumulated += chunk

            // Update the assistant message in the store
            useAetherStore.setState((state) => ({
              chatMessages: state.chatMessages.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: accumulated }
                  : msg
              ),
            }))
          }
        }
      } catch (error) {
        // Add error message as assistant
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'I\'m sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        }
        addChatMessage(errorMessage)
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [isLoading, addChatMessage]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (text: string) => {
    sendMessage(text)
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)] max-w-3xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-[#8B6F9A] flex items-center justify-center shadow-md">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Ask Aether
              </h1>
              <p className="text-xs text-muted-foreground">
                Search through your memories with AI
              </p>
            </div>
          </div>

          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="pr-2">
            <AnimatePresence mode="popLayout">
              {chatMessages.length === 0 && !isLoading ? (
                <EmptyState onSuggestionClick={handleSuggestionClick} />
              ) : (
                <div className="flex flex-col gap-4 py-2 pb-4">
                  {chatMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {isLoading &&
                    chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                      <TypingIndicator />
                    )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* ── Input Area ─────────────────────────────────────────────── */}
      <div className="shrink-0 pt-3 pb-2">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your memories..."
              disabled={isLoading}
              className="rounded-xl h-11 pl-4 pr-4 text-sm border-border
                focus-visible:ring-primary/30 focus-visible:border-primary/50
                bg-background shadow-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="size-11 rounded-xl bg-gradient-to-br from-primary to-[#8B6F9A]
              hover:opacity-90 active:scale-95 transition-all shadow-md
              disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          Aether AI may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
