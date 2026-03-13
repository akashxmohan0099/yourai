import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ApprovalQueue } from '@/components/dashboard/approval-queue'
import { PageIntro } from '@/components/dashboard/page-intro'
import { ShieldCheck } from 'lucide-react'

interface ApprovalSummary {
  status: string
}

export default async function ApprovalsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*, clients(name, phone), conversations(channel)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const approvalRows = (approvals || []) as ApprovalSummary[]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Approval gate"
        title="Keep the AI useful without giving it a free pass."
        description="Sensitive actions queue here with context, expiry windows, and clear decision controls."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {approvalRows.filter((approval) => approval.status === 'pending').length} pending
                </p>
                <p className="text-xs text-[var(--ink-faint)]">Resolved decisions stay below for auditability.</p>
              </div>
            </div>
          </div>
        }
      />
      <ApprovalQueue approvals={approvals || []} tenantId={tenantId} />
    </div>
  )
}
