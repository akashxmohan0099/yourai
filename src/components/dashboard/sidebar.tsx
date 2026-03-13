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
      <div className="px-5 pt-6 pb-5">
        <p className="text-lg font-semibold text-[#1d1d1f] tracking-tight">YourAI</p>
        <p className="text-[13px] text-[#86868b] truncate mt-0.5">{tenantName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[11px] font-medium text-[#86868b] uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-100',
                      isActive
                        ? 'bg-[#f5f5f7] text-[#1d1d1f]'
                        : 'text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0',
                        isActive ? 'text-[#1d1d1f]' : 'text-[#86868b]'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-[#d2d2d7]">
        <Link
          href={`/chat/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#424245] transition-colors duration-100"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl border border-[#d2d2d7] shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#424245]" /> : <Menu className="w-5 h-5 text-[#424245]" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] bg-white border-r border-[#d2d2d7] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
