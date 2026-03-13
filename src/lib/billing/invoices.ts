import { SupabaseClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe/client'

export interface CreateInvoiceInput {
  tenantId: string
  clientId?: string
  quoteId?: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPriceCents: number
    totalCents: number
  }>
  taxRate?: number
  dueDays?: number
  notes?: string
  clientEmail?: string
}

export async function createInvoice(
  supabase: SupabaseClient,
  input: CreateInvoiceInput
): Promise<{ id: string; invoiceNumber: string; stripeInvoiceId?: string } | { error: string }> {
  // Generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', input.tenantId)

  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

  const subtotalCents = input.lineItems.reduce((sum, item) => sum + item.totalCents, 0)
  const taxRate = input.taxRate || 0
  const taxCents = Math.round(subtotalCents * (taxRate / 100))
  const totalCents = subtotalCents + taxCents

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (input.dueDays || 30))

  // Create Stripe invoice if configured
  let stripeInvoiceId: string | undefined

  try {
    const stripe = getStripe()

    // Find or create Stripe customer
    let stripeCustomerId: string | undefined
    if (input.clientEmail) {
      const customers = await stripe.customers.list({
        email: input.clientEmail,
        limit: 1,
      })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: input.clientEmail,
          metadata: {
            tenant_id: input.tenantId,
            client_id: input.clientId || '',
          },
        })
        stripeCustomerId = customer.id
      }

      // Create Stripe invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: 'send_invoice',
        days_until_due: input.dueDays || 30,
        metadata: {
          tenant_id: input.tenantId,
          invoice_number: invoiceNumber,
        },
      })

      // Add line items
      for (const item of input.lineItems) {
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: stripeInvoice.id,
          description: item.description,
          amount: item.totalCents,
          currency: 'usd',
        })
      }

      stripeInvoiceId = stripeInvoice.id
    }
  } catch (err) {
    console.error('Stripe invoice creation failed (continuing without):', err)
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: input.tenantId,
      client_id: input.clientId || null,
      quote_id: input.quoteId || null,
      invoice_number: invoiceNumber,
      line_items: input.lineItems,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      due_date: dueDate.toISOString().split('T')[0],
      stripe_invoice_id: stripeInvoiceId || null,
      notes: input.notes || null,
    })
    .select('id, invoice_number')
    .single()

  if (error) {
    return { error: `Failed to create invoice: ${error.message}` }
  }

  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    stripeInvoiceId,
  }
}

export async function sendInvoice(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (!invoice) return { success: false, error: 'Invoice not found' }

  let paymentUrl: string | undefined

  // Send via Stripe if configured
  if (invoice.stripe_invoice_id) {
    try {
      const stripe = getStripe()
      const sent = await stripe.invoices.sendInvoice(invoice.stripe_invoice_id)
      paymentUrl = sent.hosted_invoice_url || undefined
    } catch (err) {
      console.error('Failed to send Stripe invoice:', err)
    }
  }

  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)

  return { success: true, paymentUrl }
}

export async function checkPaymentStatus(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string
): Promise<{ status: string; amountPaid?: number; paymentUrl?: string }> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (!invoice) return { status: 'not_found' }

  if (invoice.stripe_invoice_id) {
    try {
      const stripe = getStripe()
      const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id)
      return {
        status: stripeInvoice.status || invoice.status,
        amountPaid: stripeInvoice.amount_paid,
        paymentUrl: stripeInvoice.hosted_invoice_url || undefined,
      }
    } catch {
      // Fall through to local status
    }
  }

  return { status: invoice.status }
}
