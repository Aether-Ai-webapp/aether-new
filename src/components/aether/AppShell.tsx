'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  Layers,
  Settings,
  Plus,
  Brain,
  LogIn,
  LogOut,
  Menu,
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
  { view: 'ask', label: 'Ask Aether', icon: Search },
  { view: 'collections', label: 'Collections', icon: Layers },
  { view: 'settings', label: 'Settings', icon: Settings },
]

const mobileNavItems: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  { view: 'ask', label: 'Ask', icon: Search },
  { view: 'collections', label: 'Collections', icon: Layers },
  { view: 'settings', label: 'Settings', icon: Settings },
]

// ── Custom easing: [0.22, 1, 0.36, 1] ──────────────────────────────
const pageEasing = [0.22, 1, 0.36, 1] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, darkMode, isAuthenticated, user, setShowAuthModal, logout } = useAetherStore()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [addMemoryOpen, setAddMemoryOpen] = useState(false)

  const isDark = darkMode

  const handleAddMemory = () => {
    setAddMemoryOpen(true)
  }

  const handleSignOut = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className={cn(
      'min-h-dvh flex flex-col transition-colors duration-500',
      isDark ? 'bg-[#06060a]' : 'bg-[#f8f9fc]'
    )}>
      {/* ── Living Aurora Background (Both Modes) ──────────────────── */}
      <AuroraBackground isDark={isDark} />

      <div className="relative z-10 flex flex-1 min-h-0">
        {/* ── Glassmorphic Sidebar (Desktop) ────────────────────────── */}
        {!isMobile && (
          <aside
            className={cn(
              'h-screen fixed left-0 top-0 z-40 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
              isSidebarOpen ? 'w-64' : 'w-20',
              isDark
                ? 'bg-white/[0.02] backdrop-blur-2xl border-r border-white/[0.04]'
                : 'bg-white/60 backdrop-blur-2xl border-r border-gray-200/50'
            )}
          >
            {/* Logo + Toggle Header */}
            <div className={cn(
              'flex items-center justify-between gap-2 h-16 shrink-0 px-4',
              isDark ? 'border-b border-white/[0.04]' : 'border-b border-gray-200/50'
            )}>
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Brain className={cn('size-6 shrink-0', isDark ? 'text-purple-400' : 'text-purple-600')} />
                <span className={cn(
                  'text-2xl font-bold whitespace-nowrap transition-opacity duration-200',
                  isSidebarOpen ? 'opacity-100' : 'opacity-0',
                  isDark
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'
                    : 'text-gray-900'
                )}>
                  AETHER
                </span>
              </div>

              {/* Toggle button — always visible */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={cn(
                  'size-8 flex items-center justify-center rounded-lg shrink-0 transition-colors duration-150',
                  isDark
                    ? 'text-white/30 hover:text-white/70 hover:bg-white/[0.04]'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                <Menu className="size-4" />
              </button>
            </div>

            {/* Navigation — 4 icons */}
            <nav className="flex-1 py-4 flex flex-col space-y-1 px-2 overflow-y-auto overflow-x-hidden">
              <TooltipProvider delayDuration={0}>
                {navItems.map((item) => {
                  const isActive = currentView === item.view
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.view}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setCurrentView(item.view)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium leading-none transition-all duration-200 w-full',
                            isDark
                              ? isActive
                                ? 'text-purple-400 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                                : 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]'
                              : isActive
                                ? 'text-purple-700 bg-purple-50 rounded-xl shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)]'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100/60'
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className={cn(
                            'whitespace-nowrap transition-opacity duration-200',
                            isSidebarOpen ? 'opacity-100' : 'opacity-0'
                          )}>
                            {item.label}
                          </span>
                        </button>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
            </nav>

            {/* Auth section */}
            <div className={cn(
              'px-4 pb-2 shrink-0 overflow-hidden',
              isSidebarOpen ? 'h-auto' : 'h-0',
              isDark ? '' : ''
            )}>
              {isSidebarOpen && (
                <div className="flex items-center justify-center">
                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-7 text-xs gap-1 px-2 w-full justify-center',
                        isDark ? 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
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
                        'h-7 text-xs gap-1 px-2 w-full justify-center',
                        isDark ? 'text-white/30 hover:text-white/70 hover:bg-white/[0.03]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      )}
                      onClick={() => setShowAuthModal(true)}
                    >
                      <LogIn className="size-3" />
                      Sign In
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Add Memory Button */}
            <div className={cn('p-3 shrink-0', isDark ? 'border-t border-white/[0.04]' : 'border-t border-gray-200/50')}>
              <Button
                onClick={handleAddMemory}
                className={cn(
                  'w-full gap-2 hover:opacity-90 shadow-md',
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]',
                  isSidebarOpen ? 'justify-start px-3' : 'justify-center px-0'
                )}
                size={isSidebarOpen ? 'default' : 'icon'}
              >
                <Plus className="size-5 shrink-0" />
                <span className={cn(
                  'whitespace-nowrap transition-opacity duration-200',
                  isSidebarOpen ? 'opacity-100' : 'opacity-0'
                )}>
                  Add Memory
                </span>
              </Button>
            </div>
          </aside>
        )}

        {/* ── Main Content Area ────────────────────────────────────── */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out',
            !isMobile && (isSidebarOpen ? 'ml-64' : 'ml-20')
          )}
        >
          {/* Top auth bar on mobile */}
          {isMobile && (
            <div className={cn(
              'flex items-center justify-between px-4 h-12 shrink-0',
              isDark
                ? 'bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.04]'
                : 'bg-white/60 backdrop-blur-xl border-b border-gray-200/50'
            )}>
              <div className="flex items-center gap-2">
                <Brain className={cn('size-5', isDark ? 'text-purple-400' : 'text-purple-600')} />
                <span className={cn(
                  'font-semibold text-sm',
                  isDark
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'
                    : 'text-gray-900'
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
                    isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'
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
                    isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: pageEasing as unknown as number[] }}
                className="p-8 md:p-12"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      {isMobile && (
        <nav className={cn(
          'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom',
          isDark
            ? 'bg-white/[0.02] backdrop-blur-2xl border-t border-white/[0.04]'
            : 'bg-white/60 backdrop-blur-2xl border-t border-gray-200/50'
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
                        ? 'text-purple-700'
                        : 'text-gray-400'
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
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)]'
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
                        ? 'text-purple-700'
                        : 'text-gray-400'
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
