import { createAdminClient } from '@/lib/supabase/admin'
import { processInboundEmail } from '@/lib/background/process-email'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('OK', { status: 200 })
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = createAdminClient()

    for (const delta of payload.deltas || [payload]) {
      if (delta.type === 'message.created') {
        const message = delta.data?.object || delta
        const grantId = delta.data?.grant_id || delta.grant_id

        // Find tenant by grant ID
        const { data: config } = await supabase
          .from('business_config')
          .select('tenant_id')
          .eq('nylas_grant_id', grantId)
          .single()

        if (!config) continue

        // Process email directly (fire and forget)
        processInboundEmail({
          tenantId: config.tenant_id,
          messageId: message.id,
          threadId: message.thread_id,
          from: message.from?.[0]?.email,
          fromName: message.from?.[0]?.name,
          subject: message.subject,
          body: message.body || message.snippet || '',
          grantId,
        }).catch(err => console.error('Email processing error:', err))
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Email webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}
