import { useState, useEffect } from 'react'
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

  const { data: documents = [], isLoading: docsLoading } = useDocuments(user?.id)
  const { data: folders = [] } = useFolders(user?.id)
  const createFolder = useCreateFolder()
  const uploadFile = useUploadFile()
  const createDocument = useCreateDocument()

  const handleUploadComplete = async (files: File[]) => {
    if (!user) return

    for (const file of files) {
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 200)

      const path = `${user.id}/${sanitizedName}`
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt'
      const title = file.name.replace(/\.[^/.]+$/, '')

      await uploadFile.mutateAsync({ file, userId: user.id, path })
      await createDocument.mutateAsync({
        user_id: user.id,
        title,
        file_name: file.name,
        file_type: fileType as 'pdf' | 'epub' | 'txt' | 'md' | 'html',
        storage_path: path,
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

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 bg-background-primary z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display text-lg text-foreground-primary tracking-wide">
            Legendum
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-64 px-3 py-1.5 pl-9 bg-background-secondary border border-white/10 rounded-md text-sm text-foreground-primary placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <svg
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1 bg-background-secondary rounded-md p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-secondary hover:text-foreground-primary'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'compact'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-secondary hover:text-foreground-primary'
              }`}
            >
              Compact
            </button>
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-sm py-1.5"
          >
            Upload
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-secondary">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="btn-secondary text-sm py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } transition-all duration-200 border-r border-white/5 overflow-hidden flex-shrink-0`}
        >
          <div className="p-4 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <FolderSidebar
              folders={folders}
              selectedFolderId={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onFolderCreate={handleCreateFolder}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-foreground-primary">
                {sectionTitle}
              </h2>
              <span className="text-foreground-secondary text-sm">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading skeleton */}
            {docsLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-background-tertiary rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-background-tertiary rounded w-3/4" />
                        <div className="h-3 bg-background-tertiary rounded w-1/2" />
                        <div className="h-3 bg-background-tertiary rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!docsLoading && filteredDocuments.length > 0 && (
              <div className={viewMode === 'compact' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
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
                <svg className="w-16 h-16 mx-auto text-foreground-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-foreground-primary text-lg mb-2">
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </p>
                <p className="text-foreground-secondary mb-6">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Get started by uploading your first document'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="btn-primary"
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
