import { getTenantBySlug } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChatWidget } from '@/components/chat/chat-widget'
import { notFound } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{ slug: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const supabase = createAdminClient()
  const { data: config } = await supabase
    .from('business_config')
    .select('business_name')
    .eq('tenant_id', tenant.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-stone-50">
      <ChatWidget
        tenantId={tenant.id}
        businessName={config?.business_name || tenant.name}
        embedded
      />
    </div>
  )
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return {
    title: tenant ? `Chat with ${tenant.name}` : 'Chat',
  }
}
