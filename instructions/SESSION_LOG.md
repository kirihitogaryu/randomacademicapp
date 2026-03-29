# Session Log

**Project:** Random Academic App  
**Type:** Cross-platform Web Application  
**Created:** 2026-03-28

---

## Session 1 - 2026-03-28

**Summary:** Initial project setup. Created internal documentation structure. Extensive feature discussion for cross-platform academic reading app.

**Changes Made:**
- Created `instructions/PROJECT.md` as the main documentation file
- Established ground rules for ongoing development

**Features Discussed & Documented:**
- Core vision: Cross-platform synced web app (Android, iPad, Desktop) for academic reading
- Backend: Supabase free tier, offline-first sync
- Document import: Web upload, folder bulk import, RSS feeds, shadow library integration
- Reader: EPUB + PDF (dual view: extracted/original), dark mode, text resizing, nightlight
- PDF extraction: Hybrid approach using GROBID with fallbacks
- Annotations: Highlights, notes, colors/styles, Apple Pencil (iPad), synced across devices
- Future features: AI integration (ChatGPT API), highlight linking
- Library hub: Folders + tags organization, smart collections, view modes
- RSS Inbox: Staging area for manual approval before import
- To-Read list: Priority-sorted with optional deadlines
- Additional features: Export, deduplication, batch ops, keyboard shortcuts, reading stats, metadata management, backup

---

## Session 2 - 2026-03-28

**Summary:** Tech stack finalization and project scaffolding. Set up React + TypeScript + Vite + Tailwind + Supabase foundation with authentication.

**Changes Made:**
- Finalized tech stack: React + TypeScript, Tailwind CSS, Vite, Supabase, Capacitor (for future mobile)
- Created monorepo directory structure (apps/web, packages/shared, packages/database)
- Set up root package.json with workspaces
- Configured TypeScript (root + web app)
- Scaffolded web app with Vite + React
- Configured Tailwind CSS with custom dark theme palette
- Created basic App component with layout structure
- Created complete database schema (`packages/database/schema.sql`)
  - 15 tables: users, documents, folders, tags, annotations, reading_progress, rss_feeds, rss_items, to_read, shadow_library_sources, document_notes, sync_metadata, and junction tables
  - Row Level Security (RLS) policies for all tables
  - Triggers for updated_at timestamps
  - Full-text search support on documents
- Defined TypeScript types for all database tables (`packages/database/src/types.ts`)
- Set up Supabase client configuration (`packages/shared/src/supabase.ts`)
- Created authentication store with Zustand (`apps/web/src/store/authStore.ts`)
- Built login/signup form component (`apps/web/src/components/LoginForm.tsx`)
- Integrated auth into App.tsx (login → main layout)
- Created Supabase setup guide (`SUPABASE_SETUP.md`)
- Created implementation roadmap (`ROADMAP.md`)

**Tech Stack Decisions:**
- React chosen over Vue/Svelte/Solid for mature ecosystem (PDF/EPUB libraries)
- Tailwind over Bootstrap for easier dark theme customization
- Zustand + TanStack Query pattern for state management
- Dexie.js planned for offline-first IndexedDB wrapper
- Capacitor for cross-platform mobile deployment

---

## Session 3 - 2026-03-28

**Summary:** Full application build-out. Connected Supabase backend, implemented document upload, and created readers for all file types (PDF, EPUB, TXT/MD/HTML).

**Changes Made:**
- Created DocumentUpload component with drag-and-drop support (`apps/web/src/components/DocumentUpload.tsx`)
- Built DocumentCard component with detailed and compact views (`apps/web/src/components/DocumentCard.tsx`)
- Created FolderSidebar with nested folder navigation (`apps/web/src/components/FolderSidebar.tsx`)
- Integrated all components into main App with real Supabase data
- Added search functionality and view mode toggle (detailed/compact)
- Created custom React Query-like hooks (`apps/web/src/hooks/useSupabase.ts`)
  - useQuery, useMutation for data fetching/mutations
  - useDocuments, useFolders, useTags for data fetching
  - useCreateDocument, useCreateFolder, useUploadFile for mutations
