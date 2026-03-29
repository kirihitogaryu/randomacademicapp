import { useEffect, useRef, useState } from 'react'
import ePub, { Book } from 'epubjs'

interface EPUBReaderProps {
  fileUrl: string
  onClose: () => void
  title?: string
}

export function EPUBReader({ fileUrl, onClose, title }: EPUBReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [toc, setToc] = useState<any[]>([])
  const [showToc, setShowToc] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [totalChapters, setTotalChapters] = useState(0)

  useEffect(() => {
    if (!containerRef.current || !fileUrl) return

    console.log('Initializing EPUB')
    let newBook: Book | null = null

    // Set explicit container size
    containerRef.current.style.width = '100%'
    containerRef.current.style.height = '100%'

    // Fetch file as ArrayBuffer
    fetch(fileUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        console.log('EPUB loaded, size:', buffer.byteLength)

        newBook = ePub(buffer)
        setBook(newBook)

        const rendition = newBook.renderTo(containerRef.current!, {
          spread: 'none',
          flow: 'scrolled', // Use scrolled instead of paginated
        })

        // Get TOC first
        newBook.loaded.navigation.then(({ toc }: { toc: any[] }) => {
          console.log('TOC loaded:', toc.length, 'items')
          setToc(toc)
          
          // Display first chapter
          rendition.display()
        })

        // Generate locations for percentage tracking
        newBook.ready.then(() => {
          return newBook.locations.generate()
        }).then(() => {
          console.log('Locations generated')
          setTotalChapters(newBook.locations.length())
        })

        // Track location for percentage
        rendition.on('relocated', (location: any) => {
          const current = newBook!.locations.locationFromCfi(location.start.cfi)
          setCurrentChapter(current || 0)
        })

        // Also get spine for navigation fallback
        newBook.loaded.spine.then(() => {
          console.log('Spine items:', newBook!.spine.length)
          if (toc.length === 0) {
            // Use spine as fallback TOC
            const spineItems = []
            for (let i = 0; i < newBook!.spine.length; i++) {
              const item = newBook!.spine.get(i)
              if (item && item.href) {
                spineItems.push({
                  href: item.href,
                  label: `Section ${i + 1}`,
                })
              }
            }
            setToc(spineItems)
          }
        })

        if (darkMode) {
          rendition.themes.register('dark', {
            body: { background: '#1a1a1b', color: '#e4e4e7' },
            '*': { color: '#e4e4e7' },
          })
          rendition.themes.select('dark')
        }
      })
      .catch(err => {
        console.error('Failed to load EPUB:', err)
      })

    return () => {
      console.log('Cleaning up EPUB')
      if (newBook) newBook.destroy()
    }
  }, [fileUrl])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (book) {
        book.rendition.resize()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [book])

  // Handle theme changes
  useEffect(() => {
    if (!book) return
    if (darkMode) {
      book.rendition.themes.register('dark', {
        body: { background: '#1a1a1b', color: '#e4e4e7' },
        '*': { color: '#e4e4e7' },
      })
      book.rendition.themes.select('dark')
    } else {
      book.rendition.themes.select('default')
    }
  }, [book, darkMode])

  // Handle font size
  useEffect(() => {
    if (!book) return
    book.rendition.themes.fontSize(`${fontSize}%`)
  }, [book, fontSize])

  const prevPage = () => {
    console.log('Previous page requested')
    book?.rendition.prev().then(() => {
      console.log('Navigated to previous')
    }).catch(err => {
      console.log('Already at start or error:', err)
    })
  }
  const nextPage = () => {
    console.log('Next page requested')
    book?.rendition.next().then(() => {
      console.log('Navigated to next')
    }).catch(err => {
      console.log('Already at end or error:', err)
    })
  }

  const goToChapter = (href: string) => {
    book?.rendition.display(href)
    setShowToc(false)
  }

  return (
    <div className="fixed inset-0 bg-background-primary z-50 flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-background-secondary flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-background-tertiary rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={prevPage} className="p-2 hover:bg-background-tertiary rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={nextPage} className="p-2 hover:bg-background-tertiary rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {totalChapters > 0 && (
            <span className="text-foreground-secondary text-sm">
              {Math.round((currentChapter / totalChapters) * 100)}%
            </span>
          )}
        </div>

        <h2 className="text-foreground-primary text-sm font-medium truncate max-w-md">{title || 'EPUB'}</h2>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowToc(!showToc)} className="p-2 hover:bg-background-tertiary rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" />
            </svg>
          </button>
          <div className="flex items-center gap-1 bg-background-tertiary rounded-md p-1">
            <button onClick={() => setFontSize(s => Math.max(s - 10, 50))} className="p-1.5 hover:bg-white/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-foreground-secondary text-xs w-10 text-center">{fontSize}%</span>
            <button onClick={() => setFontSize(s => Math.min(s + 10, 200))} className="p-1.5 hover:bg-white/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-accent-primary text-white' : 'bg-background-tertiary'}`}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div ref={containerRef} className="flex-1 h-full min-h-0 bg-background-primary" />
        
        {showToc && toc.length > 0 && (
          <div className="w-64 border-l border-white/5 bg-background-secondary overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h3 className="text-foreground-primary font-medium mb-3">Contents</h3>
              <ul className="space-y-2">
                {toc.map((chapter, i) => (
                  <li key={chapter.id || i}>
                    <button
                      onClick={() => goToChapter(chapter.href)}
                      className="text-sm text-foreground-secondary hover:text-foreground-primary truncate w-full text-left"
                    >
                      {chapter.label || `Chapter ${i + 1}`}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
