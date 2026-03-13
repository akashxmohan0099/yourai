import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ApprovalQueue } from '@/components/dashboard/approval-queue'

export default async function ApprovalsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*, clients(name, phone), conversations(channel)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Approvals</h1>
        <p className="text-[#86868b]">Review and approve actions your AI wants to take</p>
      </div>
      <ApprovalQueue approvals={approvals || []} tenantId={tenantId} />
    </div>
  )
}
