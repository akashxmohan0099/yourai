import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: (invoice as any).payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_invoice_id', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        // Keep as sent/overdue, log the failure
        console.error(`Payment failed for Stripe invoice ${invoice.id}`)
        break
      }

      case 'invoice.overdue': {
        const invoice = event.data.object
        await supabase
          .from('invoices')
          .update({
            status: 'overdue',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_invoice_id', invoice.id)
        break
      }

      default:
        // Unhandled event type
        break
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err)
    return new Response('Processing error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
