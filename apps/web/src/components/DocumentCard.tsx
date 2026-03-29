import type { Document as DocumentType } from '@database/types'

interface DocumentCardProps {
  document: DocumentType
  viewMode?: 'detailed' | 'compact'
  onClick?: () => void
}

// Small inline badge — understated color, not a big block
const TYPE_COLORS: Record<string, string> = {
  pdf:  'text-blue-300/90  bg-blue-400/10   border-border-highlight',
  epub: 'text-amber-300/90 bg-amber-400/10  border-border-highlight',
  txt:  'text-zinc-300/80  bg-zinc-400/10   border-border-highlight',
  md:   'text-purple-300/80 bg-purple-400/10 border-border-highlight',
  html: 'text-emerald-300/80 bg-emerald-400/10 border-border-highlight',
}

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? 'text-zinc-300/80 bg-zinc-400/10 border-border-highlight'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase border ${cls}`}>
      {type}
    </span>
  )
}

function shortDate(dateString: string | null) {
  if (!dateString) return null
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Build a compact metadata string: "Author · Journal · Year" */
function metaLine(doc: DocumentType): string | null {
  const parts: string[] = []
  if (doc.author) parts.push(doc.author)
  if (doc.journal) parts.push(doc.journal)
  if (doc.publication_date) {
    const year = new Date(doc.publication_date).getFullYear()
    if (!isNaN(year)) parts.push(String(year))
  }
  return parts.length ? parts.join(' · ') : null
}

export function DocumentCard({ document, viewMode = 'detailed', onClick }: DocumentCardProps) {
  const meta = metaLine(document)
  const date = shortDate(document.created_at)

  if (viewMode === 'compact') {
    return (
      <div
        onClick={onClick}
        className="card card-hover group px-4 py-2.5"
      >
        <div className="flex items-center gap-3 min-w-0">
          <TypeBadge type={document.file_type} />
          <span className="text-sm text-foreground-primary truncate flex-1 group-hover:text-white transition-colors">
            {document.title}
          </span>
          {document.author && (
            <span className="text-xs text-foreground-muted truncate flex-shrink-0 max-w-[160px]">
              {document.author}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Detailed view — title is the visual anchor
  return (
    <div
      onClick={onClick}
      className="card card-hover group px-5 py-4"
    >
      {/* Title */}
      <h3 className="doc-title mb-2 line-clamp-2 group-hover:text-white transition-colors">
        {document.title}
      </h3>

      {/* Metadata row: badge · author · journal · year · date */}
      <div className="flex items-center gap-2 flex-wrap">
        <TypeBadge type={document.file_type} />
        {meta && (
          <span className="text-xs text-foreground-secondary">{meta}</span>
        )}
        {date && (
          <span className="text-xs text-foreground-muted ml-auto">{date}</span>
        )}
      </div>

      {/* Abstract — italic, very muted, only when present */}
      {document.abstract && (
        <p className="text-xs text-foreground-secondary/70 italic mt-3 line-clamp-2 leading-relaxed">
          {document.abstract}
        </p>
      )}

      {/* DOI — monospace pill, only when present */}
      {document.doi && (
        <p className="mt-2 inline-block text-[10px] font-mono text-foreground-muted bg-background-primary border border-border-subtle px-2 py-0.5">
          {document.doi}
        </p>
      )}
    </div>
  )
}
