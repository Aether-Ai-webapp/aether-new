import { create } from 'zustand'

export type MemoryType = 'text' | 'voice' | 'link' | 'image'

export interface Memory {
  id: string
  type: MemoryType
  title: string
  content: string
  summary: string | null
  tags: string[]
  sourceUrl: string | null
  fileUrl: string | null
  imagePreview: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  collections: { id: string; name: string; color: string }[]
}

export interface Collection {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
  memoryCount: number
}

export type AppView = 'dashboard' | 'ask' | 'collections' | 'memories' | 'settings'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

interface AetherState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void

  // Auth
  user: AuthUser | null
  isAuthenticated: boolean
  showAuthModal: boolean
  pendingAction: (() => void) | null
  setUser: (user: AuthUser | null) => void
  setShowAuthModal: (show: boolean) => void
  requireAuth: (action: () => void) => void
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>

  // Data
  memories: Memory[]
  collections: Collection[]
  isLoading: boolean

  // Selected
  selectedMemoryId: string | null
  selectedCollectionId: string | null

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterType: MemoryType | 'all'
  setFilterType: (t: MemoryType | 'all') => void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  clearChat: () => void

  // Theme
  darkMode: boolean
  toggleDarkMode: () => void

  // Data actions
  setMemories: (memories: Memory[]) => void
  setCollections: (collections: Collection[]) => void
  setLoading: (loading: boolean) => void
  setSelectedMemoryId: (id: string | null) => void
  setSelectedCollectionId: (id: string | null) => void
  addMemory: (memory: Memory) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void
  deleteMemory: (id: string) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  fetchMemories: () => Promise<void>
  fetchCollections: () => Promise<void>
}

export const useAetherStore = create<AetherState>((set, get) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view, selectedMemoryId: null, selectedCollectionId: null }),

  // Auth — always start as "local" user, no auth gate
  user: { id: 'local', email: '', name: 'Aether User', avatarUrl: null },
  isAuthenticated: false,
  showAuthModal: false,
  pendingAction: null,
  setUser: (user) => set({ user, isAuthenticated: !!user && user.id !== 'local' }),
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),

  // The gate: if user is signed in, run action immediately. Otherwise, queue it and show modal.
  requireAuth: (action) => {
    const state = get()
    if (state.isAuthenticated && state.user && state.user.id !== 'local') {
      action()
    } else {
      set({ showAuthModal: true, pendingAction: action })
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
          isAuthenticated: true,
          showAuthModal: false,
        })
        // Execute any pending action that was queued
        const pending = get().pendingAction
        if (pending) {
          pending()
          set({ pendingAction: null })
        }
        return true
      }
      return false
    } catch {
      return false
    }
  },

  signup: async (email, password, name) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: name || '',
            avatarUrl: null,
          },
          isAuthenticated: true,
          showAuthModal: false,
        })
        const pending = get().pendingAction
        if (pending) {
          pending()
          set({ pendingAction: null })
        }
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    set({
      user: { id: 'local', email: '', name: 'Aether User', avatarUrl: null },
      isAuthenticated: false,
      chatMessages: [],
    })
    // Reload data as local user
    get().fetchMemories()
    get().fetchCollections()
  },

  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated && data.user) {
          set({ user: data.user, isAuthenticated: true })
          return
        }
      }
    } catch { /* ignore */ }
    // No Supabase session — stay as local user (not gated)
    set({ isAuthenticated: false })
  },

  // Data
  memories: [],
  collections: [],
  isLoading: false,

  // Selected
  selectedMemoryId: null,
  selectedCollectionId: null,

  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  filterType: 'all',
  setFilterType: (t) => set({ filterType: t }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  // Theme
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  // Data actions
  setMemories: (memories) => set({ memories }),
  setCollections: (collections) => set({ collections }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedMemoryId: (id) => set({ selectedMemoryId: id }),
  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
  addMemory: (memory) => set((s) => ({ memories: [memory, ...s.memories] })),
  updateMemory: (id, updates) => set((s) => ({
    memories: s.memories.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  })),
  deleteMemory: (id) => set((s) => ({
    memories: s.memories.filter((m) => m.id !== id),
  })),
  addCollection: (collection) => set((s) => ({
    collections: [...s.collections, collection],
  })),
  updateCollection: (id, updates) => set((s) => ({
    collections: s.collections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  deleteCollection: (id) => set((s) => ({
    collections: s.collections.filter((c) => c.id !== id),
  })),
  fetchMemories: async () => {
    try {
      const res = await fetch('/api/memories')
      if (res.ok) {
        const memories = await res.json()
        set({ memories })
      }
    } catch (e) {
      console.error('Failed to fetch memories:', e)
    }
  },
  fetchCollections: async () => {
    try {
      const res = await fetch('/api/collections')
      if (res.ok) {
        const collections = await res.json()
        set({ collections })
      }
    } catch (e) {
      console.error('Failed to fetch collections:', e)
    }
  },
}))
