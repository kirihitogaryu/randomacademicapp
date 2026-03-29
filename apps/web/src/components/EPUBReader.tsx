import { useEffect, useRef, useState, useCallback } from 'react'
import ePub, { Book, Rendition } from 'epubjs'

interface EPUBReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
}

type FlowMode = 'scrolled' | 'paginated'

// ─── Typography themes ──────────────────────────────────────────────────────
// Scrolled: centered column, generous margins
const SCROLL_DARK = {
  body: {
    'max-width': '680px', 'margin': '0 auto', 'padding': '2.5rem 3rem',
    'line-height': '1.85', 'font-size': '18px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#e4e4e7', 'background': '#1a1a1b',
  },
  'p, li': { 'margin-bottom': '0.8em' },
  'h1, h2, h3': { 'line-height': '1.3', 'margin-bottom': '0.5em', 'color': '#f4f4f5' },
  'a': { 'color': '#818cf8' },
}
const SCROLL_LIGHT = {
  body: {
    'max-width': '680px', 'margin': '0 auto', 'padding': '2.5rem 3rem',
    'line-height': '1.85', 'font-size': '18px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#1a1a1b', 'background': '#f9f9f9',
  },
  'p, li': { 'margin-bottom': '0.8em' },
  'h1, h2, h3': { 'line-height': '1.3', 'margin-bottom': '0.5em' },
}

// Paginated: NO max-width/margin auto — epubjs owns the layout
// Only set typography and colors; padding is small
const PAGED_DARK = {
  body: {
    'padding': '1.5rem 2.5rem',
    'line-height': '1.75', 'font-size': '17px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#e4e4e7', 'background': '#1a1a1b',
  },
  'p, li': { 'margin-bottom': '0.6em' },
  'h1, h2, h3': { 'line-height': '1.3', 'color': '#f4f4f5' },
  'img': { 'max-width': '100%', 'height': 'auto' },
}
const PAGED_LIGHT = {
  body: {
    'padding': '1.5rem 2.5rem',
    'line-height': '1.75', 'font-size': '17px',
    'font-family': 'Georgia, "Times New Roman", serif',
    'color': '#1a1a1b', 'background': '#f9f9f9',
  },
  'p, li': { 'margin-bottom': '0.6em' },
  'h1, h2, h3': { 'line-height': '1.3' },
  'img': { 'max-width': '100%', 'height': 'auto' },
}

// ─── Rendition factory ───────────────────────────────────────────────────────
function createRendition(
  book: Book,
  container: HTMLDivElement,
  flow: FlowMode,
  dark: boolean,
  fontSize: number,
  onRelocated: (loc: any) => void,
): Rendition {
  const rendition = book.renderTo(container, {
    spread: 'none',
    flow,
    // Paginated needs explicit pixel dimensions for correct page calculations
    width:  flow === 'paginated' ? container.clientWidth  : '100%' as unknown as number,
    height: flow === 'paginated' ? container.clientHeight : '100%' as unknown as number,
  })

  // Register themes
  rendition.themes.register('dark',  flow === 'scrolled' ? SCROLL_DARK  : PAGED_DARK)
  rendition.themes.register('light', flow === 'scrolled' ? SCROLL_LIGHT : PAGED_LIGHT)
  rendition.themes.select(dark ? 'dark' : 'light')
  rendition.themes.fontSize(`${fontSize}%`)

  rendition.on('relocated', onRelocated)

  return rendition
}

