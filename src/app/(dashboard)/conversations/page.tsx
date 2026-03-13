import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ConversationsList } from '@/components/dashboard/conversations-list'

export default async function ConversationsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, clients(name, email, phone)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Conversations</h1>
          <p className="text-[#86868b] text-base">All your customer interactions in one place</p>
        </div>
        <ConversationsList conversations={conversations || []} tenantId={tenantId} />
      </div>
    </div>
  )
}
