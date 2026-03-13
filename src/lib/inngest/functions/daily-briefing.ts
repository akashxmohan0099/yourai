import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentSync } from '@/lib/ai/agent'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { type ModelMessage } from 'ai'

export const dailyBriefing = inngest.createFunction(
  { id: 'daily-briefing', name: 'Generate Daily Briefings' },
  { cron: '0 * * * *' }, // Every hour, checks which tenants need briefing at this hour
  async ({ step }) => {
    const supabase = createAdminClient()

    // Find tenants that need briefing at this hour
    const currentHour = new Date().getUTCHours()
    const currentHourStr = `${String(currentHour).padStart(2, '0')}:00`

    const configs = await step.run('find-tenants', async () => {
      const { data } = await supabase
        .from('business_config')
        .select('tenant_id, business_name, timezone, briefing_channels')
        .eq('briefing_enabled', true)
        .eq('briefing_time', currentHourStr)

      return data || []
    })

    if (configs.length === 0) {
      return { briefingsGenerated: 0 }
    }

    let generated = 0

    for (const config of configs) {
      await step.run(`briefing-${config.tenant_id}`, async () => {
        const tenantId = config.tenant_id
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // Check if briefing already generated today
        const { data: existing } = await supabase
          .from('briefings')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('briefing_date', todayStr)
          .limit(1)

        if (existing && existing.length > 0) return

        // Gather data for briefing
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const [appointments, conversations, pendingApprovals, newClients] =
          await Promise.all([
            // Today's appointments
            supabase
              .from('appointments')
              .select('*, clients(name), services(name)')
              .eq('tenant_id', tenantId)
              .neq('status', 'cancelled')
              .gte('starts_at', `${todayStr}T00:00:00`)
              .lte('starts_at', `${todayStr}T23:59:59`)
              .order('starts_at'),
            // Overnight conversations (last 24h)
            supabase
              .from('conversations')
              .select('id, channel, status, started_at, clients(name)')
              .eq('tenant_id', tenantId)
              .gte('created_at', yesterday.toISOString())
              .order('created_at', { ascending: false }),
            // Pending approvals
            supabase
              .from('approvals')
              .select('id, action_type, context_summary, created_at')
              .eq('tenant_id', tenantId)
              .eq('status', 'pending'),
            // New clients (last 24h)
            supabase
              .from('clients')
              .select('id, name, source_channel')
              .eq('tenant_id', tenantId)
              .gte('first_seen_at', yesterday.toISOString()),
          ])

        const briefingData = {
          date: todayStr,
          appointments: appointments.data || [],
          overnightConversations: conversations.data || [],
          pendingApprovals: pendingApprovals.data || [],
          newClients: newClients.data || [],
        }

        // Generate briefing with Claude
        const context = await buildBusinessContext(supabase, tenantId)

        const prompt = `Generate a concise daily briefing for the business owner. Here's the data:

Today's Date: ${todayStr}

Today's Appointments (${briefingData.appointments.length}):
${
  briefingData.appointments.length > 0
    ? briefingData.appointments
        .map(
          (a: any) =>
            `- ${new Date(a.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${a.title} (${a.clients?.name || 'No client'})`
        )
        .join('\n')
    : 'No appointments today.'
}

Overnight Activity (${briefingData.overnightConversations.length} conversations):
${
  briefingData.overnightConversations.length > 0
    ? briefingData.overnightConversations
        .map(
          (c: any) =>
            `- ${c.clients?.name || 'Anonymous'} via ${c.channel} (${c.status})`
        )
        .join('\n')
    : 'No new conversations.'
}

Pending Approvals (${briefingData.pendingApprovals.length}):
${
  briefingData.pendingApprovals.length > 0
    ? briefingData.pendingApprovals
        .map((a: any) => `- ${a.context_summary}`)
        .join('\n')
    : 'No pending approvals.'
}

New Leads (${briefingData.newClients.length}):
${
  briefingData.newClients.length > 0
    ? briefingData.newClients
        .map((c: any) => `- ${c.name} (via ${c.source_channel})`)
        .join('\n')
    : 'No new leads.'
}

Format as a brief, friendly morning update. Start with a greeting and include the key numbers. Be concise.`

        const messages: ModelMessage[] = [
          { role: 'user', content: prompt },
        ]

        const briefingText = await runAgentSync(messages, {
          tenantId,
          conversationId: 'briefing',
          mode: 'owner',
          context,
          supabase,
        })

        const channels = config.briefing_channels || ['email']

        // Save briefing
        await supabase.from('briefings').insert({
          tenant_id: tenantId,
          briefing_date: todayStr,
          content: {
            text: briefingText,
            data: briefingData,
          },
          delivered_via: channels,
        })

        // Deliver via voice if configured
        if (channels.includes('voice')) {
          await inngest.send({
            name: 'yourai/voice-briefing.requested',
            data: {
              tenantId,
              briefingText,
            },
          })
        }

        // TODO: Phase 3+ — deliver via Nylas email and/or Twilio SMS
        // For now, briefing is also stored and viewable on dashboard

        generated++
      })
    }

    return { briefingsGenerated: generated }
  }
)
