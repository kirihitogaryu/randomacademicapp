# Implementation Roadmap

**Project:** Random Academic App  
**Last Updated:** 2026-03-28  
**Status:** Planning Phase

---

## Phase 0: Foundation & Setup

### 0.1 Tech Stack Selection
- [ ] **Frontend Framework:** React + TypeScript (cross-platform, strong ecosystem)
- [ ] **UI Library:** Bootstrap CSS + Material Design components (per PROJECT.md)
- [ ] **State Management:** Zustand or React Query (lightweight, good for sync state)
- [ ] **Build Tool:** Vite (fast dev server, multi-platform builds)
- [ ] **Mobile Wrapper:** Capacitor (single codebase for Android + iPad)
- [ ] **Backend:** Supabase (PostgreSQL, auth, storage, real-time sync)

### 0.2 Project Scaffolding
- [ ] Initialize monorepo structure (web + mobile shared code)
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint + Prettier
- [ ] Set up Supabase project (free tier)
- [ ] Create basic CI/CD pipeline (GitHub Actions)

### 0.3 Database Schema Design
- [ ] Users table (Supabase auth)
- [ ] Documents table (metadata, file references, format type)
- [ ] Folders table (hierarchical, many-to-many with documents)
- [ ] Tags table (flat, many-to-many with documents)
- [ ] Annotations table (highlights, notes, colors, styles, position data)
- [ ] RSS_Feeds table (user-configured feeds)
- [ ] RSS_Items table (staging area items)
- [ ] To_Read table (priority, deadlines)
- [ ] Reading_Progress table (per-user, per-document progress)
- [ ] Sync_Metadata table (offline sync tracking)

---

## Phase 1: Core Infrastructure

### 1.1 Supabase Integration
- [ ] Set up Supabase client
- [ ] Implement authentication (email/password, optional OAuth)
- [ ] Create database migrations (SQL files)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure storage buckets for document files

### 1.2 Offline-First Sync Layer
- [ ] Implement local database (IndexedDB for web, SQLite for mobile via Capacitor)
- [ ] Create sync engine (local ↔ Supabase)
- [ ] Handle conflict resolution (last-write-wins for now)
- [ ] Queue offline operations for later sync
- [ ] Sync status indicator UI

### 1.3 Document Storage & Retrieval
- [ ] File upload to Supabase storage
- [ ] File download/streaming
- [ ] Local caching for offline access
- [ ] File type detection (EPUB, PDF, text)

---

## Phase 2: Library Hub

### 2.1 Document Management
- [ ] Document list view (detailed + compact toggle)
- [ ] Document card component (metadata, progress indicator)
- [ ] Document detail view (full metadata, abstract)
- [ ] Empty state with quick-add prompts

### 2.2 Folder System
- [ ] Folder CRUD operations
- [ ] Nested folder structure (sidebar navigation)
- [ ] Many-to-many document-folder relationships
- [ ] Drag-and-drop documents into folders

### 2.3 Tag System
- [ ] Tag CRUD operations
- [ ] Separate Tags page (all tags + associated articles)
- [ ] Tag-based filtering
- [ ] Auto-tagging on import (from metadata)

### 2.4 Search & Filter
- [ ] Search by title/abstract
- [ ] Filter by folder, tag, format, date
- [ ] Sort options (date added, title, author, progress)

### 2.5 Import System
- [ ] Web upload interface (single + multiple files)
- [ ] Folder bulk import (drag-and-drop folder)
- [ ] Metadata extraction from files
- [ ] Manual metadata editing
- [ ] Metadata auto-fetcher (DOI/title lookup)

### 2.6 Smart Collections
- [ ] Recently Added (auto-populated)
- [ ] Unread filter
- [ ] Continue Reading (last-read document with progress)
- [ ] To-Read List (priority-sorted, optional deadlines)

---

## Phase 3: Reader

### 3.1 EPUB Reader
- [ ] EPUB parsing and rendering
- [ ] Chapter navigation
- [ ] Font size adjustment
- [ ] Dark mode (dark grey background, white text)
- [ ] Nightlight mode (blue light reduction)
- [ ] Reading progress tracking

### 3.2 PDF Reader
- [ ] PDF rendering (PDF.js or similar)
- [ ] Original PDF view (zoom, pan)
- [ ] Text extraction pipeline (GROBID integration)
- [ ] Extracted text view (reflowable, readable)
- [ ] Dual-view toggle (original ↔ extracted)
- [ ] Dark mode for PDFs (color inversion fallback)
- [ ] Text resizing (for extracted view)
- [ ] Extraction quality indicator

### 3.3 Text Format Support
- [ ] Plain text (.txt) rendering
- [ ] Markdown (.md) rendering
- [ ] HTML rendering

### 3.4 Reader UI
- [ ] Reading progress bar
- [ ] Page/section navigation
- [ ] Table of contents sidebar
- [ ] Fullscreen mode
- [ ] Keyboard shortcuts (desktop)

