'use client'

import React, { useEffect } from 'react'
import { useAetherStore } from '@/lib/aether-store'
import { AppShell } from '@/components/aether/AppShell'
import { Dashboard } from '@/components/aether/Dashboard'
import { AskAether } from '@/components/aether/AskAether'
import { Collections } from '@/components/aether/Collections'
import { Settings } from '@/components/aether/Settings'
import { DesktopLanding } from '@/components/aether/DesktopLanding'
import { MobileApp } from '@/components/aether/MobileApp'
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

export default function Home() {
  const { checkSession, fetchMemories, fetchCollections, isAuthenticated } = useAetherStore()

  useEffect(() => {
    checkSession()
    fetchMemories()
    fetchCollections()
  }, [checkSession, fetchMemories, fetchCollections])

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Desktop: Landing page for unauthenticated, App for authenticated ── */}
      <div className="hidden md:block">
        {isAuthenticated ? (
          <>
            <AppShell>
              <ViewRouter />
            </AppShell>
            <AuthDrawer />
          </>
        ) : (
          <DesktopLanding />
        )}
      </div>

      {/* ── Mobile: App view (hidden on desktop) ──────────────────── */}
      <div className="block md:hidden">
        <MobileApp>
          <ViewRouter />
        </MobileApp>
      </div>
    </div>
  )
}
