-- Random Academic App - Supabase Database Schema
-- Session 2 - Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGER: Auto-create user record on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Metadata
  title TEXT NOT NULL,
  author TEXT,
  journal TEXT,
  publisher TEXT,
  publication_date DATE,
  doi TEXT,
  isbn TEXT,
  abstract TEXT,
  
  -- File info
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL CHECK (file_type IN ('epub', 'pdf', 'txt', 'md', 'html')),
  storage_path TEXT NOT NULL, -- Supabase storage path
  
  -- Processing status
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text_path TEXT, -- Path to extracted text file (if applicable)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  imported_from TEXT DEFAULT 'upload' CHECK (imported_from IN ('upload', 'rss', 'shadow_library', 'url')),
  
  -- Metadata for indexing
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'C')
  ) STORED
);

-- Index for search
CREATE INDEX documents_search_idx ON public.documents USING GIN (search_vector);
CREATE INDEX documents_user_id_idx ON public.documents (user_id);
CREATE INDEX documents_doi_idx ON public.documents (doi);
CREATE INDEX documents_created_at_idx ON public.documents (created_at DESC);

-- =============================================
-- FOLDERS TABLE (hierarchical)
-- =============================================
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX folders_user_id_idx ON public.folders (user_id);
CREATE INDEX folders_parent_id_idx ON public.folders (parent_id);

-- =============================================
-- DOCUMENT-FOLDER MANY-TO-MANY
-- =============================================
CREATE TABLE public.document_folders (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, folder_id)
);

CREATE INDEX document_folders_document_id_idx ON public.document_folders (document_id);
CREATE INDEX document_folders_folder_id_idx ON public.document_folders (folder_id);

-- =============================================
-- TAGS TABLE (flat)
-- =============================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX tags_user_id_idx ON public.tags (user_id);
CREATE INDEX tags_name_idx ON public.tags (name);

-- =============================================
-- DOCUMENT-TAG MANY-TO-MANY
-- =============================================
CREATE TABLE public.document_tags (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX document_tags_document_id_idx ON public.document_tags (document_id);
CREATE INDEX document_tags_tag_id_idx ON public.document_tags (tag_id);

-- =============================================
-- ANNOTATIONS TABLE
-- =============================================
CREATE TABLE public.annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Annotation type
  type TEXT NOT NULL CHECK (type IN ('highlight', 'underline', 'note', 'drawing')),
  
  -- Content
  text TEXT, -- Selected text (for highlights/underlines)
  note TEXT, -- User's note content
  color TEXT DEFAULT '#fbbf24', -- Highlight color (default: yellow)
  style TEXT DEFAULT 'highlight', -- 'highlight' or 'underline'
  
  -- Position data (format depends on document type)
  -- For EPUB: {cfi: "...", startOffset: N, endOffset: N}
  -- For PDF: {pageIndex: N, x1, y1, x2, y2}
  position_data JSONB NOT NULL,
  
  -- For PDF drawings (Apple Pencil)
  strokes JSONB, -- Array of stroke paths
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX annotations_user_id_idx ON public.annotations (user_id);
CREATE INDEX annotations_document_id_idx ON public.annotations (document_id);
CREATE INDEX annotations_type_idx ON public.annotations (type);

-- =============================================
-- READING PROGRESS TABLE
-- =============================================
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_location TEXT, -- CFI for EPUB, page for PDF
  percentage_complete NUMERIC(5, 2) DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  total_pages INTEGER,
  
  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'completed', 'abandoned')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, document_id)
);

CREATE INDEX reading_progress_user_id_idx ON public.reading_progress (user_id);
CREATE INDEX reading_progress_document_id_idx ON public.reading_progress (document_id);
CREATE INDEX reading_progress_status_idx ON public.reading_progress (status);

-- =============================================
-- RSS FEEDS TABLE
-- =============================================
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT DEFAULT 'general' CHECK (source_type IN ('general', 'institutional', 'publisher', 'news', 'preprint')),
  
  -- Fetch info
  last_fetched_at TIMESTAMPTZ,
  fetch_error TEXT,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX rss_feeds_user_id_idx ON public.rss_feeds (user_id);

-- =============================================
-- RSS ITEMS TABLE (staging area)
-- =============================================
CREATE TABLE public.rss_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  
  -- Item data
  title TEXT NOT NULL,
  link TEXT,
  abstract TEXT,
  authors TEXT[], -- Array of author names
  published_date TIMESTAMPTZ,
  
  -- External IDs for matching
  doi TEXT,
  
  -- Staging status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'imported')),
  imported_document_id UUID REFERENCES public.documents(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX rss_items_user_id_idx ON public.rss_items (user_id);
CREATE INDEX rss_items_feed_id_idx ON public.rss_items (feed_id);
CREATE INDEX rss_items_status_idx ON public.rss_items (status);
CREATE INDEX rss_items_doi_idx ON public.rss_items (doi);

-- =============================================
-- TO-READ TABLE
-- =============================================
CREATE TABLE public.to_read (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  priority_order INTEGER, -- Manual ordering within priority
  
  -- Optional deadline
  deadline DATE,
  
  -- Source tracking
  added_from TEXT DEFAULT 'manual' CHECK (added_from IN ('manual', 'rss', 'suggestion')),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, document_id)
);

