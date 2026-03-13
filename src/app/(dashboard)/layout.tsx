import type { ReactNode } from 'react'
import { requireTenant } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { tenant, profile } = await requireTenant()

  if (tenant.status === 'onboarding') {
    redirect('/onboarding')
  }

  return (
    <div className="dashboard-shell">
      <DashboardSidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      <div className="lg:pl-64">
        <DashboardHeader displayName={profile.display_name || 'User'} role={profile.role} />
        <main className="dashboard-main">
          <div className="mx-auto max-w-[110rem]">{children}</div>
        </main>
      </div>
    </div>
  )
}
