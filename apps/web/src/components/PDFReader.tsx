import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker from local node_modules
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PDFReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
}

type ViewMode = 'original' | 'extracted'

export function PDFReader({ fileUrl, onClose, title }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [darkMode, setDarkMode] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  const [loading, setLoading] = useState(true)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => (numPages ? Math.min(prev + 1, numPages) : prev))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6))
  }

  // Dark mode styles for PDF
  const pageStyle = darkMode
    ? {
        filter: 'invert(0.88) hue-rotate(180deg)',
        background: '#1a1a1b',
      }
    : {}

  return (
    <div className="fixed inset-0 bg-background-primary z-50 flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-background-secondary">
        {/* Left: Navigation */}
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

          <div className="h-6 w-px bg-white/10 mx-2" />

          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-foreground-primary text-sm min-w-[100px] text-center">
            {currentPage} / {numPages || '--'}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= (numPages || 1)}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: Title */}
        <h2 className="text-foreground-primary text-sm font-medium truncate max-w-md">
          {title || 'PDF Document'}
        </h2>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-background-tertiary rounded-md p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-secondary text-xs min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Zoom in"
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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-background-tertiary rounded-md p-1">
            <button
              onClick={() => setViewMode('original')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'original'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-secondary hover:text-foreground-primary'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('extracted')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'extracted'
                  ? 'bg-accent-primary text-white'
                  : 'text-foreground-secondary hover:text-foreground-primary'
              }`}
            >
              Extracted
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-background-primary">
        {viewMode === 'original' ? (
          <div className="flex justify-center p-8">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('Error loading PDF:', error)
                setLoading(false)
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-foreground-secondary">Loading PDF...</div>
                </div>
              }
            >
              <div
                className="shadow-2xl"
                style={pageStyle}
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </div>
            </Document>
          </div>
        ) : (
          /* Extracted text view (placeholder for now) */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-foreground-secondary mb-2">
                Text extraction coming soon
              </p>
              <p className="text-foreground-secondary text-sm">
                Switch to Original view to read the PDF
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-background-primary/80 flex items-center justify-center z-50">
          <div className="text-foreground-secondary">Loading PDF...</div>
        </div>
      )}
    </div>
  )
}
