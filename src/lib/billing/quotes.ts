import { SupabaseClient } from '@supabase/supabase-js'

export interface LineItem {
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export interface CreateQuoteInput {
  tenantId: string
  clientId?: string
  conversationId?: string
  lineItems: LineItem[]
  taxRate?: number
  validDays?: number
  notes?: string
}

export async function createQuote(
  supabase: SupabaseClient,
  input: CreateQuoteInput
): Promise<{ id: string; quoteNumber: string } | { error: string }> {
  // Generate quote number
  const { count } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', input.tenantId)

  const quoteNumber = `Q-${String((count || 0) + 1).padStart(4, '0')}`

  const subtotalCents = input.lineItems.reduce((sum, item) => sum + item.totalCents, 0)
  const taxRate = input.taxRate || 0
  const taxCents = Math.round(subtotalCents * (taxRate / 100))
  const totalCents = subtotalCents + taxCents

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + (input.validDays || 30))

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      tenant_id: input.tenantId,
      client_id: input.clientId || null,
      conversation_id: input.conversationId || null,
      quote_number: quoteNumber,
      line_items: input.lineItems,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      valid_until: validUntil.toISOString().split('T')[0],
      notes: input.notes || null,
    })
    .select('id, quote_number')
    .single()

  if (error) {
    return { error: `Failed to create quote: ${error.message}` }
  }

  return { id: data.id, quoteNumber: data.quote_number }
}

export async function updateQuoteStatus(
  supabase: SupabaseClient,
  tenantId: string,
  quoteId: string,
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
): Promise<{ success: boolean; error?: string }> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'sent') updates.sent_at = new Date().toISOString()
  if (status === 'accepted') updates.accepted_at = new Date().toISOString()

  const { error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', quoteId)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