CREATE INDEX to_read_user_id_idx ON public.to_read (user_id);
CREATE INDEX to_read_priority_idx ON public.to_read (priority);
CREATE INDEX to_read_deadline_idx ON public.to_read (deadline);

-- =============================================
-- SHADOW LIBRARY SOURCES TABLE
-- =============================================
CREATE TABLE public.shadow_library_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL = global default
  
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  search_endpoint TEXT NOT NULL, -- URL pattern with {query} placeholder
  active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false, -- Global defaults available to all users
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX shadow_library_sources_user_id_idx ON public.shadow_library_sources (user_id);

-- Insert default global sources
INSERT INTO public.shadow_library_sources (name, base_url, search_endpoint, is_global) VALUES
  ('Anna''s Archive', 'https://annas-archive.org', '/search?q={query}', true),
  ('Library Genesis', 'https://libgen.is', '/search.php?req={query}', true),
  ('Sci-Hub', 'https://sci-hub.se', '/search.php?request={query}', true);

-- =============================================
-- DOCUMENT NOTES TABLE (doc-level, not annotations)
-- =============================================
CREATE TABLE public.document_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX document_notes_user_id_idx ON public.document_notes (user_id);
CREATE INDEX document_notes_document_id_idx ON public.document_notes (document_id);

-- =============================================
-- SYNC METADATA TABLE (for offline sync)
-- =============================================
CREATE TABLE public.sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_upload', 'pending_download', 'conflict')),
  local_version INTEGER DEFAULT 1,
  remote_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, table_name, record_id)
);

CREATE INDEX sync_metadata_user_id_idx ON public.sync_metadata (user_id);
CREATE INDEX sync_metadata_status_idx ON public.sync_metadata (sync_status);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON public.annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rss_feeds_updated_at BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_to_read_updated_at BEFORE UPDATE ON public.to_read
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_notes_updated_at BEFORE UPDATE ON public.document_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_metadata_updated_at BEFORE UPDATE ON public.sync_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.to_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_library_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Folders
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- Document-Folder relations
CREATE POLICY "Users can view own document_folders" ON public.document_folders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own document_folders" ON public.document_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

-- Tags
CREATE POLICY "Users can view own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON public.tags
  FOR ALL USING (auth.uid() = user_id);

-- Document-Tag relations
CREATE POLICY "Users can view own document_tags" ON public.document_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own document_tags" ON public.document_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

-- Annotations
CREATE POLICY "Users can view own annotations" ON public.annotations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own annotations" ON public.annotations
  FOR ALL USING (auth.uid() = user_id);

-- Reading Progress
CREATE POLICY "Users can view own reading progress" ON public.reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading progress" ON public.reading_progress
  FOR ALL USING (auth.uid() = user_id);

-- RSS Feeds
CREATE POLICY "Users can view own RSS feeds" ON public.rss_feeds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own RSS feeds" ON public.rss_feeds
  FOR ALL USING (auth.uid() = user_id);

-- RSS Items
CREATE POLICY "Users can view own RSS items" ON public.rss_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own RSS items" ON public.rss_items
  FOR ALL USING (auth.uid() = user_id);

-- To-Read
CREATE POLICY "Users can view own to-read items" ON public.to_read
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own to-read items" ON public.to_read
  FOR ALL USING (auth.uid() = user_id);

-- Shadow Library Sources
CREATE POLICY "Users can view shadow library sources" ON public.shadow_library_sources
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own shadow library sources" ON public.shadow_library_sources
  FOR ALL USING (auth.uid() = user_id);

-- Document Notes
CREATE POLICY "Users can view own document notes" ON public.document_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own document notes" ON public.document_notes
  FOR ALL USING (auth.uid() = user_id);

-- Sync Metadata
CREATE POLICY "Users can view own sync metadata" ON public.sync_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync metadata" ON public.sync_metadata
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS (to be created via Supabase UI or API)
-- =============================================
-- Run this in Supabase SQL Editor or via their API:
-- 
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('documents', 'documents', false);
-- 
-- Then add RLS policies for storage:
-- CREATE POLICY "Users can upload own documents" ON storage.objects
--   FOR INSERT TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Users can view own documents" ON storage.objects
--   FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Users can delete own documents" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
