'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarClock, MessageSquare, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Signup succeeded but no user was returned. Please try again.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName }),
      })

      if (!res.ok) {
        const body = await res.text()
        setError(`Failed to set up your account: ${body}`)
        setLoading(false)
        return
      }

      router.push('/onboarding')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
        <section className="panel flex rounded-[36px] px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="m-auto w-full max-w-md space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                  <Sparkles className="h-5 w-5 text-[var(--teal)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">YourAI</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-faint)]">
                    New workspace
                  </p>
                </div>
              </Link>
              <div>
                <p className="kicker">Start fresh</p>
                <h1 className="mt-3 text-4xl font-semibold text-[var(--ink)]">
                  Build a calmer front desk.
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  Set up the workspace, tell the AI how your business runs, then move into onboarding.
                </p>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {error ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label htmlFor="businessName" className="field-label">
                  Business name
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="field-input"
                  placeholder="Acme Dental Studio"
                />
              </div>

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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input"
                  placeholder="At least 8 characters"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating workspace...' : 'Create workspace'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="rounded-[28px] border border-[var(--line)] bg-white/45 px-5 py-4">
              <p className="text-sm leading-7 text-[var(--ink-soft)]">
                Already operating with YourAI?{' '}
                <Link href="/login" className="font-semibold text-[var(--accent)]">
                  Sign in here
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="panel-dark hidden rounded-[36px] px-8 py-8 lg:flex lg:flex-col lg:justify-between">
          <div className="max-w-xl space-y-5">
            <span className="eyebrow-stack border-white/10 bg-white/5 text-[#e6d7c8]">
              Setup path
            </span>
            <h2 className="text-5xl font-semibold leading-[0.98] text-[var(--sidebar-ink)]">
              Configure the assistant like an operations lead, not a prompt engineer.
            </h2>
            <p className="text-base leading-8 text-[#d8c9bb]">
              The onboarding flow captures your business shape, service rhythm, approval rules, and
              communication style before the AI starts handling customers.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.24)]">
                  <CalendarClock className="h-5 w-5 text-[#ffd9cb]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--sidebar-ink)]">Business setup</p>
                  <p className="text-xs text-[#cfbfaf]">Hours, services, channels, and constraints</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.24)]">
                  <MessageSquare className="h-5 w-5 text-[#b7efe7]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--sidebar-ink)]">Voice and tone</p>
                  <p className="text-xs text-[#cfbfaf]">Train the assistant to sound like your brand</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
