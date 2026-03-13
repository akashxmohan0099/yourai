import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ConversationsList } from '@/components/dashboard/conversations-list'
import { PageIntro } from '@/components/dashboard/page-intro'
import { MessageSquare, Radio } from 'lucide-react'

export default async function ConversationsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, clients(name, email, phone)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(100)

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Conversation stream"
        title="Every channel, one operating log."
        description="Track calls, texts, chats, and emails in a single feed with live updates and clear status states."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{conversations?.length || 0} threads loaded</p>
                <p className="text-xs text-[var(--ink-faint)]">Newest activity stays pinned to the top.</p>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] bg-white/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <Radio className="h-4 w-4 text-[var(--teal)]" />
                Live sync enabled for new messages and status changes
              </div>
            </div>
          </div>
        }
      />
      <ConversationsList conversations={conversations || []} tenantId={tenantId} />
    </div>
  )
}
