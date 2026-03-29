import type { Document as DocumentType } from '@database/types'

interface DocumentCardProps {
  document: DocumentType
  viewMode?: 'detailed' | 'compact'
  onClick?: () => void
}

const FILE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  pdf:  { label: 'PDF',  color: 'text-rose-400 bg-rose-400/10' },
  epub: { label: 'EPUB', color: 'text-blue-400 bg-blue-400/10' },
  txt:  { label: 'TXT',  color: 'text-zinc-400 bg-zinc-400/10' },
  md:   { label: 'MD',   color: 'text-purple-400 bg-purple-400/10' },
  html: { label: 'HTML', color: 'text-orange-400 bg-orange-400/10' },
}

function FileTypeBadge({ type }: { type: string }) {
  const config = FILE_TYPE_CONFIG[type] ?? { label: type.toUpperCase(), color: 'text-zinc-400 bg-zinc-400/10' }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${config.color}`}>
      {config.label}
    </span>
  )
}

export function DocumentCard({ document, viewMode = 'detailed', onClick }: DocumentCardProps) {
  if (viewMode === 'compact') {
    return (
      <div
        onClick={onClick}
        className="card card-hover cursor-pointer p-3 group"
      >
        <div className="flex items-center gap-3">
          <FileTypeBadge type={document.file_type} />
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground-primary text-sm font-medium truncate group-hover:text-white transition-colors">
              {document.title}
            </h3>
            {document.author && (
              <p className="text-foreground-secondary text-xs truncate mt-0.5">
                {document.author}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Detailed view
  return (
    <div
      onClick={onClick}
      className="card card-hover cursor-pointer group"
    >
      <div className="flex gap-4">
        {/* Left column: type badge + date added */}
        <div className="flex flex-col items-center gap-2 pt-0.5 flex-shrink-0 w-14">
          <FileTypeBadge type={document.file_type} />
          {document.created_at && (
            <span className="text-[10px] text-foreground-secondary text-center leading-tight">
              {new Date(document.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Right column: metadata */}
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground-primary font-medium leading-snug mb-1 line-clamp-2 group-hover:text-white transition-colors">
            {document.title}
          </h3>

          {document.author && (
            <p className="text-foreground-secondary text-sm mb-2">
              {document.author}
            </p>
          )}

          {/* Journal + year in one line */}
          {(document.journal || document.publication_date) && (
            <p className="text-foreground-secondary text-xs mb-2 italic">
              {[document.journal, document.publication_date ? new Date(document.publication_date).getFullYear() : null]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}

          {/* DOI pill */}
          {document.doi && (
            <p className="text-xs text-foreground-secondary font-mono bg-background-primary inline-block px-2 py-0.5 rounded mb-2 border border-white/5">
              {document.doi}
            </p>
          )}

          {/* Abstract preview */}
          {document.abstract && (
            <p className="text-foreground-secondary text-sm line-clamp-2 leading-relaxed">
              {document.abstract}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
