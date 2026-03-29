import { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { LoginForm } from './components/LoginForm'
import { DocumentUpload } from './components/DocumentUpload'
import { DocumentCard } from './components/DocumentCard'
import { FolderSidebar } from './components/FolderSidebar'
import { PDFReader } from './components/PDFReader'
import { EPUBReader } from './components/EPUBReader'
import { TextReader } from './components/TextReader'
import { useDocuments, useFolders, useCreateFolder, useUploadFile, useCreateDocument } from './hooks/useSupabase'

type ViewMode = 'detailed' | 'compact'

function App() {
  const { user, signOut, loading: authLoading } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('detailed')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<typeof documents[0] | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>('')

  // Fetch real data from Supabase
  const { data: documents = [], isLoading: docsLoading, refetch } = useDocuments(user?.id)
  const { data: folders = [] } = useFolders(user?.id)
  const createFolder = useCreateFolder()
  const uploadFile = useUploadFile()
  const createDocument = useCreateDocument()

  const handleUploadComplete = async (files: any[]) => {
    if (!user) return

    try {
      for (const file of files) {
        // Sanitize filename for storage path (remove special chars)
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 200) // Limit length
        
        const path = `${user.id}/${sanitizedName}`
        const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt'
        const title = file.name.replace(/\.[^/.]+$/, '') // Original title without extension

        // Upload file to Supabase storage
        await uploadFile.mutate({
          file,
          userId: user.id,
          path,
        })

        // Create document record in database
        await createDocument.mutate({
          user_id: user.id,
          title,
          file_name: file.name, // Store original filename
          file_type: fileType as 'pdf' | 'epub' | 'txt' | 'md' | 'html',
          storage_path: path,
        })
      }

      // Refresh document list
      await refetch()
      setShowUpload(false)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!user) return

    try {
      await createFolder.mutateAsync({
        user_id: user.id,
        name,
        parent_id: parentId,
      })
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author?.toLowerCase().includes(searchQuery.toLowerCase())

    // TODO: Filter by folder when folder filtering is implemented
    return matchesSearch
  })

  // Get file URL from Supabase storage
  const getFileUrl = async (document: typeof documents[0]) => {
    const { getSupabaseClient } = await import('./lib/supabase')
    const supabase = getSupabaseClient()

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 3600) // 1 hour expiry

    return data?.signedUrl || ''
  }

  // Load file URL when document is selected
  useEffect(() => {
    if (selectedDocument) {
      getFileUrl(selectedDocument).then(setPdfUrl)
    } else {
      setPdfUrl('')
    }
  }, [selectedDocument])

  // Show login form if not authenticated
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-foreground-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 bg-background-primary z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display text-xl text-foreground-primary">
            Random Academic App
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
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

          {/* View Toggle */}
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

          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-sm py-1.5"
          >
            Upload
          </button>

          {/* User Menu */}
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
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onFolderCreate={handleCreateFolder}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-foreground-primary">
                {selectedFolder === null 
                  ? 'All Documents' 
                  : selectedFolder === 'recent'
                  ? 'Recently Added'
                  : selectedFolder === 'unread'
                  ? 'Unread'
                  : selectedFolder === 'continue'
                  ? 'Continue Reading'
                  : 'Library'}
              </h2>
              <span className="text-foreground-secondary text-sm">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading State */}
            {docsLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-foreground-secondary">Loading documents...</div>
              </div>
            )}

            {/* Document Grid */}
            {!docsLoading && filteredDocuments.length > 0 ? (
              <div className={`space-y-3 ${viewMode === 'compact' ? 'grid grid-cols-2 gap-3' : ''}`}>
                {filteredDocuments.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    viewMode={viewMode}
                    onClick={() => setSelectedDocument(doc)}
                  />
                ))}
              </div>
            ) : null}

            {/* Empty State */}
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
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowUpload(true)}
                      className="btn-primary"
                    >
                      Upload Documents
                    </button>
                    <button className="btn-secondary">
                      Import from URL
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <DocumentUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* PDF Reader */}
      {selectedDocument && selectedDocument.file_type === 'pdf' && pdfUrl && (
        <PDFReader
          fileUrl={pdfUrl}
          title={selectedDocument.title}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* EPUB Reader */}
      {selectedDocument && selectedDocument.file_type === 'epub' && pdfUrl && (
        <EPUBReader
          fileUrl={pdfUrl}
          title={selectedDocument.title}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Text Reader */}
      {selectedDocument && ['txt', 'md', 'html'].includes(selectedDocument.file_type) && pdfUrl && (
        <TextReader
          fileUrl={pdfUrl}
          title={selectedDocument.title}
          fileType={selectedDocument.file_type as 'txt' | 'md' | 'html'}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}

export default App
