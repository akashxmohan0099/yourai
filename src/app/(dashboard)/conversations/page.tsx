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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
      <ConversationsList conversations={conversations || []} tenantId={tenantId} />
    </div>
  )
}
