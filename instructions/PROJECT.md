# Project Documentation

**Project Name:** Random Academic App
**Type:** Cross-platform Web Application
**Created:** 2026-03-28

---

## Session Log

Session history has been moved to [`SESSION_LOG.md`](./SESSION_LOG.md) for better organization.

---

## Ground Rules

1. **End-of-Session Documentation:** At the end of each session, document what changes were made in the Session Log above.
2. **Append-Only History:** Nothing is deleted from this file. New information is added; old information is preserved.
3. **Single Source of Truth:** This file serves as the primary reference for project decisions, rules, and conventions.
4. **No Large Deletions:** Do not delete large portions of code without very explicit permission and explanation of what is being done.
5. **Complete Before Committing:** Ensure everything is finished and closed before releasing an update to the codebase.
6. **Library Suggestions:** Suggest libraries when genuinely useful - no unnecessary simplification. Trust the user's expertise.
7. **Tool Use:** Tool use is always welcome when relevant.
8. **Be Inquisitive:** Ask questions where appropriate during feature discussions and technical considerations. This helps explore possibilities and refine requirements.

---

## Project Rules

*(To be expanded as the project develops)*

---

## Architecture & Decisions

### Core Vision
A cross-platform, synced web application for reading and annotating academic articles. Functions as a combination of Readwise Reader, Pocket, and Zotero - focused on comfortable, regular academic reading with flexible annotation and organization.

### Target Platforms
- Android phones
- iPads
- Desktop

### User Scope
- Personal use (1-3 users max)
- Single-user focused design, with potential for partner/friend access in future

### Document Types
- EPUBs
- PDFs
- Text files (various formats)
- All formats treated uniformly as "documents"

### Core Features
- Document library management
- Multi-format reading (EPUB, PDF, text)
- Annotation system (priority feature)
- Organization system (priority feature)
- Cross-device sync

### Backend & Sync
- **Backend:** Leaning toward Supabase (free tier), cost-conscious - no subscription willingness
- **Sync:** Core feature - documents must sync across all devices
- **Offline-first:** Documents available offline, synced when online again
- **Rationale:** User has been disappointed by existing apps due to monthly fees, scattered features, or overcomplication lacking basic functionality

