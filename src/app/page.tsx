'use client'

import React, { useEffect } from 'react'
import { useAetherStore } from '@/lib/aether-store'
import { AppShell } from '@/components/aether/AppShell'
import { Dashboard } from '@/components/aether/Dashboard'
import { AskAether } from '@/components/aether/AskAether'
import { Collections } from '@/components/aether/Collections'
import { Memories } from '@/components/aether/Memories'
import { Settings } from '@/components/aether/Settings'
import { AuthScreen } from '@/components/aether/AuthScreen'

function ViewRouter() {
  const currentView = useAetherStore((s) => s.currentView)

  const views: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    ask: <AskAether />,
    collections: <Collections />,
    memories: <Memories />,
    settings: <Settings />,
  }

  return <>{views[currentView] || <Dashboard />}</>
}

function DataLoader({ children }: { children: React.ReactNode }) {
  const { setMemories, setCollections, setLoading } = useAetherStore()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [memoriesRes, collectionsRes] = await Promise.all([
          fetch('/api/memories'),
          fetch('/api/collections'),
        ])

        if (memoriesRes.ok) {
          const memories = await memoriesRes.json()
          setMemories(memories)
        }

        if (collectionsRes.ok) {
          const collections = await collectionsRes.json()
          setCollections(collections)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setMemories, setCollections, setLoading])

  return <>{children}</>
}

export default function Home() {
  const { isAuthenticated, isAuthLoading, checkSession } = useAetherStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#FFFAF5]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-[#6D597A] to-[#8B6F9A] flex items-center justify-center shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7Z" />
              <path d="M9 22h6" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading Aether...</p>
        </div>
      </div>
    )
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  // Show the main app
  return (
    <DataLoader>
      <AppShell>
        <ViewRouter />
      </AppShell>
    </DataLoader>
  )
}
