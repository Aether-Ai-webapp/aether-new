'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  MessageCircle,
  FolderOpen,
  BookOpen,
  Settings,
  Plus,
  Brain,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useAetherStore, type AppView } from '@/lib/aether-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AddMemorySheet } from '@/components/aether/AddMemorySheet'
import { AuthModal } from '@/components/aether/AuthModal'
import { AuroraBackground } from '@/components/aether/AuroraBackground'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NavItem {
  view: AppView
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: Home },
  { view: 'ask', label: 'Ask Aether', icon: MessageCircle },
  { view: 'collections', label: 'Collections', icon: FolderOpen },
  { view: 'memories', label: 'Memories', icon: BookOpen },
  { view: 'settings', label: 'Settings', icon: Settings },
]

const mobileNavItems: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  { view: 'ask', label: 'Ask', icon: MessageCircle },
  { view: 'collections', label: 'Collections', icon: FolderOpen },
  { view: 'memories', label: 'Memories', icon: BookOpen },
  { view: 'settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, darkMode, isAuthenticated, user, setShowAuthModal, logout } = useAetherStore()
  const isMobile = useIsMobile()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [addMemoryOpen, setAddMemoryOpen] = useState(false)

  const sidebarWidth = sidebarExpanded ? 200 : 64
  const isDark = darkMode

  const handleAddMemory = () => {
    setAddMemoryOpen(true)
  }

  const handleSignOut = async () => {
    await logout()
    toast.success('Signed out')
  }

  return (
    <div className={cn('min-h-dvh flex flex-col transition-theme', isDark && 'dark')}>
      {/* ── Aurora Mesh Gradient (Dark Mode) ───────────────────────── */}
      {isDark && <AuroraBackground />}

      <div className="relative z-10 flex flex-1 min-h-0">
        {/* ── Premium Glassmorphic Sidebar (Desktop) ──────────────── */}
        {!isMobile && (
          <motion.aside
            className={cn(
              'fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-theme',
              isDark
                ? 'bg-white/[0.02] backdrop-blur-2xl border-r border-white/[0.05]'
                : 'bg-sidebar border-r border-border'
            )}
            animate={{ width: sidebarWidth }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
          >
            {/* Logo + Auth Header */}
            <div className={cn(
              'flex items-center justify-between gap-2 px-4 h-16 shrink-0',
              isDark ? 'border-b border-white/[0.05]' : 'border-b border-border'
            )}>
              <div className="flex items-center gap-2 min-w-0">
                <Brain className={cn('size-6 shrink-0', isDark ? 'text-purple-400' : 'text-primary')} />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'text-2xl font-bold whitespace-nowrap overflow-hidden',
                        isDark
                          ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'
                          : 'text-foreground'
                      )}
                    >
                      AETHER
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth button in sidebar header */}
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="shrink-0"
                  >
                    {isAuthenticated ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 text-xs gap-1 px-2',
                          isDark ? 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]' : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={handleSignOut}
                      >
                        <LogOut className="size-3" />
                        Log Out
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 text-xs gap-1 px-2',
                          isDark ? 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]' : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={() => setShowAuthModal(true)}
                      >
                        <LogIn className="size-3" />
                        Sign In
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
              <TooltipProvider delayDuration={0}>
                {navItems.map((item) => {
                  const isActive = currentView === item.view
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.view}>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <button
                            onClick={() => setCurrentView(item.view)}
                            className={cn(
                              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 w-full',
                              isDark
                                ? isActive
                                  ? 'text-purple-400 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                                  : 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]'
                                : isActive
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <Icon className="w-5 h-5 shrink-0" />
                            <AnimatePresence>
                              {sidebarExpanded && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="whitespace-nowrap overflow-hidden"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        </motion.div>
                      </TooltipTrigger>
                      {!sidebarExpanded && (
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
            </nav>

            {/* Add Memory Button */}
            <div className={cn('p-3 shrink-0', isDark ? 'border-t border-white/[0.05]' : 'border-t border-border')}>
              <Button
                onClick={handleAddMemory}
                className={cn(
                  'w-full gap-2 hover:opacity-90 shadow-md',
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]'
                    : 'bg-gradient-to-r from-primary to-[#8B6F9A] text-primary-foreground',
                  sidebarExpanded ? 'justify-start px-3' : 'justify-center px-0'
                )}
                size={sidebarExpanded ? 'default' : 'icon'}
              >
                <Plus className="size-5 shrink-0" />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Add Memory
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </motion.aside>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-0 transition-all duration-200',
            !isMobile && 'ml-[64px]'
          )}
        >
          {/* Top auth bar on mobile */}
          {isMobile && (
            <div className={cn(
              'flex items-center justify-between px-4 h-12 shrink-0',
              isDark
                ? 'bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05]'
                : 'bg-background border-b border-border'
            )}>
              <div className="flex items-center gap-2">
                <Brain className={cn('size-5', isDark ? 'text-purple-400' : 'text-primary')} />
                <span className={cn(
                  'font-semibold text-sm',
                  isDark
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'
                    : 'text-foreground'
                )}>
                  AETHER
                </span>
              </div>
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 text-xs gap-1 px-2',
                    isDark ? 'text-white/30 hover:text-white/70' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={handleSignOut}
                >
                  <LogOut className="size-3" />
                  Log Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 text-xs gap-1 px-2',
                    isDark ? 'text-white/30 hover:text-white/70' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="size-3" />
                  Sign In
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="p-4 md:p-6 lg:p-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Premium Mobile Bottom Navigation ──────────────────────── */}
      {isMobile && (
        <nav className={cn(
          'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom transition-theme',
          isDark
            ? 'bg-white/[0.02] backdrop-blur-2xl border-t border-white/[0.05]'
            : 'bg-background border-t border-border'
        )}>
          <div className="flex items-center justify-around h-16 px-2 relative">
            {mobileNavItems.slice(0, 2).map((item) => {
              const isActive = currentView === item.view
              const Icon = item.icon
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[48px] min-h-[44px]',
                    isDark
                      ? isActive
                        ? 'text-purple-400'
                        : 'text-white/30'
                      : isActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}

            {/* Floating Add Button */}
            <button
              onClick={handleAddMemory}
              className={cn(
                'flex items-center justify-center size-12 -mt-6 rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all',
                isDark
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)]'
                  : 'bg-gradient-to-r from-primary to-[#8B6F9A] text-primary-foreground'
              )}
            >
              <Plus className="size-6" />
            </button>

            {mobileNavItems.slice(2).map((item) => {
              const isActive = currentView === item.view
              const Icon = item.icon
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[48px] min-h-[44px]',
                    isDark
                      ? isActive
                        ? 'text-purple-400'
                        : 'text-white/30'
                      : isActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
          {/* Safe area padding for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}

      {/* Add Memory Sheet */}
      <AddMemorySheet
        open={addMemoryOpen}
        onOpenChange={setAddMemoryOpen}
      />

      {/* Auth Modal — global */}
      <AuthModal />
    </div>
  )
}
