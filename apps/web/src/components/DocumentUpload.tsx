import { useState, useRef, useCallback } from 'react'

interface FileWithPreview extends File {
  preview?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (documents: any[]) => void
  onClose?: () => void
}

export function DocumentUpload({ onUploadComplete, onClose }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/epub+zip': ['.epub'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'text/html': ['.html'],
  }

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const validExts = ['pdf', 'epub', 'txt', 'md', 'html']
      return validExts.includes(ext || '')
    })

    setFiles(prev => [...prev, ...validFiles])
    setError(null)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [handleFiles])

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileType = (fileName: string): 'pdf' | 'epub' | 'txt' | 'md' | 'html' => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return (ext as 'pdf' | 'epub' | 'txt' | 'md' | 'html') || 'txt'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      console.log('Uploading files:', files.map(f => f.name))

      // Pass actual File objects to parent
      onUploadComplete?.(files)

      setFiles([])
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-foreground-primary">
            Upload Documents
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-foreground-secondary hover:text-foreground-primary transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors mb-6
            ${isDragging 
              ? 'border-accent-primary bg-accent-primary/10' 
              : 'border-white/10 hover:border-white/20 hover:bg-background-tertiary'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.epub,.txt,.md,.html"
            onChange={onFileInput}
            className="hidden"
          />
          
          <svg className="w-12 h-12 mx-auto text-foreground-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="text-foreground-primary mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-foreground-secondary">
            Supported formats: PDF, EPUB, TXT, MD, HTML
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm text-foreground-secondary mb-2">
              <span>{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
              <button
                onClick={() => setFiles([])}
                className="hover:text-foreground-primary transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-background-tertiary rounded-md"
                >
                  {/* File Icon */}
                  <div className="w-10 h-10 flex items-center justify-center bg-background-primary rounded">
                    {getFileType(file.name) === 'pdf' && (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                      </svg>
                    )}
                    {getFileType(file.name) === 'epub' && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                      </svg>
                    )}
                    {['txt', 'md', 'html'].includes(getFileType(file.name)) && (
                      <svg className="w-5 h-5 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                      </svg>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground-primary text-sm truncate">{file.name}</p>
                    <p className="text-foreground-secondary text-xs">{formatFileSize(file.size)}</p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-4 h-4 text-foreground-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
