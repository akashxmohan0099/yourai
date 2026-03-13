'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

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
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-8 py-3">
      <div className="flex items-center justify-between">
        <div className="lg:hidden w-10" />
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-stone-900">{displayName}</p>
            <p className="text-sm text-stone-500 capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
