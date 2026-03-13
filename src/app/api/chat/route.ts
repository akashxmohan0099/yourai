import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext, buildClientContext } from '@/lib/ai/context-builder'
import { runAgentStream } from '@/lib/ai/agent'
import { type ModelMessage, convertToModelMessages } from 'ai'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { messages, tenantSlug, conversationId } = await request.json()

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return new Response('Missing tenantSlug', { status: 400 })
    }

    const supabase = createAdminClient()

    // Resolve tenant from slug — never trust a raw UUID from the client
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('slug', tenantSlug)
      .eq('status', 'active')
      .single()

    if (!tenant) {
      return new Response('Business not found or inactive', { status: 404 })
    }

    const tenantId = tenant.id

    // Build business context
    const context = await buildBusinessContext(supabase, tenantId)

    // Ensure conversation exists
    let convId = conversationId
    if (convId) {
      // Verify the conversation belongs to this tenant (prevent cross-tenant injection)
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('tenant_id', tenantId)
        .single()

      if (!existingConv) {
        convId = null // Invalid conversation ID, create a new one
      }
    }

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

    // Resolve or create client for this conversation
    let clientId: string | undefined
    let clientContext = null

    // Check if conversation already has a client
    if (convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('client_id')
        .eq('id', convId)
        .single()

      clientId = conv?.client_id || undefined
    }

    // Build client context if we have a client
    if (clientId) {
      clientContext = await buildClientContext(supabase, tenantId, clientId)
    }

    // Save user message
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      let content = ''
      if (typeof lastMessage.content === 'string') {
        content = lastMessage.content
      } else if (lastMessage.parts) {
        content = lastMessage.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('')
      } else if (Array.isArray(lastMessage.content)) {
        content = lastMessage.content?.[0]?.text || ''
      }
      await supabase.from('messages').insert({
        conversation_id: convId,
        tenant_id: tenantId,
        role: 'user',
        content,
      })
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages)

    // Public web chat is read-only: do not expose booking or approval write tools.
    const result = await runAgentStream(
      modelMessages,
      {
        tenantId,
        conversationId: convId,
        mode: 'customer',
        context,
        supabase,
        clientId,
        clientContext,
        allowCustomerWriteTools: false,
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
