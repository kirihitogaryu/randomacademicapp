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

// Shared nav item style — selected gets a left-border accent
function navItemClass(selected: boolean) {
  return [
    'flex items-center gap-2 py-2 cursor-pointer transition-colors text-sm select-none',
    selected
      ? 'sidebar-item-active pl-3'
      : 'sidebar-item pl-3',
  ].join(' ')
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-section-title">
      {children}
    </div>
  )
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

  return (
    <div>
      <div
        className={navItemClass(isSelected)}
        style={{ paddingLeft: `${level * 14 + (isSelected ? 10 : 12)}px` }}
        onClick={(e) => { e.stopPropagation(); onFolderSelect?.(folder.id) }}
      >
        {/* Expand arrow */}
        <button
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setIsExpanded(v => !v) }}
          className={`flex-shrink-0 transition-transform ${hasChildren ? '' : 'invisible'} ${isExpanded ? 'rotate-90' : ''}`}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg className="w-3 h-3 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: folder.color || undefined }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>

        <span className="flex-1 truncate">{folder.name}</span>

        {folder.documentCount !== undefined && (
          <span className="text-[11px] text-foreground-muted pr-2">{folder.documentCount}</span>
        )}
      </div>

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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    onFolderCreate?.(newFolderName, null)
    setNewFolderName('')
    setIsCreating(false)
  }

  const buildFolderTree = (items: Folder[], parentId: string | null = null): Folder[] =>
    items
      .filter(f => f.parent_id === parentId)
      .map(folder => ({ ...folder, children: buildFolderTree(items, folder.id) }))

  const rootFolders = buildFolderTree(folders)

  return (
    <nav className="space-y-0.5">
      {/* All Documents */}
      <div
        onClick={() => onFolderSelect?.(null)}
        className={navItemClass(selectedFolderId === null)}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>All Documents</span>
      </div>

      {/* Smart Collections */}
      <SectionLabel>Smart Collections</SectionLabel>

      {[
        { id: 'recent',   label: 'Recently Added', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'unread',   label: 'Unread',          icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
        { id: 'continue', label: 'Continue Reading', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
      ].map(({ id, label, icon }) => (
        <div
          key={id}
          onClick={() => onFolderSelect?.(id)}
          className={navItemClass(selectedFolderId === id)}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
          <span>{label}</span>
        </div>
      ))}

      {/* Folders */}
      <div className="flex items-center justify-between pr-2 mt-4 mb-1">
        <SectionLabel>Folders</SectionLabel>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 text-foreground-muted hover:text-foreground-secondary rounded transition-colors"
          aria-label="Create folder"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="space-y-0.5">
        {rootFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
          />
        ))}
      </div>

      {isCreating && (
        <div className="pl-3 pr-2 py-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setIsCreating(false); setNewFolderName('') }
            }}
            onBlur={() => { if (!newFolderName.trim()) setIsCreating(false) }}
            placeholder="Folder name…"
            className="w-full px-2 py-1 bg-background-tertiary border border-white/10 rounded text-xs text-foreground-primary focus:outline-none focus:border-white/20"
            autoFocus
          />
        </div>
      )}

      {rootFolders.length === 0 && !isCreating && (
        <p className="pl-3 text-xs text-foreground-muted italic py-1">No folders yet</p>
      )}
    </nav>
  )
}
