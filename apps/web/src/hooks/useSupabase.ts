import {
  useQuery as useTanstackQuery,
  useMutation as useTanstackMutation,
} from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'

// Re-export for any consumers that import useQuery/useMutation directly
export { useTanstackQuery as useQuery, useTanstackMutation as useMutation }

// Document-specific hooks

export function useDocuments(userId?: string) {
  const supabase = getSupabaseClient()

  return useTanstackQuery({
    queryKey: ['documents', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useFolders(userId?: string) {
  const supabase = getSupabaseClient()

  return useTanstackQuery({
    queryKey: ['folders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId!)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useTags(userId?: string) {
  const supabase = getSupabaseClient()

  return useTanstackQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId!)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useCreateDocument() {
  const supabase = getSupabaseClient()

  return useTanstackMutation({
    mutationFn: async (document: {
      user_id: string
      title: string
      file_name: string
      file_type: string
      storage_path: string
      author?: string
      journal?: string
      doi?: string
      abstract?: string
    }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single()

      if (error) throw error
      return data
    },
  })
}

export function useCreateFolder() {
  const supabase = getSupabaseClient()

  return useTanstackMutation({
    mutationFn: async (folder: {
      user_id: string
      name: string
      parent_id?: string | null
      color?: string | null
    }) => {
      const { data, error } = await supabase
        .from('folders')
        .insert(folder)
        .select()
        .single()

      if (error) throw error
      return data
    },
  })
}

export function useUploadFile() {
  const supabase = getSupabaseClient()

  return useTanstackMutation({
    mutationFn: async ({
      file,
      path,
    }: {
      file: File
      userId: string
      path: string
    }) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) throw error
      return data
    },
  })
}
