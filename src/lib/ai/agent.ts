import { streamText, generateText, ModelMessage, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { buildSystemPrompt } from './prompts/system'
import { BusinessContext, ClientContext, formatContextForPrompt, formatClientContextForPrompt } from './context-builder'
import { getCustomerTools, getOwnerTools } from './tools'
import { SupabaseClient } from '@supabase/supabase-js'

export interface AgentConfig {
  tenantId: string
  conversationId: string
  mode: 'customer' | 'owner'
  context: BusinessContext
  supabase: SupabaseClient
  clientId?: string
  clientContext?: ClientContext | null
}

export async function runAgentStream(
  messages: ModelMessage[],
  config: AgentConfig
) {
  const systemPrompt = buildSystemPrompt({
    businessName: config.context.businessName,
    industry: config.context.industry,
    description: config.context.description,
    tone: config.context.tone,
    customInstructions: config.context.customInstructions,
    mode: config.mode,
  })

  const contextBlock = formatContextForPrompt(config.context)

  let clientBlock = ''
  if (config.clientContext) {
    clientBlock = `\n\n--- Customer Context ---\n${formatClientContextForPrompt(config.clientContext)}`
  }

  const tools =
    config.mode === 'owner'
      ? getOwnerTools(config.context, config.supabase, config.tenantId, config.conversationId)
      : getCustomerTools(config.context, config.supabase, config.tenantId, config.conversationId, config.clientId)

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `${systemPrompt}\n\n--- Business Information ---\n${contextBlock}${clientBlock}`,
    messages,
    tools,
    stopWhen: stepCountIs(5),
    onStepFinish: async (step) => {
      // Permission gate is enforced inside each tool's execute wrapper (tools/index.ts).
      // This callback only logs tool calls for audit purposes.
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const toolCall of step.toolCalls) {
          await logAuditEvent(config.supabase, {
            tenantId: config.tenantId,
            conversationId: config.conversationId,
            eventType: 'tool_call',
            toolName: toolCall.toolName,
            toolInput: (toolCall as any).input,
            modelUsed: 'claude-sonnet-4-20250514',
          })
        }
      }
    },
  })

  return result
}

export async function runAgentSync(
  messages: ModelMessage[],
  config: AgentConfig
): Promise<string> {
  const systemPrompt = buildSystemPrompt({
    businessName: config.context.businessName,
    industry: config.context.industry,
    description: config.context.description,
    tone: config.context.tone,
    customInstructions: config.context.customInstructions,
    mode: config.mode,
  })

  const contextBlock = formatContextForPrompt(config.context)

  let clientBlock = ''
  if (config.clientContext) {
    clientBlock = `\n\n--- Customer Context ---\n${formatClientContextForPrompt(config.clientContext)}`
  }

  const tools =
    config.mode === 'owner'
      ? getOwnerTools(config.context, config.supabase, config.tenantId, config.conversationId)
      : getCustomerTools(config.context, config.supabase, config.tenantId, config.conversationId, config.clientId)

  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `${systemPrompt}\n\n--- Business Information ---\n${contextBlock}${clientBlock}`,
    messages,
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.text
}

async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    tenantId: string
    conversationId: string
    eventType: string
    toolName?: string
    toolInput?: unknown
    toolOutput?: unknown
    permissionResult?: string
    modelUsed?: string
    tokensIn?: number
    tokensOut?: number
    latencyMs?: number
    error?: string
  }
) {
  try {
    await supabase.from('ai_audit_log').insert({
      tenant_id: event.tenantId,
      conversation_id: event.conversationId,
      event_type: event.eventType,
      tool_name: event.toolName,
      tool_input: event.toolInput,
      tool_output: event.toolOutput,
      permission_result: event.permissionResult,
      model_used: event.modelUsed,
      tokens_in: event.tokensIn,
      tokens_out: event.tokensOut,
      latency_ms: event.latencyMs,
      error: event.error,
    })
  } catch (err) {
    console.error('Failed to log audit event:', err)
  }
}
