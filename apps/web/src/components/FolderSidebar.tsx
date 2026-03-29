import { useState } from 'react'

interface Folder {
  id: string
  name: string
  parent_id: string | null
  color?: string | null
  documentCount?: number
  children?: Folder[]
}

interface FolderSidebarProps {
  folders: Folder[]
  selectedFolderId?: string | null
  onFolderSelect?: (folderId: string | null) => void
  onFolderCreate?: (name: string, parentId?: string | null) => void
}

function FolderItem({
  folder,
  level = 0,
  selectedFolderId,
  onFolderSelect,
}: {
  folder: Folder
  level?: number
  selectedFolderId?: string | null
  onFolderSelect?: (folderId: string | null) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolderId === folder.id

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFolderSelect?.(folder.id)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
          transition-colors text-sm
          ${isSelected 
            ? 'bg-background-tertiary text-foreground-primary' 
            : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Arrow */}
        <button
          onClick={handleToggle}
          className={`
            p-0.5 rounded hover:bg-white/10 transition-colors
            ${!hasChildren ? 'invisible' : ''}
          `}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Folder Icon */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: folder.color || undefined }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>

        {/* Folder Name */}
        <span className="flex-1 truncate">{folder.name}</span>

        {/* Document Count */}
        {folder.documentCount !== undefined && (
          <span className="text-xs text-foreground-secondary">
            {folder.documentCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
}: FolderSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [parentFolderId, setParentFolderId] = useState<string | null>(null)

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    onFolderCreate?.(newFolderName, parentFolderId)
    setNewFolderName('')
    setIsCreating(false)
    setParentFolderId(null)
  }

  const startCreating = (parentId?: string | null) => {
    setParentFolderId(parentId ?? null)
    setIsCreating(true)
  }

  // Build nested folder structure
  const buildFolderTree = (folders: Folder[], parentId: string | null = null): Folder[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folders, folder.id),
      }))
  }

  const rootFolders = buildFolderTree(folders)

  return (
    <div className="space-y-1">
      {/* All Documents (no folder filter) */}
      <div
        onClick={() => onFolderSelect?.(null)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
          transition-colors text-sm
          ${selectedFolderId === null
            ? 'bg-background-tertiary text-foreground-primary'
            : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'}
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span className="flex-1">All Documents</span>
      </div>

      {/* Smart Collections */}
      <div className="mt-4">
        <div className="text-xs font-medium text-foreground-secondary uppercase tracking-wider px-3 mb-2">
          Smart Collections
        </div>
        <div
          onClick={() => onFolderSelect?.('recent')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
            transition-colors text-sm
            ${selectedFolderId === 'recent'
              ? 'bg-background-tertiary text-foreground-primary'
              : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Recently Added</span>
        </div>
        <div
          onClick={() => onFolderSelect?.('unread')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
            transition-colors text-sm
            ${selectedFolderId === 'unread'
              ? 'bg-background-tertiary text-foreground-primary'
              : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Unread</span>
        </div>
        <div
          onClick={() => onFolderSelect?.('continue')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
            transition-colors text-sm
            ${selectedFolderId === 'continue'
              ? 'bg-background-tertiary text-foreground-primary'
              : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span>Continue Reading</span>
        </div>
      </div>

      {/* Folders */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <div className="text-xs font-medium text-foreground-secondary uppercase tracking-wider">
            Folders
          </div>
          <button
            onClick={() => startCreating(null)}
            className="p-1 hover:bg-background-tertiary rounded transition-colors"
            aria-label="Create folder"
          >
            <svg className="w-4 h-4 text-foreground-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Folder Tree */}
        <div className="space-y-1">
          {rootFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>

        {/* Inline Create Form */}
        {isCreating && parentFolderId === null && (
          <div className="px-3 py-2" style={{ paddingLeft: '12px' }}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
                if (e.key === 'Escape') setIsCreating(false)
              }}
              onBlur={() => {
                if (!newFolderName.trim()) setIsCreating(false)
              }}
              placeholder="Folder name"
              className="w-full px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-foreground-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              autoFocus
            />
          </div>
        )}

        {rootFolders.length === 0 && (
          <p className="px-3 py-2 text-sm text-foreground-secondary italic">
            No folders yet. Click + to create one.
          </p>
        )}
      </div>
    </div>
  )
}
