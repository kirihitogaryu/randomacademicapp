import { useEffect, useRef, useState, useCallback } from 'react'
import ePub, { Book, Rendition } from 'epubjs'

interface EPUBReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
}

// Typography injected into every EPUB iframe regardless of the EPUB's own CSS.
// Gives a comfortable Readwise-style reading column.
const READING_THEME_LIGHT = {
  body: {
    'max-width': '680px',
    'margin': '0 auto',
    'padding': '2rem 3rem',
    'line-height': '1.8',
    'font-size': '18px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#1a1a1b',
    'background': '#ffffff',
  },
  'p, li': { 'margin-bottom': '0.75em' },
  'h1, h2, h3, h4': { 'line-height': '1.3', 'margin-bottom': '0.5em' },
}

const READING_THEME_DARK = {
  body: {
    'max-width': '680px',
    'margin': '0 auto',
    'padding': '2rem 3rem',
    'line-height': '1.8',
    'font-size': '18px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#e4e4e7',
    'background': '#1a1a1b',
  },
  'p, li': { 'margin-bottom': '0.75em' },
  'h1, h2, h3, h4': { 'line-height': '1.3', 'margin-bottom': '0.5em', 'color': '#f4f4f5' },
  'a': { 'color': '#818cf8' },
}

export function EPUBReader({ fileUrl, onClose, title }: EPUBReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // renditionRef gives future annotation code direct access to epubjs Rendition API
  const renditionRef = useRef<Rendition | null>(null)
  const bookRef = useRef<Book | null>(null)

  const [toc, setToc] = useState<any[]>([])
  const [showToc, setShowToc] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [currentLocation, setCurrentLocation] = useState(0)
  const [totalLocations, setTotalLocations] = useState(0)
  const [loading, setLoading] = useState(true)

  const prevPage = useCallback(() => renditionRef.current?.prev(), [])
  const nextPage = useCallback(() => renditionRef.current?.next(), [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') nextPage()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'k') prevPage()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nextPage, prevPage, onClose])

  // Initialize EPUB
  useEffect(() => {
    if (!containerRef.current || !fileUrl) return

    let destroyed = false

    fetch(fileUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        if (destroyed) return

        const book = ePub(buffer)
        bookRef.current = book

        const rendition = book.renderTo(containerRef.current!, {
          spread: 'none',
          flow: 'scrolled',
          width: '100%',
          height: '100%',
        })
        renditionRef.current = rendition

        // Register both themes upfront
        rendition.themes.register('light', READING_THEME_LIGHT)
        rendition.themes.register('dark', READING_THEME_DARK)
        rendition.themes.select(darkMode ? 'dark' : 'light')

        book.loaded.navigation.then(({ toc }: { toc: any[] }) => {
          setToc(toc)
          rendition.display().then(() => setLoading(false))
        }).catch(() => {
          rendition.display().then(() => setLoading(false))
        })

        book.ready.then(() => {
          return book.locations.generate(1024)
        }).then(() => {
          setTotalLocations(book.locations.length())
        }).catch(() => {/* locations are optional */})

        rendition.on('relocated', (location: any) => {
          if (book.locations.length()) {
            const loc = book.locations.locationFromCfi(location.start.cfi)
            setCurrentLocation(typeof loc === 'number' ? loc : 0)
          }
        })
      })
      .catch(err => {
        console.error('Failed to load EPUB:', err)
        setLoading(false)
      })

    return () => {
      destroyed = true
      bookRef.current?.destroy()
      bookRef.current = null
      renditionRef.current = null
    }
  }, [fileUrl]) // eslint-disable-line react-hooks/exhaustive-deps
  // darkMode intentionally excluded — theme changes are handled in a separate effect

  // Theme changes after initial load
  useEffect(() => {
    renditionRef.current?.themes.select(darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Font size changes
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  // Window resize — pass explicit dimensions so epubjs can reflow correctly
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !renditionRef.current) return
      renditionRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      )
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const goToChapter = (href: string) => {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  const progressPercent = totalLocations > 0
    ? Math.round((currentLocation / totalLocations) * 100)
    : null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${darkMode ? 'bg-[#1a1a1b]' : 'bg-white'}`}>
      {/* Toolbar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 flex-shrink-0 ${
        darkMode ? 'bg-[#1a1a1b] border-white/5' : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Left: close */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Close reader"
            title="Close (Esc)"
          >
            {/* X — distinct from the navigation arrows */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="h-5 w-px bg-white/10 mx-2" />

          {/* ← prev */}
          <button
            onClick={prevPage}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Previous section"
            title="Previous (← / k)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* progress */}
          {progressPercent !== null && (
            <span className="text-foreground-secondary text-sm tabular-nums min-w-[48px] text-center">
              {progressPercent}%
            </span>
          )}

          {/* → next */}
          <button
            onClick={nextPage}
            className="p-2 hover:bg-background-tertiary rounded-md transition-colors"
            aria-label="Next section"
            title="Next (→ / j)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: title */}
        <h2 className="text-foreground-secondary text-sm truncate max-w-sm px-4">{title}</h2>

        {/* Right: TOC, font size, dark mode */}
        <div className="flex items-center gap-2">
          {/* TOC toggle */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-2 rounded-md transition-colors ${showToc ? 'bg-background-tertiary text-foreground-primary' : 'hover:bg-background-tertiary text-foreground-secondary'}`}
            aria-label="Table of contents"
            title="Table of contents"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </button>

          {/* Font size */}
          <div className="flex items-center gap-0.5 bg-background-tertiary rounded-md px-1">
            <button
              onClick={() => setFontSize(s => Math.max(s - 10, 60))}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Decrease font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-secondary text-xs w-10 text-center tabular-nums">{fontSize}%</span>
            <button
              onClick={() => setFontSize(s => Math.min(s + 10, 200))}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Increase font size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Dark mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                : 'bg-background-tertiary text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Reader area */}
      <div className="flex-1 flex min-h-0">
        {/* EPUB container */}
        <div ref={containerRef} className="flex-1 h-full min-h-0" />

        {/* TOC panel */}
        {showToc && toc.length > 0 && (
          <div className={`w-64 border-l flex-shrink-0 overflow-y-auto ${
            darkMode ? 'bg-[#1a1a1b] border-white/5' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="p-4">
              <h3 className="text-foreground-primary text-sm font-medium mb-3">Contents</h3>
              <ul className="space-y-1">
                {toc.map((chapter, i) => (
                  <li key={chapter.id || i}>
                    <button
                      onClick={() => goToChapter(chapter.href)}
                      className="w-full text-left text-sm text-foreground-secondary hover:text-foreground-primary py-1.5 px-2 rounded hover:bg-background-tertiary transition-colors truncate"
                    >
                      {chapter.label?.trim() || `Section ${i + 1}`}
                    </button>
                    {/* Sub-items (one level) */}
                    {chapter.subitems?.length > 0 && (
                      <ul className="ml-3 mt-1 space-y-1">
                        {chapter.subitems.map((sub: any, j: number) => (
                          <li key={sub.id || j}>
                            <button
                              onClick={() => goToChapter(sub.href)}
                              className="w-full text-left text-xs text-foreground-secondary hover:text-foreground-primary py-1 px-2 rounded hover:bg-background-tertiary transition-colors truncate"
                            >
                              {sub.label?.trim() || `${i + 1}.${j + 1}`}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-[#1a1a1b]' : 'bg-white'}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            <span className="text-foreground-secondary text-sm">Loading book…</span>
          </div>
        </div>
      )}
    </div>
  )
}
