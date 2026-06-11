'use client'

import React, { useEffect } from 'react'
import { useAetherStore, type AppView } from '@/lib/aether-store'
import { AppShell } from '@/components/aether/AppShell'
import { Dashboard } from '@/components/aether/Dashboard'
import { AskAether } from '@/components/aether/AskAether'
import { Collections } from '@/components/aether/Collections'
import { Memories } from '@/components/aether/Memories'
import { Settings } from '@/components/aether/Settings'

function ViewRouter() {
  const currentView = useAetherStore((s) => s.currentView)

  const views: Record<AppView, React.ReactNode> = {
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
  return (
    <DataLoader>
      <AppShell>
        <ViewRouter />
      </AppShell>
    </DataLoader>
  )
}