// ─── Component ───────────────────────────────────────────────────────────────
export function EPUBReader({ fileUrl, onClose, title }: EPUBReaderProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const renditionRef  = useRef<Rendition | null>(null)
  const bookRef       = useRef<Book | null>(null)

  const [toc,            setToc]            = useState<any[]>([])
  const [showToc,        setShowToc]        = useState(false)
  const [darkMode,       setDarkMode]       = useState(true)
  const [fontSize,       setFontSize]       = useState(100)
  const [flowMode,       setFlowMode]       = useState<FlowMode>('scrolled')
  const [progress,       setProgress]       = useState<number | null>(null)
  const [totalLocs,      setTotalLocs]      = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [switching,      setSwitching]      = useState(false)

  // Track current CFI so we can restore after flow switch
  const currentCFIRef = useRef<string | undefined>(undefined)

  const handleRelocated = useCallback((location: any) => {
    currentCFIRef.current = location?.start?.cfi
    if (bookRef.current && totalLocs > 0) {
      const loc = bookRef.current.locations.locationFromCfi(location.start.cfi)
      setProgress(typeof loc === 'number' ? loc : null)
    }
  }, [totalLocs])

  const prevSection = useCallback(() => renditionRef.current?.prev(), [])
  const nextSection = useCallback(() => renditionRef.current?.next(), [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') nextSection()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   || e.key === 'k') prevSection()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextSection, prevSection, onClose])

  // Initial load
  useEffect(() => {
    if (!containerRef.current || !fileUrl) return
    let destroyed = false

    fetch(fileUrl)
      .then(r => r.arrayBuffer())
      .then(buffer => {
        if (destroyed || !containerRef.current) return

        const book = ePub(buffer)
        bookRef.current = book

        const rendition = createRendition(book, containerRef.current, flowMode, darkMode, fontSize, handleRelocated)
        renditionRef.current = rendition

        book.loaded.navigation.then(({ toc }: { toc: any[] }) => {
          setToc(toc)
          rendition.display().then(() => { if (!destroyed) setLoading(false) })
        }).catch(() => {
          rendition.display().then(() => { if (!destroyed) setLoading(false) })
        })

        book.ready.then(() => book.locations.generate(1024))
          .then(() => { if (!destroyed) setTotalLocs(book.locations.length()) })
          .catch(() => {/* optional */})
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
  // darkMode/fontSize/flowMode intentionally excluded — handled in separate effects

  // Theme changes
  useEffect(() => {
    renditionRef.current?.themes.select(darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Font size changes
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  // Window resize
  useEffect(() => {
    const handler = () => {
      if (!containerRef.current || !renditionRef.current) return
      renditionRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      )
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Flow toggle — destroy and recreate rendition, restoring position
  const handleFlowToggle = useCallback(async (newFlow: FlowMode) => {
    if (!bookRef.current || !containerRef.current || !renditionRef.current) return
    setSwitching(true)

    const savedCFI = currentCFIRef.current

    renditionRef.current.destroy()
    renditionRef.current = null

    const rendition = createRendition(
      bookRef.current, containerRef.current,
      newFlow, darkMode, fontSize, handleRelocated,
    )
    renditionRef.current = rendition

    await rendition.display(savedCFI)
    setFlowMode(newFlow)
    setSwitching(false)
  }, [darkMode, fontSize, handleRelocated])

  const goToChapter = (href: string) => {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  const progressPercent = progress !== null && totalLocs > 0
    ? Math.round((progress / totalLocs) * 100)
    : null

  const bg = darkMode ? '#1a1a1b' : '#f9f9f9'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bg }}>

      {/* Toolbar */}
      <div
        className={`h-12 border-b flex items-center justify-between px-4 flex-shrink-0 ${
          darkMode ? 'border-white/[0.06]' : 'border-black/[0.06] bg-white'
        }`}
        style={{ background: darkMode ? '#1a1a1b' : '#ffffff' }}
      >
        {/* Left: close · prev · progress · next */}
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-2 hover:bg-background-tertiary rounded transition-colors" title="Close (Esc)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={prevSection} className="p-2 hover:bg-background-tertiary rounded transition-colors" title="Previous (← / k)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {progressPercent !== null && (
            <span className="text-foreground-secondary text-xs tabular-nums min-w-[40px] text-center">{progressPercent}%</span>
          )}
          <button onClick={nextSection} className="p-2 hover:bg-background-tertiary rounded transition-colors" title="Next (→ / j)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: title */}
        <h2 className="text-foreground-secondary text-sm truncate max-w-xs px-4">{title}</h2>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Scroll / Paginated toggle */}
          <div className="flex items-center border border-white/[0.08] rounded overflow-hidden">
            <button
              onClick={() => flowMode !== 'scrolled' && handleFlowToggle('scrolled')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${
                flowMode === 'scrolled'
                  ? 'bg-background-tertiary text-foreground-primary'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              }`}
              title="Continuous scroll"
            >
              Scroll
            </button>
            <div className="w-px h-4 bg-white/[0.08]" />
            <button
              onClick={() => flowMode !== 'paginated' && handleFlowToggle('paginated')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${
                flowMode === 'paginated'
                  ? 'bg-background-tertiary text-foreground-primary'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              }`}
              title="Page by page"
            >
              Pages
            </button>
          </div>

          {/* TOC */}
          <button
            onClick={() => setShowToc(v => !v)}
            className={`p-2 rounded transition-colors ${showToc ? 'bg-background-tertiary text-foreground-primary' : 'text-foreground-secondary hover:bg-background-tertiary'}`}
            title="Table of contents"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </button>

          {/* Font size */}
          <div className="flex items-center border border-white/[0.08] rounded overflow-hidden">
            <button onClick={() => setFontSize(s => Math.max(s - 10, 60))} className="px-2 py-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-muted text-xs w-9 text-center tabular-nums">{fontSize}%</span>
            <button onClick={() => setFontSize(s => Math.min(s + 10, 200))} className="px-2 py-1.5 text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Dark/Light */}
          <button
            onClick={() => setDarkMode(v => !v)}
            className={`px-2.5 py-1.5 rounded text-xs transition-colors border ${
              darkMode
                ? 'border-white/10 text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary'
                : 'border-black/10 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Reader area */}
      <div className="flex-1 flex min-h-0">
        {/* EPUB container — inline background prevents FOUC */}
        <div
          ref={containerRef}
          className="flex-1 h-full min-h-0"
          style={{ background: bg }}
        />

        {/* TOC panel */}
        {showToc && toc.length > 0 && (
          <div
            className={`w-60 border-l flex-shrink-0 overflow-y-auto ${
              darkMode ? 'border-white/[0.06]' : 'border-black/[0.06] bg-white'
            }`}
            style={{ background: darkMode ? '#1a1a1b' : '#f9f9f9' }}
          >
            <div className="p-4">
              <h3 className="text-foreground-primary text-xs font-semibold uppercase tracking-widest mb-3">Contents</h3>
              <ul className="space-y-0.5">
                {toc.map((ch, i) => (
                  <li key={ch.id || i}>
                    <button
                      onClick={() => goToChapter(ch.href)}
                      className="w-full text-left text-sm text-foreground-secondary hover:text-foreground-primary py-1.5 px-2 rounded hover:bg-background-tertiary transition-colors truncate"
                    >
                      {ch.label?.trim() || `Section ${i + 1}`}
                    </button>
                    {ch.subitems?.length > 0 && (
                      <ul className="ml-3 space-y-0.5 mt-0.5">
                        {ch.subitems.map((sub: any, j: number) => (
                          <li key={sub.id || j}>
                            <button
                              onClick={() => goToChapter(sub.href)}
                              className="w-full text-left text-xs text-foreground-muted hover:text-foreground-secondary py-1 px-2 rounded hover:bg-background-tertiary transition-colors truncate"
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

      {/* Loading / switching overlay */}
      {(loading || switching) && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: bg }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-accent-primary/20 border-t-accent-primary/60 rounded-full animate-spin" />
            <span className="text-foreground-secondary text-xs">
              {switching ? 'Switching view…' : 'Loading book…'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
