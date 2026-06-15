'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, Layers, Settings, Brain, LogIn, LogOut } from 'lucide-react'
import { useAetherStore, type AppView } from '@/lib/aether-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NavItem {
  view: AppView
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { view: 'dashboard', icon: Home },
  { view: 'ask', icon: Search },
  { view: 'collections', icon: Layers },
  { view: 'settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, isAuthenticated, setShowAuthModal, logout } = useAetherStore()
  const isMobile = useIsMobile()

  const handleSignOut = async () => {
    await logout()
    toast.success('Signed out')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* ── Desktop Sidebar: Icon-only rail ──────────────────────── */}
        {!isMobile && (
          <aside className="h-screen fixed left-0 top-0 z-40 w-14 flex flex-col bg-white/50 backdrop-blur-xl border-r border-black/[0.03]">
            {/* Logo */}
            <div className="flex items-center justify-center h-14 shrink-0 border-b border-black/[0.03]">
              <div className="size-9 rounded-xl bg-zinc-900 flex items-center justify-center">
                <Brain className="size-5 text-white" />
              </div>
            </div>

            {/* Nav icons */}
            <nav className="flex-1 py-3 flex flex-col items-center gap-1 px-0">
              {navItems.map((item) => {
                const isActive = currentView === item.view
                const Icon = item.icon
                return (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                      isActive
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60'
                    )}
                  >
                    <Icon className="size-5" />
                  </button>
                )
              })}
            </nav>

            {/* Bottom: Auth icon */}
            <div className="py-3 flex flex-col items-center shrink-0 border-t border-black/[0.03]">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60 transition-all duration-200"
                >
                  <LogOut className="size-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60 transition-all duration-200"
                >
                  <LogIn className="size-5" />
                </button>
              )}
            </div>
          </aside>
        )}

        {/* ── Main Content Area ────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0 transition-all duration-300 md:ml-14">
          {/* Mobile header */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 h-12 shrink-0 bg-white/50 backdrop-blur-xl border-b border-black/[0.03]">
              <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Brain className="size-4 text-white" />
              </div>
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="size-4" />
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
                className="p-4 md:p-6 lg:p-10"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/50 backdrop-blur-xl border-t border-black/[0.03]">
          <div className="flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const isActive = currentView === item.view
              const Icon = item.icon
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={cn(
                    'flex items-center justify-center w-12 h-10 rounded-xl transition-all min-w-[44px] min-h-[44px]',
                    isActive
                      ? 'text-purple-600'
                      : 'text-zinc-400'
                  )}
                >
                  <Icon className="size-5" />
                </button>
              )
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  )
}
