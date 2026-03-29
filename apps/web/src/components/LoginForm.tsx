import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp, loading, error } = useAuthStore()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccess(false)

    if (!email || !password) {
      setFormError('Please fill in all fields')
      return
    }

    const result = isSignUp 
      ? await signUp(email, password) 
      : await signIn(email, password)

    if (result.success) {
      setSuccess(true)
      if (!isSignUp) {
        // Clear form on successful login
        setEmail('')
        setPassword('')
      }
    } else {
      setFormError(result.error || 'An error occurred')
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-display text-foreground-primary mb-6">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-foreground-secondary mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-background-tertiary border border-white/10 rounded-md text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-foreground-secondary mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-background-tertiary border border-white/10 rounded-md text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        {(formError || error) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
            {formError || error?.message}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-sm">
            {isSignUp 
              ? 'Account created! Please check your email to confirm.' 
              : 'Welcome back!'}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setFormError(null)
            setSuccess(false)
          }}
          className="text-sm text-foreground-secondary hover:text-foreground-primary transition-colors"
        >
          {isSignUp 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}
