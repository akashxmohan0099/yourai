'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'

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
    <div className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)]">
        <section className="panel-dark hidden rounded-[36px] px-8 py-8 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5 text-[#ffe6d8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--sidebar-ink)]">YourAI</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#cfbfaf]">Operator access</p>
            </div>
          </div>

          <div className="max-w-xl space-y-6">
            <span className="eyebrow-stack border-white/10 bg-white/5 text-[#e6d7c8]">
              Existing workspace
            </span>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-[0.98] text-[var(--sidebar-ink)]">
                Step back into the control room.
              </h1>
              <p className="max-w-lg text-base leading-8 text-[#d8c9bb]">
                Pick up conversations, review bookings, and handle approvals without digging through
                a pile of disconnected tools.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="h-5 w-5 text-[#b7efe7]" />
              <p className="mt-4 text-lg font-semibold text-[var(--sidebar-ink)]">Security-first</p>
              <p className="mt-2 text-sm leading-7 text-[#cfbfaf]">
                Approvals, channels, and audit trails stay in one accountable surface.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <KeyRound className="h-5 w-5 text-[#ffd9cb]" />
              <p className="mt-4 text-lg font-semibold text-[var(--sidebar-ink)]">Operator speed</p>
              <p className="mt-2 text-sm leading-7 text-[#cfbfaf]">
                Landing back in the workspace should feel like entering a cockpit, not a settings page.
              </p>
            </div>
          </div>
        </section>

        <section className="panel flex rounded-[36px] px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="m-auto w-full max-w-md space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                  <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">YourAI</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-faint)]">
                    Sign in
                  </p>
                </div>
              </Link>
              <div>
                <p className="kicker">Welcome back</p>
                <h1 className="mt-3 text-4xl font-semibold text-[var(--ink)]">Run today from one screen.</h1>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  Sign in to review today&apos;s work, manage approvals, and keep every customer thread in context.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                  placeholder="you@business.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input"
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Enter workspace'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="rounded-[28px] border border-[var(--line)] bg-white/45 px-5 py-4">
              <p className="text-sm leading-7 text-[var(--ink-soft)]">
                New here?{' '}
                <Link href="/signup" className="font-semibold text-[var(--accent)]">
                  Create a workspace
                </Link>{' '}
                and step through setup in a few minutes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
