import type { Document as DocumentType } from '../../packages/database/src/types'

interface DocumentCardProps {
  document: DocumentType
  viewMode?: 'detailed' | 'compact'
  onClick?: () => void
}

export function DocumentCard({ document, viewMode = 'detailed', onClick }: DocumentCardProps) {
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
          </svg>
        )
      case 'epub':
        return (
          <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
          </svg>
        )
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (viewMode === 'compact') {
    return (
      <div
        onClick={onClick}
        className="card card-hover cursor-pointer p-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-background-primary rounded">
            {getFileTypeIcon(document.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground-primary text-sm font-medium truncate">
              {document.title}
            </h3>
            {document.author && (
              <p className="text-foreground-secondary text-xs truncate">
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
      className="card card-hover cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Document Icon / Cover */}
        <div className="w-16 h-20 flex items-center justify-center bg-background-primary rounded-lg flex-shrink-0">
          {getFileTypeIcon(document.file_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground-primary font-medium mb-1 line-clamp-2">
            {document.title}
          </h3>
          
          {document.author && (
            <p className="text-foreground-secondary text-sm mb-2">
              {document.author}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-foreground-secondary mb-2">
            {document.journal && (
              <span className="truncate">{document.journal}</span>
            )}
            {document.publication_date && (
              <>
                <span>•</span>
                <span>{formatDate(document.publication_date)}</span>
              </>
            )}
            <span>•</span>
            <span className="uppercase">{document.file_type}</span>
          </div>

          {/* DOI */}
          {document.doi && (
            <p className="text-xs text-foreground-secondary font-mono bg-background-tertiary inline-block px-2 py-1 rounded mb-2">
              DOI: {document.doi}
            </p>
          )}

          {/* Abstract Preview */}
          {document.abstract && (
            <p className="text-foreground-secondary text-sm line-clamp-2 mb-3">
              {document.abstract}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Added {formatDate(document.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