### Document Import
- Web upload interface
- Folder import (bulk file uploads)
- Customizable RSS feed importer (institutional sources, news, publishers)
- **RSS Note:** If institutional full-text access isn't technically feasible, headlines + abstracts alone are still valuable for research discovery. User can obtain papers separately (e.g., Anna's Archive) if interested.
- **Shadow Library Integration:** Integration with shadow libraries (Anna's Archive, Library Genesis, Sci-Hub) for paper acquisition. Must support configurable/updatable domain references since domains change regularly.
- **Search Method:** Query by DOI or title
- **Import Behavior:** Attempt direct import when possible; if not, provide direct links to the relevant download/page on whichever shadow library has the content
- **Multiple Results:** Show all available sources when multiple shadow libraries have the same paper - let user pick their preferred source
- **Feature Scope:** Separate feature from RSS importer - not automatically integrated

---

## Library (Document Hub)

### Organization System
- **Folders:** Hierarchical organization for broad categorization
  - Example use: Classes, topics, disciplines
  - Keep organization simple (not as deep/complex as Zotero)
  - Documents can exist in multiple folders (many-to-many relationship)
- **Tags:** Flat, flexible tagging for precise categorization
  - Example use: Authors, fields, themes, keywords
  - Quick search by tag to find related materials

### Search
- Search by document titles
- Search by abstracts (when metadata available)
- Full-text search not required (keeps complexity down)

### Smart Collections
- **Recently Added:** Auto-populated list of newest documents
- **Unread:** Documents not yet opened
- **Continue Reading:** Pinned display showing last-read document with reading progress indicator (quickly resume where you left off)
- **To-Read List:** Curated list of documents to read, sorted by priority
  - Items can be added from library or from RSS inbox
  - Manual priority assignment (high/medium/low or custom ordering)
  - Optional deadlines per item (e.g., "read by March 30")
  - Optional: Auto-suggest from RSS feeds based on relevance to existing library topics
  - Helps manage reading queue and prioritize academic materials

### RSS Inbox (Staging Area)
- Separate page for reviewing RSS feed items before importing to library
- RSS items do NOT auto-import - must be manually approved
- Shows headlines + abstracts from RSS feeds
- Allows filtering by source, date, relevance
- Actions per item:
  - Approve → Import to library (triggers shadow library search if no full-text)
  - Reject → Discard from inbox
  - Mark for later → Keep in inbox for future review
- Prevents library clutter from low-quality or irrelevant RSS matches

### Auto-Tagging on Import
- Automatically extract and apply tags from document metadata:
  - Author names
  - Journal/publication source
  - Publication date
  - Subject keywords (from journal metadata)
- Leverage existing academic journal organization systems for metadata extraction

### UI Design
- Clean, visually clear interface
- User has a mockup reference with general desired aesthetic
- **Design Principles (from mockup):**
  - Dark color scheme (pleasing, easy on eyes)
  - Decorative header font for app title
  - Sidebar folder display with nested structure
  - Document cards with alternating darker/lighter background colors for visual intrigue
  - Clear metadata display (author, journal, tags, abstract preview)
- **Elements to Avoid:**
  - Blended/indistinct header bars (top bar that blends into background)
  - Highlights panel in library view (not needed in main hub)
  - Overcomplication - keep visual hierarchy clear and functional
- **View Modes:**
  - **Detailed View:** Title + DOI (if available) + journal cover + extended abstract snippet
  - **Compact View:** Title + author only (for quick scrolling through articles)
  - Toggle between views based on user preference
- **Reading Progress:** Page count indicator on document cards (e.g., "24/300")
- **Tags Navigation:**
  - No inline tags in sidebar (would become too long)
  - Separate "Tags" page showing all tags with associated articles
  - Click tag to filter library by that tag
- **Empty State:**
  - "No documents" message
  - Quick-add prompt with options: import from URL or upload files

---

## Annotation System

### Core Features
- **Highlighting:** Select text to highlight
- **Note Panel:** When text is highlighted, a side panel opens (desktop/iPad UI) for adding notes to that annotation
- **Highlight Colors:** User-selectable colors for different highlights
- **Highlight Styles:** Multiple annotation styles available:
  - Traditional highlight
  - Underline
  - (Other styles as feasible)
- **Sync:** Annotations sync across all devices
- **Storage Model:** Annotations stored as a "top layer" separate from the document - easily exportable, but firmly anchored to document location (not floating metadata)

### Platform-Specific UI
- **Desktop/iPad:** Side panel for annotation notes
- **Android/Mobile:** Bottom sheet that pulls up when clicking an annotation
- **iPad (PDF-only):** Apple Pencil support - physically write/draw on PDF documents

### Future/Advanced Features (Far-off)

#### AI Integration
- **Use Case:** When selecting a highlighted paragraph:
  - Explain concepts in simpler terms
  - Define unfamiliar terminology
  - Other contextual assistance
- **Implementation Framework:**
  - **Provider:** OpenAI ChatGPT API (GPT-4o-mini or GPT-3.5-turbo for cost efficiency)
  - **Architecture:** Backend endpoint handles AI calls, stores responses as annotation metadata
  - **Cost:** ~$0.15/1M tokens (input), minimal for typical usage
  - **User Setup:** User provides their own API key
  - **Prompt Templates:** Predefined prompts for explain, define, summarize actions

#### Highlight Linking
- **Use Case:** Link highlighted text to other highlights:
  - Useful for in-text citations
  - Map recurring themes and central ideas
  - Create connections across documents
- **Implementation Framework:**
  - **Data Model:** Store links as annotation metadata (array of annotation IDs)
  - **UI:** Right-click/long-press on highlight → "Link to another highlight" → Select target
  - **Query:** Find linked annotations by ID, filter by document
  - **Future Extensions:**
    - Graph visualization (React Flow or Cytoscape.js)
    - Auto-suggest links based on semantic similarity (embeddings)
    - Tag-based grouping
    - Export linked highlights as "concept map"

---

## Reader Features

### EPUB
- Standard EPUB reading support

### PDF
- **Dual View Mode:**
  1. Extracted text view - text extracted and reformatted for readability (no zooming required)
  2. Original PDF view - render PDF as-is
- **Dark Mode:** Essential feature
  - Preferred: Dark grey background with white text
  - Fallback: Invert PDF colors if direct styling not possible
  - Reference: SumatraPDF's color inversion approach
- **Text Resizing:** Resizable text where possible (accessibility requirement)
- **Text Extraction Strategy (Hybrid Approach):**
  - Primary: Use GROBID (ML model trained on academic papers) for structure-aware extraction (headings, citations, sections)
  - Fallback options when GROBID fails or low confidence:
    - Original PDF view only (no extracted text option)
    - Or OCR pass (adds processing time but salvageable)
  - Alternative for problematic PDFs: Render pages as images for clean zoom/pan (annotations layer on top)
  - User-visible extraction quality indicator
- **Processing:** On-demand extraction (not at upload time)

### Other Text Formats
- Support for additional text formats as feasible (lower priority than PDF/EPUB)

### Eye Comfort
- Nightlight mode (blue light reduction) to prevent eyestrain

---

## Additional Features

### Export
- **Annotations Export:** Export annotations + notes in multiple formats (Markdown, PDF with annotations, plain text)
- **Citation Export:** Export citation data in BibTeX, RIS formats (Zotero/Mendeley compatibility)
- **Bulk Export:** Export multiple items at once for backup or migration

### Deduplication
- Detect duplicate uploads by DOI, file hash, or title match
- Warn user before importing duplicate documents
- Prevent accidental re-imports of the same paper

### Batch Operations
- Move multiple documents to folder(s) at once
- Bulk tag/untag documents
- Bulk delete from RSS inbox
- Bulk actions on library selections

### Keyboard Shortcuts (Desktop)
- Quick navigation (jump to library, search, RSS inbox, etc.)
- Quick actions (open document, annotate, toggle view mode)
- Power user quality-of-life improvements

### Reading Statistics
- Papers read per week/month
- Time spent reading
- Annotation count per document
- Academic productivity tracking
- **Optional Integration:** Connect with Goodreads or Storygraph for personal reading tracking (view-only, not synced back to app)

### Metadata Management
- **Manual Editing:** Edit document metadata directly (title, author, journal, date, etc.)
- **Metadata Fetcher:** Auto-fetch missing metadata from academic databases using title + author when document lacks information
- **Doc-Level Notes:** Add notes to document info (separate from annotations - general notes about the document itself)

### Backup
- Download entire library + annotations as backup
- Full export for migration or disaster recovery
- Important for primary research tool reliability
