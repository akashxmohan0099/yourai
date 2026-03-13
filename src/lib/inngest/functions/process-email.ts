import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { runAgentSync } from '@/lib/ai/agent'
import { type ModelMessage } from 'ai'
import { resolveClient } from '@/lib/clients/resolver'

export const processInboundEmail = inngest.createFunction(
  { id: 'process-inbound-email', name: 'Process Inbound Email' },
  { event: 'email/message.received' },
  async ({ event, step }) => {
    const {
      tenantId,
      messageId,
      threadId,
      from,
      fromName,
      subject,
      body,
      grantId,
    } = event.data

    const supabase = createAdminClient()

    // Resolve client
    const resolved = await step.run('resolve-client', async () => {
      const result = await resolveClient(supabase, {
        tenantId,
        channel: 'email',
        identifier: from,
        metadata: { name: fromName },
      })
      return { clientId: result.id }
    })
    const clientId = resolved.clientId

    // Find or create conversation
    const conversationId = await step.run('get-conversation', async () => {
      // Check for existing conversation by thread
      if (threadId) {
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('metadata->>threadId', threadId)
          .single()

        if (existing) return existing.id
      }

      // Create new conversation
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          channel: 'email',
          status: 'active',
          subject,
          metadata: { threadId },
        })
        .select('id')
        .single()

      return conv?.id
    })

    // Save inbound message
    await step.run('save-message', async () => {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        role: 'user',
        content: body,
        metadata: { subject, from, messageId },
      })
    })

    // Generate AI response
    const response = await step.run('generate-response', async () => {
      const context = await buildBusinessContext(supabase, tenantId)

      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: `Email from ${fromName || from} (${from}):\nSubject: ${subject}\n\n${body}`,
        },
      ]

      return runAgentSync(messages, {
        tenantId,
        conversationId,
        mode: 'customer',
        context,
        supabase,
      })
    })

    // Save response and send reply via Nylas
    await step.run('send-reply', async () => {
      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        role: 'assistant',
        content: response,
      })

      // Send reply via Nylas
      const { data: config } = await supabase
        .from('business_config')
        .select('nylas_grant_id, business_name')
        .eq('tenant_id', tenantId)
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
                to: [{ email: from, name: fromName }],
                subject: `Re: ${subject}`,
                body: response,
                reply_to_message_id: messageId,
              }),
            }
          )
        }
      }
    })

    return { conversationId, clientId, response: response.slice(0, 100) }
  }
)