---

## Phase 4: Annotation System

### 4.1 Core Annotation Features
- [ ] Text selection detection
- [ ] Highlight creation (multiple colors)
- [ ] Highlight styles (highlight, underline)
- [ ] Annotation position anchoring (document location)
- [ ] Annotation storage (separate from document, linked by position)

### 4.2 Annotation UI
- [ ] Desktop/iPad: Side panel for annotation notes
- [ ] Mobile/Android: Bottom sheet for annotation notes
- [ ] Highlight click → open note panel
- [ ] Edit/delete annotations
- [ ] Annotation list view (all annotations per document)

### 4.3 iPad PDF Annotations
- [ ] Apple Pencil support
- [ ] Drawing/writing on PDF layer
- [ ] Stroke data storage
- [ ] Render annotations on PDF view

### 4.4 Annotation Sync
- [ ] Sync annotations across devices
- [ ] Conflict resolution for annotation edits
- [ ] Offline annotation creation → sync later

---

## Phase 5: RSS Inbox

### 5.1 RSS Feed Management
- [ ] Add/edit/delete RSS feeds
- [ ] Feed URL validation
- [ ] Configurable sources (institutional, publishers, news)
- [ ] Feed refresh scheduling

### 5.2 RSS Item Processing
- [ ] Parse RSS feed items
- [ ] Extract headline + abstract
- [ ] Store in RSS_Items staging table
- [ ] No auto-import (manual approval required)

### 5.3 RSS Inbox UI
- [ ] Inbox page (list of pending items)
- [ ] Filter by source, date, relevance
- [ ] Approve → import to library (triggers shadow library search)
- [ ] Reject → discard
- [ ] Mark for later → keep in inbox
- [ ] Bulk actions (approve/reject multiple)

---

## Phase 6: Shadow Library Integration

