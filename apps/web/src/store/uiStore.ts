import { create } from 'zustand'

// Minimal document shape needed for reader selection
export interface SelectedDocument {
  id: string
  title: string
  file_type: string
  storage_path: string
  author?: string | null
  [key: string]: unknown
}

interface UIState {
  selectedDocument: SelectedDocument | null
  selectedFolder: string | null
  sidebarOpen: boolean
  viewMode: 'detailed' | 'compact'
  showUpload: boolean

  setSelectedDocument: (doc: SelectedDocument | null) => void
  setSelectedFolder: (folderId: string | null) => void
  toggleSidebar: () => void
  setViewMode: (mode: 'detailed' | 'compact') => void
  setShowUpload: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedDocument: null,
  selectedFolder: null,
  sidebarOpen: true,
  viewMode: 'detailed',
  showUpload: false,

  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
  setSelectedFolder: (folderId) => set({ selectedFolder: folderId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowUpload: (show) => set({ showUpload: show }),
}))
