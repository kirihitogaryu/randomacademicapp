import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase'

interface UseQueryOptions<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  enabled?: boolean
}

interface UseQueryResult<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
}: UseQueryOptions<T>): UseQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await queryFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'))
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, enabled])

  useEffect(() => {
    fetchData()
  }, [...queryKey, enabled])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

interface UseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  isPending: boolean
  error: Error | null
}

export function useMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
}: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    setIsPending(true)
    setError(null)
    
    try {
      const result = await mutationFn(variables)
      onSuccess?.(result)
      return result
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Mutation failed')
      setError(errObj)
      onError?.(errObj)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [mutationFn, onSuccess, onError])

  return {
    mutate,
    isPending,
    error,
  }
}

// Document-specific hooks
export function useDocuments(userId?: string) {
  const supabase = getSupabaseClient()
  
  return useQuery({
    queryKey: ['documents', userId || 'anonymous'],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useFolders(userId?: string) {
  const supabase = getSupabaseClient()
  
  return useQuery({
    queryKey: ['folders', userId || 'anonymous'],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useTags(userId?: string) {
  const supabase = getSupabaseClient()
  
  return useQuery({
    queryKey: ['tags', userId || 'anonymous'],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useCreateDocument() {
  const supabase = getSupabaseClient()
  
  return useMutation({
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
  
  return useMutation({
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

  return useMutation({
    mutationFn: async ({
      file,
      userId,
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
          upsert: true, // Allow overwriting existing files
        })

      if (error) throw error
      return data
    },
  })
}