- Added line-clamp CSS utilities for text truncation
- Connected UI to Supabase backend
  - Authentication working (signup/login)
  - File upload to Supabase storage
  - Database record creation
  - Library display with real data
- Fixed RLS policies for storage bucket (removed restrictive folder checks)
- Created auto-user trigger for auth.users → public.users sync
- Implemented PDF reader (`apps/web/src/components/PDFReader.tsx`)
  - react-pdf library with PDF.js worker
  - Dark mode with color inversion
  - Zoom controls (60%-300%)
  - Page navigation (prev/next)
  - Page counter
- Implemented EPUB reader (`apps/web/src/components/EPUBReader.tsx`)
  - epubjs library with ArrayBuffer loading
  - Dark mode theme
  - Font size controls (50%-200%)
  - Table of contents sidebar
  - Scrolled flow for reliable rendering
  - Chapter navigation
  - Progress percentage
- Implemented TextReader for TXT/MD/HTML files (`apps/web/src/components/TextReader.tsx`)
  - Simple text display with monospace font
  - Dark mode toggle
  - Font size controls
- Added signed URL generation for private Supabase storage access
- All file types now upload and display correctly

**Bugs Fixed:**
- Fixed Vite path alias resolution (moved to relative imports)
- Fixed CSS border-border class error
- Fixed ternary syntax error in document count display
- Fixed Supabase user record creation (added trigger)
- Fixed storage RLS policies (removed overly restrictive folder checks)
- Fixed filename sanitization for storage paths
- Fixed PDF.js worker version mismatch (using local worker)
- Fixed EPUB loading (ArrayBuffer approach, spine iteration fix)

**Known Issues:**
- EPUB pagination unreliable - using scrolled flow as workaround
- No metadata extraction yet (all documents use filename as title)
- No annotation system yet

---

## Future Sessions (Planned)

**Session 4+ Goals:**
- [ ] Metadata extraction with GROBID (PDF structure-aware extraction)
- [ ] Annotation system (highlights, notes, colors, sync)
- [ ] RSS inbox (feed management, staging area, approval workflow)
- [ ] Shadow library integration (Anna's Archive, LibGen, Sci-Hub search)
- [ ] To-Read list (priority sorting, deadlines)
- [ ] Reading statistics dashboard
- [ ] Export functionality (annotations, citations, backup)
- [ ] Deduplication on import
- [ ] Batch operations
- [ ] Keyboard shortcuts (desktop)
- [ ] Offline-first sync layer (Dexie.js + sync engine)
- [ ] Mobile app builds (Capacitor → Android APK, iPad IPA)

---

## Technical Debt / TODOs

1. **EPUB Reader:** Pagination not working reliably - currently using scrolled flow
2. **Metadata:** No automatic extraction - all titles are filenames
3. **Annotations:** Not implemented
4. **Offline Sync:** Not implemented - requires Dexie.js + sync engine
5. **Mobile:** Not built - Capacitor setup pending
6. **Error Handling:** Minimal - needs improvement throughout
7. **Loading States:** Basic - could be more polished

---

## Code Statistics (as of Session 3)

**Components:** 8
- LoginForm, DocumentUpload, DocumentCard, FolderSidebar, PDFReader, EPUBReader, TextReader, App

**Hooks:** 6
- useQuery, useMutation, useDocuments, useFolders, useTags, useCreateDocument, useCreateFolder, useUploadFile

**Database Tables:** 15
- users, documents, folders, tags, document_folders, document_tags, annotations, reading_progress, rss_feeds, rss_items, to_read, shadow_library_sources, document_notes, sync_metadata

**Lines of Code (approx):**
- Frontend: ~2,500 lines
- Database schema: ~520 lines
- TypeScript types: ~240 lines
