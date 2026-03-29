import { useState, useEffect, useCallback, useRef } from 'react'
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

type ColorMode = 'light' | 'sepia' | 'dark'

const COLOR_MODE_FILTER: Record<ColorMode, string> = {
  light: '',
  sepia: 'sepia(0.35) brightness(0.97) contrast(0.96)',
  dark:  'invert(0.88) hue-rotate(180deg)',
}

export function PDFReader({ fileUrl, onClose, title }: PDFReaderProps) {
  const [numPages,    setNumPages]    = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale,       setScale]       = useState(1.2)
  const [colorMode,   setColorMode]   = useState<ColorMode>('dark')
  const [loading,     setLoading]     = useState(true)

  const viewportRef = useRef<HTMLDivElement>(null)
  // Page natural width (CSS pixels at scale=1) — needed for fit-width
  const pageNaturalWidthRef = useRef<number>(0)

  const goToPreviousPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), [])
  const goToNextPage     = useCallback(() => setCurrentPage(p => numPages ? Math.min(p + 1, numPages) : p), [numPages])
  const zoomIn           = useCallback(() => setScale(s => Math.min(+(s + 0.15).toFixed(2), 3)), [])
  const zoomOut          = useCallback(() => setScale(s => Math.max(+(s - 0.15).toFixed(2), 0.5)), [])

  const fitWidth = useCallback(() => {
    if (!viewportRef.current || !pageNaturalWidthRef.current) return
    // Leave 64px total horizontal padding
    const available = viewportRef.current.clientWidth - 64
    const newScale = +(available / pageNaturalWidthRef.current).toFixed(2)
    setScale(Math.max(0.5, Math.min(newScale, 3)))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') goToNextPage()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   || e.key === 'k') goToPreviousPage()
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goToNextPage, goToPreviousPage, zoomIn, zoomOut, onClose])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  // Called when a page renders — capture its natural width for fit-width calc
  const onPageRenderSuccess = useCallback((page: { originalWidth: number }) => {
    if (page.originalWidth && !pageNaturalWidthRef.current) {
      pageNaturalWidthRef.current = page.originalWidth
    }
  }, [])

  const bgColor = colorMode === 'light' ? '#f5f5f5' : '#111113'
  const filter  = COLOR_MODE_FILTER[colorMode]

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bgColor }}>
      {/* Target only the canvas — text layer spans are siblings, not children */}
      {filter && (
        <style>{`.pdf-canvas-filter canvas { filter: ${filter}; }`}</style>
      )}

      {/* Toolbar */}
      <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0" style={{ background: '#1a1a1b' }}>

        {/* Left: close · prev · page counter · next */}
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-2 hover:bg-background-tertiary rounded transition-colors" title="Close (Esc)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={goToPreviousPage} disabled={currentPage <= 1}
            className="p-2 hover:bg-background-tertiary rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous (← / k)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-foreground-secondary text-xs tabular-nums min-w-[72px] text-center">
            {currentPage} / {numPages ?? '—'}
          </span>
          <button onClick={goToNextPage} disabled={!numPages || currentPage >= numPages}
            className="p-2 hover:bg-background-tertiary rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next (→ / j)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: title */}
        <h2 className="text-foreground-secondary text-sm truncate max-w-sm px-4">{title}</h2>

        {/* Right: zoom · color mode */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border border-white/[0.08] rounded overflow-hidden">
            <button onClick={zoomOut} className="px-2 py-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors" title="Zoom out (-)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-muted text-xs w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="px-2 py-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors" title="Zoom in (+)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="w-px h-4 bg-white/[0.08]" />
            <button onClick={fitWidth} className="px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground-secondary hover:bg-background-tertiary transition-colors" title="Fit to width">
              Fit
            </button>
          </div>

          {/* Color mode: three-way toggle */}
          <div className="flex items-center border border-white/[0.08] rounded overflow-hidden">
            {(['light', 'sepia', 'dark'] as ColorMode[]).map((mode, i, arr) => (
              <div key={mode} className="flex items-center">
                <button
                  onClick={() => setColorMode(mode)}
                  className={`px-2.5 py-1.5 text-xs capitalize transition-colors ${
                    colorMode === mode
                      ? 'bg-background-tertiary text-foreground-primary'
                      : 'text-foreground-muted hover:text-foreground-secondary'
                  }`}
                >
                  {mode}
                </button>
                {i < arr.length - 1 && <div className="w-px h-4 bg-white/[0.08]" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF viewport */}
      <div ref={viewportRef} className="flex-1 overflow-auto" style={{ background: bgColor }}>
        <div className="flex justify-center py-8 px-8 min-h-full">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoading(false)}
            loading={null}
          >
            <div className={filter ? 'pdf-canvas-filter' : ''}>
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                className="shadow-2xl"
                onRenderSuccess={onPageRenderSuccess}
              />
            </div>
          </Document>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: bgColor }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-accent-primary/20 border-t-accent-primary/50 rounded-full animate-spin" />
            <span className="text-foreground-secondary text-xs">Loading…</span>
          </div>
        </div>
      )}
    </div>
  )
}
