import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { runAgentSync } from '@/lib/ai/agent'
import { type ModelMessage } from 'ai'
import { resolveClient } from '@/lib/clients/resolver'

export async function processInboundEmail(data: {
  tenantId: string
  messageId: string
  threadId?: string
  from: string
  fromName?: string
  subject: string
  body: string
  grantId: string
}) {
  const supabase = createAdminClient()

  // Resolve client
  const client = await resolveClient(supabase, {
    tenantId: data.tenantId,
    channel: 'email',
    identifier: data.from,
    metadata: { name: data.fromName },
  })
  const clientId = client.id

  // Find or create conversation
  let conversationId: string | undefined

  if (data.threadId) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('metadata->>threadId', data.threadId)
      .single()

    if (existing) conversationId = existing.id
  }

  if (!conversationId) {
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        tenant_id: data.tenantId,
        client_id: clientId,
        channel: 'email',
        status: 'active',
        subject: data.subject,
        metadata: { threadId: data.threadId },
      })
      .select('id')
      .single()

    conversationId = conv?.id
  }

  // Save inbound message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    tenant_id: data.tenantId,
    role: 'user',
    content: data.body,
    metadata: { subject: data.subject, from: data.from, messageId: data.messageId },
  })

  // Generate AI response
  const context = await buildBusinessContext(supabase, data.tenantId)

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: `Email from ${data.fromName || data.from} (${data.from}):\nSubject: ${data.subject}\n\n${data.body}`,
    },
  ]

  const response = await runAgentSync(messages, {
    tenantId: data.tenantId,
    conversationId: conversationId!,
    mode: 'customer',
    context,
    supabase,
  })

  // Save response and send reply via Nylas
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    tenant_id: data.tenantId,
    role: 'assistant',
    content: response,
  })

  // Send reply via Nylas
  const { data: config } = await supabase
    .from('business_config')
    .select('nylas_grant_id, business_name')
    .eq('tenant_id', data.tenantId)
    .single()

  if (config?.nylas_grant_id) {
    const apiKey = process.env.NYLAS_API_KEY
    if (apiKey) {
      await fetch(
        `https://api.us.nylas.com/v3/grants/${config.nylas_grant_id}/messages/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email: data.from, name: data.fromName }],
            subject: `Re: ${data.subject}`,
            body: response,
            reply_to_message_id: data.messageId,
          }),
        }
      )
    }
  }

  return { conversationId, clientId, response: response.slice(0, 100) }
}
