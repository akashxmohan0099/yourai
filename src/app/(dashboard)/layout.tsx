import { requireTenant } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenant, profile } = await requireTenant()

  if (tenant.status === 'onboarding') {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      <div className="lg:pl-64">
        <DashboardHeader displayName={profile.display_name || 'User'} role={profile.role} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
