import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { LoginForm } from './components/LoginForm'
import { DocumentUpload } from './components/DocumentUpload'
import { DocumentCard } from './components/DocumentCard'
import { FolderSidebar } from './components/FolderSidebar'
import { PDFReader } from './components/PDFReader'
import { EPUBReader } from './components/EPUBReader'
import { TextReader } from './components/TextReader'
import { useDocuments, useFolders, useCreateFolder, useUploadFile, useCreateDocument } from './hooks/useSupabase'
import { extractPDFMetadata } from './lib/extractPDFMetadata'

function App() {
  const { user, signOut, loading: authLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    selectedDocument,
    selectedFolder,
    sidebarOpen,
    viewMode,
    showUpload,
    setSelectedDocument,
    setSelectedFolder,
    toggleSidebar,
    setViewMode,
    setShowUpload,
  } = useUIStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: documents = [], isLoading: docsLoading } = useDocuments(user?.id)
  const { data: folders = [] } = useFolders(user?.id)
  const createFolder = useCreateFolder()
  const uploadFile = useUploadFile()
  const createDocument = useCreateDocument()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleUploadComplete = async (files: File[]) => {
    if (!user) return

    for (const file of files) {
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 200)

      const path = `${user.id}/${sanitizedName}`
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt'

      // Extract embedded metadata from PDFs before uploading
      let title = file.name.replace(/\.[^/.]+$/, '')
      let author: string | undefined
      if (fileType === 'pdf') {
        const meta = await extractPDFMetadata(file)
        if (meta.title) title = meta.title
        if (meta.author) author = meta.author
      }

      await uploadFile.mutateAsync({ file, userId: user.id, path })
      await createDocument.mutateAsync({
        user_id: user.id,
        title,
        file_name: file.name,
        file_type: fileType as 'pdf' | 'epub' | 'txt' | 'md' | 'html',
        storage_path: path,
        ...(author ? { author } : {}),
      })
    }

    queryClient.invalidateQueries({ queryKey: ['documents', user.id] })
    setShowUpload(false)
  }

  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    if (!user) return
    await createFolder.mutateAsync({
      user_id: user.id,
      name,
      parent_id: parentId ?? null,
    })
    queryClient.invalidateQueries({ queryKey: ['folders', user.id] })
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getFileUrl = async (storagePath: string) => {
    const { getSupabaseClient } = await import('./lib/supabase')
    const supabase = getSupabaseClient()
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl || ''
  }

  useEffect(() => {
    if (selectedDocument) {
      getFileUrl(selectedDocument.storage_path).then(setFileUrl)
    } else {
      setFileUrl('')
    }
  }, [selectedDocument])

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-foreground-secondary">Loading...</div>
      </div>
    )
  }

  const sectionTitle =
    selectedFolder === null ? 'All Documents'
    : selectedFolder === 'recent' ? 'Recently Added'
    : selectedFolder === 'unread' ? 'Unread'
    : selectedFolder === 'continue' ? 'Continue Reading'
    : folders.find(f => f.id === selectedFolder)?.name || 'Library'

  // First letter of email for avatar
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 sticky top-0 bg-background-primary z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-background-tertiary rounded transition-colors text-foreground-secondary hover:text-foreground-primary"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display text-base text-foreground-primary">
            Legendum
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-56 px-3 py-1.5 pl-8 bg-background-secondary border border-white/[0.08] rounded text-sm text-foreground-primary placeholder-foreground-muted focus:outline-none focus:border-white/20 transition-colors"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* View toggle — subtle text buttons, no solid fills */}
          <div className="flex items-center border border-white/[0.08] rounded overflow-hidden">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-background-tertiary text-foreground-primary'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              Detailed
            </button>
            <div className="w-px h-4 bg-white/[0.08]" />
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'compact'
                  ? 'bg-background-tertiary text-foreground-primary'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              Compact
            </button>
          </div>

          {/* Upload — restrained, not alarming */}
          <button
            onClick={() => setShowUpload(true)}
            className="px-3 py-1.5 text-xs border border-white/10 rounded text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors"
          >
            Upload
          </button>

          {/* User avatar + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-7 h-7 rounded-full bg-background-tertiary border border-white/10 flex items-center justify-center text-xs font-medium text-foreground-secondary hover:text-foreground-primary hover:border-white/20 transition-colors"
              aria-label="User menu"
            >
              {avatarLetter}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-9 w-48 bg-background-secondary border border-white/[0.08] rounded-lg shadow-xl py-1 z-50">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-xs text-foreground-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); signOut() }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-60' : 'w-0'
          } transition-all duration-200 border-r border-white/[0.06] overflow-hidden flex-shrink-0`}
        >
          <div className="p-3 h-[calc(100vh-3rem)] overflow-y-auto">
            <FolderSidebar
              folders={folders}
              selectedFolderId={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onFolderCreate={handleCreateFolder}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xl font-display text-foreground-primary">
                {sectionTitle}
              </h2>
              <span className="text-xs text-foreground-muted">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
              </span>
            </div>

            {/* Loading skeleton */}
            {docsLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card animate-pulse h-16" />
                ))}
              </div>
            )}

            {!docsLoading && filteredDocuments.length > 0 && (
              <div className={viewMode === 'compact' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                {filteredDocuments.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    viewMode={viewMode}
                    onClick={() => setSelectedDocument(doc)}
                  />
                ))}
              </div>
            )}

            {!docsLoading && filteredDocuments.length === 0 && (
              <div className="card text-center py-16">
                <svg className="w-12 h-12 mx-auto text-foreground-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-foreground-primary mb-1">
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </p>
                <p className="text-foreground-secondary text-sm mb-6">
                  {searchQuery
                    ? 'Try a different search'
                    : 'Upload a PDF, EPUB, or text file to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="btn-primary text-sm"
                  >
                    Upload Documents
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showUpload && (
        <DocumentUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUpload(false)}
        />
      )}

      {selectedDocument && selectedDocument.file_type === 'pdf' && fileUrl && (
        <PDFReader
          fileUrl={fileUrl}
          title={selectedDocument.title}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {selectedDocument && selectedDocument.file_type === 'epub' && fileUrl && (
        <EPUBReader
          fileUrl={fileUrl}
          title={selectedDocument.title}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {selectedDocument && ['txt', 'md', 'html'].includes(selectedDocument.file_type) && fileUrl && (
        <TextReader
          fileUrl={fileUrl}
          title={selectedDocument.title}
          fileType={selectedDocument.file_type as 'txt' | 'md' | 'html'}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}

export default App
