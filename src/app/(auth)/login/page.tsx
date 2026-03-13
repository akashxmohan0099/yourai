'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
            YourAI
          </span>
          <h1 className="mt-6 text-xl font-semibold text-[#1d1d1f]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[#86868b]">
            Sign in to your account.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-[#d2d2d7] px-3 py-2 text-sm text-[#1d1d1f] focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC] placeholder:text-[#86868b]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-[#d2d2d7] px-3 py-2 text-sm text-[#1d1d1f] focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC] placeholder:text-[#86868b]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium text-white bg-[#1d1d1f] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#86868b]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#0066CC] hover:text-[#0055AA] font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
