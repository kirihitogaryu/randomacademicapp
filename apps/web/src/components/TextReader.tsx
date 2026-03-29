import { useState, useEffect } from 'react'

interface TextReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
  fileType: 'txt' | 'md' | 'html'
}

export function TextReader({ fileUrl, onClose, title, fileType }: TextReaderProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [fontSize, setFontSize] = useState(100)

  useEffect(() => {
    if (!fileUrl) return

    setLoading(true)
    fetch(fileUrl)
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading text file:', err)
        setLoading(false)
      })
  }, [fileUrl])

  const zoomIn = () => {
    setFontSize(prev => Math.min(prev + 10, 200))
  }

  const zoomOut = () => {
    setFontSize(prev => Math.max(prev - 10, 50))
  }

  const renderContent = () => {
    if (fileType === 'html') {
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    }

    if (fileType === 'md') {
      // Simple markdown-like rendering (basic)
      return (
        <div className="whitespace-pre-wrap font-mono text-sm">
          {content}
        </div>
      )
    }

    // Plain text
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background-primary z-50 flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-background-secondary">
        {/* Left: Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Center: Title */}
        <h2 className="text-foreground-primary text-sm font-medium truncate max-w-md">
          {title || 'Document'}
        </h2>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size */}
          <div className="flex items-center gap-1 bg-background-tertiary rounded-md p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Decrease font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-secondary text-xs min-w-[45px] text-center">
              {fontSize}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Increase font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              darkMode
                ? 'bg-accent-primary text-white'
                : 'bg-background-tertiary text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-foreground-secondary">Loading...</div>
          </div>
        ) : (
          <div
            className={`max-w-4xl mx-auto ${darkMode ? 'text-foreground-primary' : 'text-gray-900'}`}
            style={{ fontSize: `${fontSize}%` }}
          >
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  )
}
