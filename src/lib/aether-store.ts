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

interface AetherState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void

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

  // Actions
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
}

export const useAetherStore = create<AetherState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view, selectedMemoryId: null, selectedCollectionId: null }),

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

  // Actions
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
}))
