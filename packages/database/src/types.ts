// Database types matching the Supabase schema

export type UUID = string;

export type DocumentType = 'epub' | 'pdf' | 'txt' | 'md' | 'html';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ImportSource = 'upload' | 'rss' | 'shadow_library' | 'url';

export interface Document {
  id: UUID;
  user_id: UUID;
  title: string;
  author: string | null;
  journal: string | null;
  publisher: string | null;
  publication_date: string | null; // ISO date
  doi: string | null;
  isbn: string | null;
  abstract: string | null;
  file_name: string;
  file_size: number | null;
  file_type: DocumentType;
  storage_path: string;
  extraction_status: ExtractionStatus;
  extracted_text_path: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  imported_from: ImportSource;
}

export type Folder = {
  id: UUID;
  user_id: UUID;
  name: string;
  parent_id: UUID | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export interface Tag {
  id: UUID;
  user_id: UUID;
  name: string;
  color: string | null;
  created_at: string;
}

export type AnnotationType = 'highlight' | 'underline' | 'note' | 'drawing';
export type AnnotationStyle = 'highlight' | 'underline';

export interface Annotation {
  id: UUID;
  user_id: UUID;
  document_id: UUID;
  type: AnnotationType;
  text: string | null;
  note: string | null;
  color: string;
  style: AnnotationStyle;
  position_data: EPUBPosition | PDFPosition;
  strokes: Stroke[] | null; // For Apple Pencil drawings
  created_at: string;
  updated_at: string;
}

export interface EPUBPosition {
  cfi: string;
  startOffset: number;
  endOffset: number;
}

export interface PDFPosition {
  pageIndex: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export type ReadingStatus = 'unread' | 'in_progress' | 'completed' | 'abandoned';

export interface ReadingProgress {
  id: UUID;
  user_id: UUID;
  document_id: UUID;
  current_location: string | null;
  percentage_complete: number;
  pages_read: number;
  total_pages: number | null;
  time_spent_seconds: number;
  last_read_at: string;
  status: ReadingStatus;
  created_at: string;
  updated_at: string;
}

export type RSSFeedSourceType = 'general' | 'institutional' | 'publisher' | 'news' | 'preprint';

export interface RSSFeed {
  id: UUID;
  user_id: UUID;
  name: string;
  url: string;
  source_type: RSSFeedSourceType;
  last_fetched_at: string | null;
  fetch_error: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type RSSItemStatus = 'pending' | 'approved' | 'rejected' | 'imported';

export interface RSSItem {
  id: UUID;
  user_id: UUID;
  feed_id: UUID;
  title: string;
  link: string | null;
  abstract: string | null;
  authors: string[] | null;
  published_date: string | null;
  doi: string | null;
  status: RSSItemStatus;
  imported_document_id: UUID | null;
  created_at: string;
  reviewed_at: string | null;
}

export type Priority = 'high' | 'medium' | 'low';
export type AddedFrom = 'manual' | 'rss' | 'suggestion';

export interface ToReadItem {
  id: UUID;
  user_id: UUID;
  document_id: UUID;
  priority: Priority;
  priority_order: number | null;
  deadline: string | null; // ISO date
  added_from: AddedFrom;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShadowLibrarySource {
  id: UUID;
  user_id: UUID | null; // null = global default
  name: string;
  base_url: string;
  search_endpoint: string; // URL pattern with {query} placeholder
  active: boolean;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentNote {
  id: UUID;
  user_id: UUID;
  document_id: UUID;
  content: string;
  created_at: string;
  updated_at: string;
}

export type SyncStatus = 'synced' | 'pending_upload' | 'pending_download' | 'conflict';

export interface SyncMetadata {
  id: UUID;
  user_id: UUID;
  table_name: string;
  record_id: UUID;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  local_version: number;
  remote_version: number;
  created_at: string;
  updated_at: string;
}

// Database schema types for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: UUID;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'created_at' | 'updated_at' | 'search_vector'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'created_at' | 'updated_at'>;
        Update: Partial<Folder>;
      };
      document_folders: {
        Row: {
          document_id: UUID;
          folder_id: UUID;
          created_at: string;
        };
        Insert: {
          document_id: UUID;
          folder_id: UUID;
        };
        Update: never;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'created_at'>;
        Update: Partial<Omit<Tag, 'created_at'>>;
      };
      document_tags: {
        Row: {
          document_id: UUID;
          tag_id: UUID;
          created_at: string;
        };
        Insert: {
          document_id: UUID;
          tag_id: UUID;
        };
        Update: never;
      };
      annotations: {
        Row: Annotation;
        Insert: Omit<Annotation, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Annotation, 'created_at' | 'updated_at'>>;
      };
      reading_progress: {
        Row: ReadingProgress;
        Insert: Omit<ReadingProgress, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ReadingProgress, 'created_at' | 'updated_at'>>;
      };
      rss_feeds: {
        Row: RSSFeed;
        Insert: Omit<RSSFeed, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RSSFeed, 'created_at' | 'updated_at'>>;
      };
      rss_items: {
        Row: RSSItem;
        Insert: Omit<RSSItem, 'created_at' | 'reviewed_at'>;
        Update: Partial<Omit<RSSItem, 'created_at' | 'reviewed_at'>>;
      };
      to_read: {
        Row: ToReadItem;
        Insert: Omit<ToReadItem, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ToReadItem, 'created_at' | 'updated_at'>>;
      };
      shadow_library_sources: {
        Row: ShadowLibrarySource;
        Insert: Omit<ShadowLibrarySource, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShadowLibrarySource, 'created_at' | 'updated_at'>>;
      };
      document_notes: {
        Row: DocumentNote;
        Insert: Omit<DocumentNote, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DocumentNote, 'created_at' | 'updated_at'>>;
      };
      sync_metadata: {
        Row: SyncMetadata;
        Insert: Omit<SyncMetadata, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SyncMetadata, 'created_at' | 'updated_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
