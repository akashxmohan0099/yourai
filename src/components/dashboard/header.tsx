'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  displayName: string
  role: string
}

export function DashboardHeader({ displayName, role }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:pl-[17.5rem] lg:pr-7">
      <div className="panel flex items-center justify-between rounded-[30px] px-4 py-3 sm:px-5">
        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
            <ShieldCheck className="h-5 w-5 text-[var(--teal)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)]">Operational workspace</p>
            <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Conversations, approvals, revenue, and service flow
            </p>
          </div>
        </div>

        <div className="lg:hidden w-12" />

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--ink)]">{displayName}</p>
            <span className="status-pill mt-1 capitalize">{role}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-secondary h-11 w-11 rounded-2xl px-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
