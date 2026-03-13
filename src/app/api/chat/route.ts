import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { runAgentStream } from '@/lib/ai/agent'
import { type ModelMessage, convertToModelMessages, createUIMessageStreamResponse } from 'ai'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { messages, tenantId, conversationId } = await request.json()

    if (!tenantId) {
      return new Response('Missing tenantId', { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify tenant exists and is active
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single()

    if (!tenant || tenant.status !== 'active') {
      return new Response('Business not found or inactive', { status: 404 })
    }

    // Build business context
    const context = await buildBusinessContext(supabase, tenantId)

    // Ensure conversation exists
    let convId = conversationId
    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          channel: 'web_chat',
          status: 'active',
        })
        .select('id')
        .single()
      convId = conv?.id
    }

    // Save user message
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      const content = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : lastMessage.content?.[0]?.text || ''
      await supabase.from('messages').insert({
        conversation_id: convId,
        tenant_id: tenantId,
        role: 'user',
        content,
      })
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages)

    // Run agent
    const result = await runAgentStream(
      modelMessages,
      {
        tenantId,
        conversationId: convId,
        mode: 'customer',
        context,
        supabase,
      }
    )

    // Save assistant response after stream completes (in background)
    Promise.resolve(result.text).then(async (text: string) => {
      if (text) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          tenant_id: tenantId,
          role: 'assistant',
          content: text,
        })
      }
    }).catch(console.error)

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
