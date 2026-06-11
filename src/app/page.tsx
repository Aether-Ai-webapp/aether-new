'use client'

import React, { useEffect } from 'react'
import { useAetherStore } from '@/lib/aether-store'
import { AppShell } from '@/components/aether/AppShell'
import { Dashboard } from '@/components/aether/Dashboard'
import { AskAether } from '@/components/aether/AskAether'
import { Collections } from '@/components/aether/Collections'
import { Memories } from '@/components/aether/Memories'
import { Settings } from '@/components/aether/Settings'
import { AuthModal } from '@/components/aether/AuthModal'

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
  const { fetchMemories, fetchCollections, setLoading } = useAetherStore()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([fetchMemories(), fetchCollections()])
      setLoading(false)
    }
    loadData()
  }, [fetchMemories, fetchCollections, setLoading])

  return <>{children}</>
}

export default function Home() {
  const { checkSession } = useAetherStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // The app IS the landing page. Render immediately.
  return (
    <DataLoader>
      <AppShell>
        <ViewRouter />
      </AppShell>
      <AuthModal />
    </DataLoader>
  )
}
