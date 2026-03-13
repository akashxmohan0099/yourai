import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ConversationDetail } from '@/components/dashboard/conversation-detail'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, clients(name, email, phone)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!conversation) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <ConversationDetail
        conversation={conversation}
        initialMessages={messages || []}
        tenantId={tenantId}
      />
    </div>
  )
}
