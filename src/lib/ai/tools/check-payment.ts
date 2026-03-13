import { tool } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { checkPaymentStatus } from '@/lib/billing/invoices'

export function checkPaymentTool(supabase: SupabaseClient, tenantId: string) {
  return tool({
    description: 'Check the payment status of an invoice.',
    inputSchema: z.object({
      invoiceNumber: z
        .string()
        .optional()
        .describe('Invoice number (e.g., INV-0001)'),
      clientName: z
        .string()
        .optional()
        .describe('Client name to find their latest invoice'),
    }),
    execute: async ({
      invoiceNumber,
      clientName,
    }: {
      invoiceNumber?: string
      clientName?: string
    }) => {
      let invoiceId: string | undefined

      if (invoiceNumber) {
        const { data } = await supabase
          .from('invoices')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('invoice_number', invoiceNumber)
          .single()
        invoiceId = data?.id
      } else if (clientName) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', tenantId)
          .ilike('name', `%${clientName}%`)
          .limit(1)

        if (clients?.[0]) {
          const { data } = await supabase
            .from('invoices')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('client_id', clients[0].id)
            .order('created_at', { ascending: false })
            .limit(1)
          invoiceId = data?.[0]?.id
        }
      }

      if (!invoiceId) {
        return { success: false, message: 'Invoice not found.' }
      }

      const result = await checkPaymentStatus(supabase, tenantId, invoiceId)
      return {
        success: true,
        status: result.status,
        amountPaid: result.amountPaid
          ? `$${(result.amountPaid / 100).toFixed(2)}`
          : undefined,
        paymentUrl: result.paymentUrl,
      }
    },
  })
}
