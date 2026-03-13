'use client'

import { cn } from '@/lib/utils'
import {
  Bot,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  Newspaper,
  Radio,
  Receipt,
  Settings,
  ShieldCheck,
  Target,
  Users,
  X,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  tenantName: string
  tenantSlug: string
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'My Business', href: '/my-business', icon: Building2 },
      { name: 'Conversations', href: '/conversations', icon: MessageSquare },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Leads', href: '/leads', icon: Target },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { name: 'Quotes', href: '/quotes', icon: FileText },
      { name: 'Invoices', href: '/invoices', icon: Receipt },
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'Automation',
    items: [
      { name: 'AI Assistant', href: '/owner-chat', icon: Bot },
      { name: 'Briefings', href: '/briefings', icon: Newspaper },
    ],
  },
  {
    label: 'System',
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
      <div className="px-4 pb-5 pt-4">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
              <Bot className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">YourAI</p>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                {tenantName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-faint)]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-[22px] px-3 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[rgba(43,114,107,0.1)] text-[var(--ink)]'
                        : 'text-[var(--ink-soft)] hover:bg-[rgba(43,114,107,0.06)] hover:text-[var(--ink)]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors',
                        isActive
                          ? 'border-[rgba(43,114,107,0.15)] bg-[rgba(43,114,107,0.08)]'
                          : 'border-transparent bg-white/50 group-hover:border-[var(--line)] group-hover:bg-white/70'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px]',
                          isActive ? 'text-[var(--teal)]' : 'text-[var(--ink-faint)]'
                        )}
                      />
                    </span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 pb-4">
        <Link
          href={`/chat/${tenantSlug}`}
          target="_blank"
          className="block rounded-[28px] border border-[var(--line)] bg-white/50 p-4 text-[var(--ink-soft)] transition hover:bg-white/70 hover:text-[var(--ink)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Public widget</p>
              <p className="mt-1 text-xs leading-6 text-[var(--ink-faint)]">
                Preview the customer-facing chat and voice entry point.
              </p>
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4" />
          </div>
        </Link>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen((current) => !current)}
        className="panel fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5 text-[var(--ink)]" /> : <Menu className="h-5 w-5 text-[var(--ink)]" />}
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-[rgba(28,22,18,0.35)] backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'panel-dark fixed inset-y-3 left-3 z-40 flex w-[248px] flex-col rounded-[34px] transition-transform duration-200 ease-out lg:inset-y-4 lg:left-4 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
