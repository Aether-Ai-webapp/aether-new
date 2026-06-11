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
import { cn } from '@/lib/utils'

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
  const { currentView, setCurrentView, darkMode } = useAetherStore()
  const isMobile = useIsMobile()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [addMemoryOpen, setAddMemoryOpen] = useState(false)

  const sidebarWidth = sidebarExpanded ? 200 : 64

  return (
    <div className={cn('min-h-dvh flex flex-col transition-theme', darkMode && 'dark')}>
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-sidebar transition-theme"
            animate={{ width: sidebarWidth }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
              <Brain className="size-6 text-primary shrink-0" />
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-semibold text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Aether
                  </motion.span>
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
                        <button
                          onClick={() => setCurrentView(item.view)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <Icon className="size-5 shrink-0" />
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
            <div className="p-3 border-t border-border shrink-0">
              <Button
                onClick={() => setAddMemoryOpen(true)}
                className={cn(
                  'w-full gap-2 bg-gradient-to-r from-primary to-[#8B6F9A] text-primary-foreground hover:opacity-90 shadow-md',
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-bottom transition-theme">
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
                    isActive
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
              onClick={() => setAddMemoryOpen(true)}
              className="flex items-center justify-center size-12 -mt-6 rounded-full bg-gradient-to-r from-primary to-[#8B6F9A] text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all"
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
                    isActive
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
    </div>
  )
}
