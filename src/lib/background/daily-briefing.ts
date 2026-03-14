import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentSync } from '@/lib/ai/agent'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { type ModelMessage } from 'ai'
import { deliverVoiceBriefing } from './voice-briefing'
import { sendSms } from '@/lib/twilio/client'
import { sendEmail } from '@/lib/nylas/client'

export async function generateDailyBriefings() {
  const supabase = createAdminClient()

  // Find all tenants with briefings enabled, then filter by their local hour
  const { data: configs } = await supabase
    .from('business_config')
    .select('tenant_id, business_name, timezone, briefing_channels, briefing_time')
    .eq('briefing_enabled', true)

  if (!configs || configs.length === 0) {
    return { briefingsGenerated: 0 }
  }

  let generated = 0

  for (const config of configs) {
    const tenantId = config.tenant_id
    const tz = config.timezone || 'Australia/Sydney'

    // Get the current hour in the business's timezone
    const now = new Date()
    const localHourStr = now.toLocaleString('en-AU', { timeZone: tz, hour: '2-digit', hour12: false }).padStart(2, '0') + ':00'

    // Only generate if it's the right hour in their timezone
    if (localHourStr !== (config.briefing_time || '08:00')) continue

    // Get today's date in the business timezone
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }) // en-CA gives YYYY-MM-DD

    // Check if briefing already generated today
    const { data: existing } = await supabase
      .from('briefings')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('briefing_date', todayStr)
      .limit(1)

    if (existing && existing.length > 0) continue

    // Gather data for briefing
    const yesterday = new Date(now)
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

    // Deliver via configured channels
    if (channels.includes('voice')) {
      await deliverVoiceBriefing(tenantId, briefingText).catch((err) =>
        console.error(`Voice briefing failed for ${tenantId}:`, err)
      )
    }

    if (channels.includes('sms')) {
      const { data: smsConfig } = await supabase
        .from('business_config')
        .select('owner_notification_phone')
        .eq('tenant_id', tenantId)
        .single()

      if (smsConfig?.owner_notification_phone) {
        await sendSms(
          smsConfig.owner_notification_phone,
          `☀️ ${config.business_name} Daily Briefing\n\n${briefingText}`
        ).catch((err) => console.error(`SMS briefing failed for ${tenantId}:`, err))
      }
    }

    if (channels.includes('email')) {
      const { data: emailConfig } = await supabase
        .from('business_config')
        .select('nylas_grant_id, email')
        .eq('tenant_id', tenantId)
        .single()

      if (emailConfig?.nylas_grant_id && emailConfig?.email) {
        await sendEmail(emailConfig.nylas_grant_id, {
          to: [{ email: emailConfig.email, name: config.business_name }],
          subject: `Daily Briefing — ${config.business_name} — ${todayStr}`,
          body: `<div style="font-family:sans-serif;max-width:600px">
<h2>Daily Briefing</h2>
<p style="white-space:pre-line">${briefingText}</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#888;font-size:13px">This briefing was generated by YourAI. View details on your <a href="${process.env.NEXT_PUBLIC_APP_URL}/briefings">dashboard</a>.</p>
</div>`,
        }).catch((err) => console.error(`Email briefing failed for ${tenantId}:`, err))
      }
    }

    generated++
  }

  return { briefingsGenerated: generated }
}
