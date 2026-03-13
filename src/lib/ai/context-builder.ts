import { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessContext {
  businessName: string
  industry?: string
  description?: string
  tone: string
  customInstructions?: string
  phone?: string
  email?: string
  website?: string
  hours: Record<string, { open: string; close: string } | null>
  timezone: string
  services: Array<{
    name: string
    description?: string
    category?: string
    priceCents?: number
    priceType: string
    durationMinutes?: number
  }>
  faqs: Array<{ question: string; answer: string }>
  rules: Array<{
    ruleType: string
    category?: string
    rule: string
    toolScope: string[]
  }>
}

export async function buildBusinessContext(
  supabase: SupabaseClient,
  tenantId: string
): Promise<BusinessContext> {
  const [configResult, servicesResult, rulesResult] = await Promise.all([
    supabase
      .from('business_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('business_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
  ])

  const config = configResult.data
  const services = servicesResult.data || []
  const rules = rulesResult.data || []

  return {
    businessName: config?.business_name || 'Business',
    industry: config?.industry || undefined,
    description: config?.description || undefined,
    tone: config?.tone || 'friendly',
    customInstructions: config?.custom_instructions || undefined,
    phone: config?.phone || undefined,
    email: config?.email || undefined,
    website: config?.website || undefined,
    hours: config?.hours || {},
    timezone: config?.timezone || 'America/New_York',
    services: services.map((s: any) => ({
      name: s.name,
      description: s.description,
      category: s.category,
      priceCents: s.price_cents,
      priceType: s.price_type,
      durationMinutes: s.duration_minutes,
    })),
    faqs: config?.faqs || [],
    rules: rules.map((r: any) => ({
      ruleType: r.rule_type,
      category: r.category,
      rule: r.rule,
      toolScope: r.tool_scope || [],
    })),
  }
}

export function formatContextForPrompt(ctx: BusinessContext): string {
  const sections: string[] = []

  // Hours
  if (Object.keys(ctx.hours).length > 0) {
    const hoursLines = Object.entries(ctx.hours)
      .map(([day, hours]) => {
        if (!hours) return `  ${day}: Closed`
        return `  ${day}: ${hours.open} - ${hours.close}`
      })
      .join('\n')
    sections.push(`Business Hours:\n${hoursLines}`)
  }

  // Contact
  const contact: string[] = []
  if (ctx.phone) contact.push(`Phone: ${ctx.phone}`)
  if (ctx.email) contact.push(`Email: ${ctx.email}`)
  if (ctx.website) contact.push(`Website: ${ctx.website}`)
  if (contact.length > 0) sections.push(`Contact:\n  ${contact.join('\n  ')}`)

  // Services
  if (ctx.services.length > 0) {
    const serviceLines = ctx.services
      .map((s) => {
        let line = `  - ${s.name}`
        if (s.priceCents) {
          const price = (s.priceCents / 100).toFixed(2)
          const prefix = s.priceType === 'starting_at' ? 'from ' : ''
          const suffix = s.priceType === 'hourly' ? '/hr' : ''
          line += ` — ${prefix}$${price}${suffix}`
        } else if (s.priceType === 'quote') {
          line += ' — Contact for quote'
        }
        if (s.durationMinutes) line += ` (${s.durationMinutes} min)`
        if (s.description) line += `\n    ${s.description}`
        return line
      })
      .join('\n')
    sections.push(`Services:\n${serviceLines}`)
  }

  // FAQs
  if (ctx.faqs.length > 0) {
    const faqLines = ctx.faqs
      .map((f) => `  Q: ${f.question}\n  A: ${f.answer}`)
      .join('\n\n')
    sections.push(`Frequently Asked Questions:\n${faqLines}`)
  }

  return sections.join('\n\n')
}
