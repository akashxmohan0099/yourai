import { tool } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { createQuote } from '@/lib/billing/quotes'

export function createQuoteTool(supabase: SupabaseClient, tenantId: string) {
  return tool({
    description:
      'Create a quote/estimate for a client. Use when someone asks for a price estimate or quote for services.',
    inputSchema: z.object({
      clientName: z.string().describe('Name of the client'),
      items: z
        .array(
          z.object({
            description: z.string(),
            quantity: z.number().default(1),
            unitPriceCents: z.number().describe('Price per unit in cents'),
          })
        )
        .describe('Line items for the quote'),
      validDays: z.number().optional().describe('Number of days quote is valid (default 30)'),
      notes: z.string().optional().describe('Additional notes'),
    }),
    execute: async ({
      clientName,
      items,
      validDays,
      notes,
    }: {
      clientName: string
      items: Array<{ description: string; quantity: number; unitPriceCents: number }>
      validDays?: number
      notes?: string
    }) => {
      // Find client
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${clientName}%`)
        .limit(1)

      const lineItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.quantity * item.unitPriceCents,
      }))

      // Get tax rate
      const { data: config } = await supabase
        .from('business_config')
        .select('default_tax_rate')
        .eq('tenant_id', tenantId)
        .single()

      const result = await createQuote(supabase, {
        tenantId,
        clientId: clients?.[0]?.id,
        lineItems,
        taxRate: config?.default_tax_rate || 0,
        validDays,
        notes,
      })

      if ('error' in result) {
        return { success: false, message: result.error }
      }

      const total = lineItems.reduce((sum, i) => sum + i.totalCents, 0)

      return {
        success: true,
        quoteNumber: result.quoteNumber,
        quoteId: result.id,
        total: `$${(total / 100).toFixed(2)}`,
        message: `Quote ${result.quoteNumber} created for ${clientName} — Total: $${(total / 100).toFixed(2)}`,
      }
    },
  })
}
