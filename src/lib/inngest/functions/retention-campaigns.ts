import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentSync } from '@/lib/ai/agent'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { type ModelMessage } from 'ai'

// Review request — X days after appointment completed
export const reviewRequestCampaign = inngest.createFunction(
  { id: 'review-request-campaign', name: 'Review Request Campaign' },
  { cron: '0 10 * * *' }, // Daily at 10am UTC
  async ({ step }) => {
    const supabase = createAdminClient()

    const campaigns = await step.run('find-campaigns', async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*, tenants!inner(id)')
        .eq('type', 'review_request')
        .eq('status', 'active')
      return data || []
    })

    let totalSent = 0

    for (const campaign of campaigns) {
      await step.run(`campaign-${campaign.id}`, async () => {
        const daysAfter = campaign.trigger_config?.days_after || 3
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - daysAfter)
        const targetDateStr = targetDate.toISOString().split('T')[0]

        // Find completed appointments from X days ago
        const { data: appointments } = await supabase
          .from('appointments')
          .select('client_id, clients(id, name, phone, email)')
          .eq('tenant_id', campaign.tenant_id)
          .eq('status', 'completed')
          .gte('ends_at', `${targetDateStr}T00:00:00`)
          .lte('ends_at', `${targetDateStr}T23:59:59`)

        if (!appointments || appointments.length === 0) return

        for (const apt of appointments) {
          const client = apt.clients as any
          if (!client?.phone && !client?.email) continue

          // Check if already sent
          const { data: existing } = await supabase
            .from('campaign_sends')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('client_id', client.id)
            .limit(1)

          if (existing && existing.length > 0) continue

          // Generate personalized message
          const context = await buildBusinessContext(supabase, campaign.tenant_id)
          const prompt = `Write a short, friendly review request message for ${client.name}. They recently visited ${context.businessName}. Keep it under 160 characters for SMS. Include a thank you.`

          const messages: ModelMessage[] = [{ role: 'user', content: prompt }]
          const messageText = await runAgentSync(messages, {
            tenantId: campaign.tenant_id,
            conversationId: 'campaign',
            mode: 'owner',
            context,
            supabase,
          })

          // Record send
          await supabase.from('campaign_sends').insert({
            campaign_id: campaign.id,
            tenant_id: campaign.tenant_id,
            client_id: client.id,
            channel: client.phone ? 'sms' : 'email',
            status: 'pending',
            content: messageText,
          })

          // TODO: Actually send via Twilio SMS or Nylas email
          totalSent++
        }

        // Update campaign stats
        const { count } = await supabase
          .from('campaign_sends')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        await supabase
          .from('campaigns')
          .update({
            stats: { ...campaign.stats, sent: count || 0 },
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaign.id)
      })
    }

    return { totalSent }
  }
)

// Rebooking nudge — client inactive for Y days
export const rebookingNudgeCampaign = inngest.createFunction(
  { id: 'rebooking-nudge-campaign', name: 'Rebooking Nudge Campaign' },
  { cron: '0 11 * * 1' }, // Weekly on Monday at 11am UTC
  async ({ step }) => {
    const supabase = createAdminClient()

    const campaigns = await step.run('find-campaigns', async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('type', 'rebooking')
        .eq('status', 'active')
      return data || []
    })

    let totalSent = 0

    for (const campaign of campaigns) {
      await step.run(`campaign-${campaign.id}`, async () => {
        const inactiveDays = campaign.trigger_config?.inactive_days || 30
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - inactiveDays)

        // Find inactive clients
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, phone, email, last_seen_at')
          .eq('tenant_id', campaign.tenant_id)
          .lt('last_seen_at', cutoff.toISOString())
          .not('phone', 'is', null)

        if (!clients || clients.length === 0) return

        for (const client of clients) {
          // Check if already sent recently
          const recentCutoff = new Date()
          recentCutoff.setDate(recentCutoff.getDate() - 14) // Don't re-nudge within 2 weeks

          const { data: existing } = await supabase
            .from('campaign_sends')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('client_id', client.id)
            .gte('created_at', recentCutoff.toISOString())
            .limit(1)

          if (existing && existing.length > 0) continue

          const context = await buildBusinessContext(supabase, campaign.tenant_id)
          const prompt = `Write a short, warm rebooking message for ${client.name} who hasn't visited ${context.businessName} in ${inactiveDays} days. Keep under 160 chars for SMS. Be friendly, not pushy.`

          const messages: ModelMessage[] = [{ role: 'user', content: prompt }]
          const messageText = await runAgentSync(messages, {
            tenantId: campaign.tenant_id,
            conversationId: 'campaign',
            mode: 'owner',
            context,
            supabase,
          })

          await supabase.from('campaign_sends').insert({
            campaign_id: campaign.id,
            tenant_id: campaign.tenant_id,
            client_id: client.id,
            channel: 'sms',
            status: 'pending',
            content: messageText,
          })

          totalSent++
        }
      })
    }

    return { totalSent }
  }
)

// Invoice reminder — overdue invoices
export const invoiceReminderCampaign = inngest.createFunction(
  { id: 'invoice-reminder', name: 'Invoice Reminder' },
  { cron: '0 9 * * *' }, // Daily at 9am UTC
  async ({ step }) => {
    const supabase = createAdminClient()

    const overdueInvoices = await step.run('find-overdue', async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('invoices')
        .select('*, clients(id, name, phone, email), tenants!inner(id, name)')
        .eq('status', 'sent')
        .lt('due_date', today)

      return data || []
    })

    let reminded = 0

    for (const invoice of overdueInvoices) {
      await step.run(`remind-${invoice.id}`, async () => {
        // Update status to overdue
        await supabase
          .from('invoices')
          .update({ status: 'overdue', updated_at: new Date().toISOString() })
          .eq('id', invoice.id)

        const client = invoice.clients as any
        if (!client?.phone && !client?.email) return

        // Generate reminder
        const context = await buildBusinessContext(supabase, invoice.tenant_id)
        const daysOverdue = Math.floor(
          (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        const amount = `$${(invoice.total_cents / 100).toFixed(2)}`

        const prompt = `Write a polite payment reminder for ${client.name}. Invoice ${invoice.invoice_number} for ${amount} is ${daysOverdue} days overdue. Keep professional and brief (under 160 chars for SMS).`

        const messages: ModelMessage[] = [{ role: 'user', content: prompt }]
        const messageText = await runAgentSync(messages, {
          tenantId: invoice.tenant_id,
          conversationId: 'reminder',
          mode: 'owner',
          context,
          supabase,
        })

        // Record the reminder (actual sending handled by Twilio/Nylas)
        await supabase.from('campaign_sends').insert({
          campaign_id: null,
          tenant_id: invoice.tenant_id,
          client_id: client.id,
          channel: client.phone ? 'sms' : 'email',
          status: 'pending',
          content: messageText,
        })

        reminded++
      })
    }

    return { reminded }
  }
)
