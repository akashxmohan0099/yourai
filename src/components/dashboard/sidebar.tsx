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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/owner-chat', icon: Bot },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Approvals', href: '/approvals', icon: ShieldCheck },
  { name: 'Briefings', href: '/briefings', icon: Newspaper },
  { name: 'Channels', href: '/channels', icon: Radio },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardSidebar({ tenantName, tenantSlug }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {tenantName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{tenantName}</p>
          <p className="text-xs text-gray-500">AI Assistant</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-gray-200">
        <Link
          href={`/chat/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
