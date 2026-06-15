'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAetherStore } from '@/lib/aether-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { AppShell } from '@/components/aether/AppShell'
import { Dashboard } from '@/components/aether/Dashboard'
import { AskAether } from '@/components/aether/AskAether'
import { Collections } from '@/components/aether/Collections'
import { Settings } from '@/components/aether/Settings'
import { LandingPage } from '@/components/aether/LandingPage'
import { AuthDrawer } from '@/components/aether/AuthModal'

function ViewRouter() {
  const currentView = useAetherStore((s) => s.currentView)
  const views: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    ask: <AskAether />,
    collections: <Collections />,
    settings: <Settings />,
  }
  return <>{views[currentView] || <Dashboard />}</>
}

function DataLoader({ children }: { children: React.ReactNode }) {
  const { fetchMemories, fetchCollections } = useAetherStore()
  useEffect(() => {
    fetchMemories()
    fetchCollections()
  }, [fetchMemories, fetchCollections])
  return <>{children}</>
}

export default function Home() {
  const { checkSession, isAuthenticated } = useAetherStore()
  const isMobile = useIsMobile()
  const [hasEnteredApp, setHasEnteredApp] = useState(false)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const handleEnterApp = useCallback(() => {
    setHasEnteredApp(true)
  }, [])

  // Mobile: Always render the app immediately
  if (isMobile) {
    return (
      <DataLoader>
        <AppShell>
          <ViewRouter />
        </AppShell>
        <AuthDrawer />
      </DataLoader>
    )
  }

  // Desktop: If authenticated or user entered, show app
  const showApp = hasEnteredApp || isAuthenticated

  if (!showApp) {
    return (
      <>
        <LandingPage onEnterApp={handleEnterApp} />
        <AuthDrawer />
      </>
    )
  }

  return (
    <DataLoader>
      <AppShell>
        <ViewRouter />
      </AppShell>
      <AuthDrawer />
    </DataLoader>
  )
}
