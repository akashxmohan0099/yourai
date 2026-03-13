'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ShieldCheck,
  Radio,
  Settings,
  ExternalLink,
  Menu,
  X,
  Calendar,
  Bot,
  Newspaper,
  FileText,
  Receipt,
  Target,
  Megaphone,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  tenantName: string
  tenantSlug: string
}

const navSections = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Conversations', href: '/conversations', icon: MessageSquare },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
    ],
  },
  {
    label: 'CUSTOMERS',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Leads', href: '/leads', icon: Target },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { name: 'Quotes', href: '/quotes', icon: FileText },
      { name: 'Invoices', href: '/invoices', icon: Receipt },
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'AI Assistant', href: '/owner-chat', icon: Bot },
      { name: 'Briefings', href: '/briefings', icon: Newspaper },
    ],
  },
  {
    label: 'CONFIG',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Channels', href: '/channels', icon: Radio },
      { name: 'Approvals', href: '/approvals', icon: ShieldCheck },
    ],
  },
]

export function DashboardSidebar({ tenantName, tenantSlug }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-violet-700 tracking-tight">YourAI</p>
          <p className="text-sm text-stone-400 truncate leading-none">{tenantName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600'
                        : 'text-stone-600 hover:bg-violet-50 hover:text-stone-800 active:bg-violet-100'
                    )}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-violet-600' : 'text-stone-400')} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-stone-200">
        <Link
          href={`/chat/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:bg-violet-50 hover:text-violet-700 transition-all duration-150"
        >
          <ExternalLink className="w-5 h-5" />
          Preview chat widget
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-stone-200"
      >
        {mobileOpen ? <X className="w-5 h-5 text-stone-700" /> : <Menu className="w-5 h-5 text-stone-700" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
