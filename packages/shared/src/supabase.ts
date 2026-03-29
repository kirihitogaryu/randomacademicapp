import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@database/schema'

// These should be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

let supabase: SupabaseClient<Database> | null = null

export function createSupabaseClient() {
  if (supabase) {
    return supabase
  }

  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return supabase
}

export function getSupabaseClient() {
  if (!supabase) {
    return createSupabaseClient()
  }
  return supabase
}

export { type Database }
