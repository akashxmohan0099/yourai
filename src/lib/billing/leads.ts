import { SupabaseClient } from '@supabase/supabase-js'

export async function captureLeadFromConversation(
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
  channel: string
): Promise<void> {
  // Check if lead already exists for this client
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .limit(1)

  if (existing && existing.length > 0) {
    // Update last contacted
    await supabase
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', existing[0].id)
    return
  }

  // Create new lead
  await supabase.from('leads').insert({
    tenant_id: tenantId,
    client_id: clientId,
    source_channel: channel,
    status: 'new',
    score: 0,
  })
}

export async function updateLeadScore(
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
  scoreAdjustment: number
): Promise<void> {
  const { data: lead } = await supabase
    .from('leads')
    .select('id, score')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .single()

  if (!lead) return

  await supabase
    .from('leads')
    .update({
      score: Math.max(0, (lead.score || 0) + scoreAdjustment),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
}

export async function updateLeadStatus(
  supabase: SupabaseClient,
  tenantId: string,
  leadId: string,
  status: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('tenant_id', tenantId)

  return { success: !error }
}
