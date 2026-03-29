import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PDFReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
}

export function PDFReader({ fileUrl, onClose, title }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => (numPages ? Math.min(prev + 1, numPages) : prev))
  }, [numPages])

  const zoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.15, 3)), [])
  const zoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.15, 0.5)), [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') goToNextPage()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'k') goToPreviousPage()
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goToNextPage, goToPreviousPage, zoomIn, zoomOut, onClose])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-[#111113] z-50 flex flex-col">
      {/*
        Dark mode: apply filter only to the canvas element, not the text layer.
        Text layer spans are siblings of the canvas inside .react-pdf__Page,
        so targeting `canvas` specifically leaves them unaffected — text stays
        selectable and correctly positioned for future highlighting.
      */}
      {darkMode && (
        <style>{`.pdf-page-dark canvas { filter: invert(0.88) hue-rotate(180deg); }`}</style>
      )}

      {/* Toolbar */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#1a1a1b] flex-shrink-0">
        {/* Left: close + page nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Close reader"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="h-5 w-px bg-white/10 mx-2" />

          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
            title="Previous page (← / k)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-foreground-secondary text-sm tabular-nums min-w-[80px] text-center">
            {currentPage} / {numPages ?? '—'}
          </span>

          <button
            onClick={goToNextPage}
            disabled={!numPages || currentPage >= numPages}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
            title="Next page (→ / j)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: title */}
        <h2 className="text-foreground-secondary text-sm truncate max-w-sm px-4">
          {title}
        </h2>

        {/* Right: zoom + dark mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-background-tertiary rounded-md px-1">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-secondary text-xs w-10 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                : 'bg-background-tertiary text-foreground-secondary hover:text-foreground-primary'
            }`}
            title="Toggle dark mode"
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* PDF viewport — centered reading column */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center py-8 px-4 min-h-full">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoading(false)}
            loading={null}
          >
            <div className={darkMode ? 'pdf-page-dark' : ''}>
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                className="shadow-2xl"
              />
            </div>
          </Document>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#111113] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            <span className="text-foreground-secondary text-sm">Loading PDF…</span>
          </div>
        </div>
      )}
    </div>
  )
}
