import { create } from 'zustand'
import { getSupabaseClient } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null

  // Actions
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => {
  const supabase = getSupabaseClient()

  // Initialize auth state on mount (only if credentials exist)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false
      })
    }).catch(() => {
      set({ loading: false })
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false
      })
    })
  } else {
    // No credentials - skip auth, not loading
    set({ loading: false })
  }

  return {
    user: null,
    session: null,
    loading: true,
    error: null,

    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        set({ user: data.user, session: data.session })
        return { success: true }
      } catch (error) {
        const authError = error as Error
        set({ error: authError.message })
        return { success: false, error: authError.message }
      }
    },

    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        set({ user: data.user, session: data.session })
        return { success: true }
      } catch (error) {
        const authError = error as Error
        set({ error: authError.message })
        return { success: false, error: authError.message }
      }
    },

    signOut: async () => {
      await supabase.auth.signOut()
      set({ user: null, session: null, error: null })
    },

    resetPassword: async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error

        return { success: true }
      } catch (error) {
        const authError = error as Error
        return { success: false, error: authError.message }
      }
    },

    refreshSession: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        set({ error: error.message })
        return
      }

      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false
      })
    },
  }
})
