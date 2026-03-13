import { tool } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { createInvoice } from '@/lib/billing/invoices'

export function createInvoiceTool(supabase: SupabaseClient, tenantId: string) {
  return tool({
    description:
      'Create an invoice for a client. Use when the owner wants to bill a client for services rendered.',
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
        .describe('Line items for the invoice'),
      dueDays: z.number().optional().describe('Days until due (default 30)'),
      notes: z.string().optional().describe('Additional notes'),
    }),
    execute: async ({
      clientName,
      items,
      dueDays,
      notes,
    }: {
      clientName: string
      items: Array<{ description: string; quantity: number; unitPriceCents: number }>
      dueDays?: number
      notes?: string
    }) => {
      // Find client
      const { data: clients } = await supabase
        .from('clients')
        .select('id, email')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${clientName}%`)
        .limit(1)

      const client = clients?.[0]
      const lineItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.quantity * item.unitPriceCents,
      }))

      const { data: config } = await supabase
        .from('business_config')
        .select('default_tax_rate')
        .eq('tenant_id', tenantId)
        .single()

      const result = await createInvoice(supabase, {
        tenantId,
        clientId: client?.id,
        lineItems,
        taxRate: config?.default_tax_rate || 0,
        dueDays,
        notes,
        clientEmail: client?.email,
      })

      if ('error' in result) {
        return { success: false, message: result.error }
      }

      const total = lineItems.reduce((sum, i) => sum + i.totalCents, 0)

      return {
        success: true,
        invoiceNumber: result.invoiceNumber,
        invoiceId: result.id,
        stripeInvoiceId: result.stripeInvoiceId,
        total: `$${(total / 100).toFixed(2)}`,
        message: `Invoice ${result.invoiceNumber} created for ${clientName} — Total: $${(total / 100).toFixed(2)}${result.stripeInvoiceId ? ' (Stripe invoice created)' : ''}`,
      }
    },
  })
}