### 6.1 Integration Setup
- [ ] Configurable domain references (Anna's Archive, LibGen, Sci-Hub)
- [ ] Domain update mechanism (domains change)
- [ ] API/scraper integration for each source

### 6.2 Search Functionality
- [ ] Search by DOI
- [ ] Search by title
- [ ] Search by author (optional)

### 6.3 Results & Import
- [ ] Display multiple sources when available
- [ ] Let user pick preferred source
- [ ] Direct import when possible
- [ ] Provide download links when direct import not possible
- [ ] Integration with RSS approve flow
- [ ] Integration with manual import flow

---

## Phase 7: Additional Features

### 7.1 Export System
- [ ] Annotations export (Markdown, PDF, plain text)
- [ ] Citation export (BibTeX, RIS)
- [ ] Bulk export (multiple documents)
- [ ] Full library backup

### 7.2 Deduplication
- [ ] Duplicate detection (DOI, file hash, title match)
- [ ] Warning before duplicate import
- [ ] Merge option for duplicates

### 7.3 Batch Operations
- [ ] Multi-select documents
- [ ] Bulk move to folder(s)
- [ ] Bulk tag/untag
- [ ] Bulk delete (from library, RSS inbox)

### 7.4 Keyboard Shortcuts (Desktop)
- [ ] Quick navigation (library, search, RSS, etc.)
- [ ] Quick actions (open, annotate, toggle view)
- [ ] Shortcut customization (optional)

### 7.5 Reading Statistics
- [ ] Papers read per week/month
- [ ] Time spent reading
- [ ] Annotation count per document
- [ ] Reading streaks
- [ ] Optional: Goodreads/Storygraph integration (view-only)

### 7.6 Doc-Level Notes
- [ ] Notes attached to document info (separate from annotations)
- [ ] Edit/view notes in document detail view

---

## Phase 8: Future/Advanced Features

### 8.1 AI Integration (ChatGPT API)
- [ ] User API key setup
- [ ] Backend endpoint for AI calls
- [ ] Select highlighted text → AI actions:
  - Explain concepts in simpler terms
  - Define unfamiliar terminology
  - Contextual assistance
- [ ] Store AI responses as annotation metadata
- [ ] Cost monitoring (GPT-4o-mini or GPT-3.5-turbo)

### 8.2 Highlight Linking
- [ ] Link highlights to other highlights
- [ ] Right-click/long-press → "Link to another highlight"
- [ ] Store links as annotation metadata
- [ ] Query linked annotations
- [ ] Use cases: in-text citations, recurring themes, concept maps

### 8.3 Graph Visualization (Far Future)
- [ ] Visualize linked highlights (React Flow or Cytoscape.js)
- [ ] Auto-suggest links based on semantic similarity (embeddings)
- [ ] Tag-based grouping
- [ ] Export linked highlights as "concept map"

---

## Phase 9: Polish & Deployment

### 9.1 UI/UX Refinement
- [ ] Dark color scheme tuning (pleasing, easy on eyes)
- [ ] Decorative header font for app title
- [ ] Visual hierarchy review
- [ ] Accessibility audit (WCAG compliance)
- [ ] Responsive design testing (all target platforms)

### 9.2 Performance Optimization
- [ ] Bundle size optimization
- [ ] Lazy loading for large libraries
- [ ] Image/document caching
- [ ] Sync performance tuning

### 9.3 Testing
- [ ] Unit tests (critical functions)
- [ ] Integration tests (sync, import, annotation)
- [ ] E2E tests (key user flows)
- [ ] Cross-platform testing (Android, iPad, Desktop)
- [ ] Offline mode testing

### 9.4 Deployment
- [ ] Web app deployment (Vercel, Netlify, or self-hosted)
- [ ] Android app build (Capacitor → APK)
- [ ] iPad app build (Capacitor → IPA, TestFlight)
- [ ] Domain setup (if self-hosted)
- [ ] SSL certificates

### 9.5 Documentation
- [ ] User guide (basic features, import, annotations)
- [ ] Setup guide (API keys, shadow library config)
- [ ] Troubleshooting guide
- [ ] Changelog maintenance

---

## Implementation Notes

### Priority Order
1. **P0 (Must Have):** Phases 0-2 (foundation, library, basic reader)
2. **P1 (High Priority):** Phases 3-4 (annotations, core reading experience)
3. **P2 (Medium Priority):** Phases 5-7 (RSS, shadow library, export)
4. **P3 (Nice to Have):** Phase 8 (AI, highlight linking)
5. **P4 (Future):** Phase 8.3 (graph visualization)

### Dependencies
- Phase 0 must complete before any other phase
- Phase 1 (sync layer) must complete before Phase 2 (library)
- Phase 2 (library) should complete before Phase 3 (reader)
- Phase 3 (reader) must complete before Phase 4 (annotations)
- Phase 5 (RSS) and Phase 6 (Shadow Library) can develop in parallel
- Phase 7 (additional features) can be picked up incrementally

### Estimated Effort (Rough)
- Phase 0: 1-2 weeks
- Phase 1: 2-3 weeks
- Phase 2: 3-4 weeks
- Phase 3: 3-4 weeks
- Phase 4: 2-3 weeks
- Phase 5: 1-2 weeks
- Phase 6: 2-3 weeks
- Phase 7: 2-4 weeks (incremental)
- Phase 8: TBD (future)
- Phase 9: 2-3 weeks

**Total (P0-P4, excluding Phase 8):** ~18-28 weeks for MVP + core features

---

## Session Progress Tracking

### Session 1 - 2026-03-28
- [x] Created PROJECT.md with full requirements
- [x] Created ROADMAP.md with implementation plan
- [ ] Next: Begin Phase 0 (tech stack finalization, project scaffolding)

### Session 2 - 2026-03-28
- [x] Finalized tech stack (React + TypeScript, Tailwind, Vite, Supabase, Capacitor)
- [x] Created monorepo directory structure
- [x] Set up root package.json with workspaces
- [x] Configured TypeScript (root + web app)
- [x] Scaffolded web app with Vite + React
- [x] Configured Tailwind CSS with dark theme palette
- [x] Created basic App component with layout structure
- [x] Installed dependencies
- [x] Verified dev server runs successfully
- [x] Created complete database schema (packages/database/schema.sql)
- [x] Defined TypeScript types for all database tables
- [x] Set up Supabase client configuration (@shared/core)
- [x] Created authentication store (Zustand)
- [x] Built login/signup form component
- [x] Integrated auth into App.tsx (login → main layout)
- [x] Created Supabase setup guide (SUPABASE_SETUP.md)
- [ ] Next: User to complete Supabase setup, then build document upload + library view

### Session 3 - 2026-03-28
- [x] Created DocumentUpload component with drag-and-drop support
- [x] Built DocumentCard component (detailed + compact views)
- [x] Created FolderSidebar with nested folder support
- [x] Integrated components into main App with mock data
- [x] Added search functionality and view mode toggle
- [x] Created custom React Query-like hooks (useQuery, useMutation)
- [x] Built Supabase data hooks (useDocuments, useFolders, useTags, useCreateDocument, useCreateFolder, useUploadFile)
- [x] Added line-clamp utilities for text truncation
- [x] Connected UI to Supabase (authentication, file upload, database records)
- [x] Fixed RLS policies for storage bucket
- [x] Created auto-user trigger for auth.signup
- [x] Implemented PDF reader with react-pdf (dark mode, zoom, page navigation)
- [x] Implemented EPUB reader with epubjs (dark mode, font size, TOC, chapter navigation)
- [x] Implemented TextReader for TXT/MD/HTML files (dark mode, font size)
- [x] Added signed URL generation for private storage access
- [x] All file types now upload and display correctly
- [ ] Next: Metadata extraction (GROBID), annotation system, RSS inbox, shadow library integration
