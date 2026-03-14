import { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessContext {
  businessName: string
  industry?: string
  description?: string
  tone: string
  customInstructions?: string
  conversationStyle?: string
  examplePhrases?: string
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
    conversationStyle: config?.conversation_style || undefined,
    examplePhrases: config?.example_phrases || undefined,
    phone: config?.phone || undefined,
    email: config?.email || undefined,
    website: config?.website || undefined,
    hours: config?.hours || {},
    timezone: config?.timezone || 'Australia/Sydney',
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

export interface ClientContext {
  clientId: string
  name: string | null
  phone: string | null
  email: string | null
  firstSeen: string | null
  lastSeen: string | null
  sourceChannel: string | null
  isNew: boolean
  totalConversations: number
  recentConversations: Array<{
    channel: string
    status: string
    date: string
    messageCount?: number
  }>
  recentMessages: Array<{
    role: string
    content: string
    channel: string
    date: string
  }>
  appointments: {
    upcoming: Array<{
      serviceName: string
      date: string
      time: string
      status: string
    }>
    past: Array<{
      serviceName: string
      date: string
      time: string
      status: string
    }>
  }
  quotes: Array<{
    quoteNumber: string
    totalCents: number
    status: string
    date: string
  }>
  invoices: Array<{
    invoiceNumber: string
    totalCents: number
    status: string
    dueDate: string | null
  }>
  notes: Array<{
    note: string
    date: string
    source: string
  }>
  tags: string[]
}

export async function buildClientContext(
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string
): Promise<ClientContext | null> {
  // Load client record
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .single()

  if (!client) return null

  // Load all related data in parallel
  const [
    conversationsResult,
    appointmentsResult,
    quotesResult,
    invoicesResult,
    notesResult,
    tagsResult,
  ] = await Promise.all([
    // Recent conversations with message preview
    supabase
      .from('conversations')
      .select('id, channel, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),

    // All appointments (upcoming + recent past)
    supabase
      .from('appointments')
      .select('*, services(name)')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('starts_at', { ascending: false })
      .limit(20),

    // Quotes
    supabase
      .from('quotes')
      .select('quote_number, total_cents, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Invoices
    supabase
      .from('invoices')
      .select('invoice_number, total_cents, status, due_date')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Notes
    supabase
      .from('client_notes')
      .select('note, created_at, source')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Tags
    supabase
      .from('client_tags')
      .select('tag')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId),
  ])

  const conversations = conversationsResult.data || []
  const appointments = appointmentsResult.data || []
  const quotes = quotesResult.data || []
  const invoices = invoicesResult.data || []
  const notes = notesResult.data || []
  const tags = tagsResult.data || []

  // Load recent messages across conversations
  const conversationIds = conversations.slice(0, 5).map((c: any) => c.id)
  let recentMessages: any[] = []
  if (conversationIds.length > 0) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content, created_at, metadata')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(20)

    recentMessages = msgs || []
  }

  const now = new Date()

  return {
    clientId,
    name: client.name,
    phone: client.phone,
    email: client.email,
    firstSeen: client.first_seen_at,
    lastSeen: client.last_seen_at,
    sourceChannel: client.source_channel,
    isNew: !client.first_seen_at || (now.getTime() - new Date(client.first_seen_at).getTime()) < 86400000,
    totalConversations: conversations.length,
    recentConversations: conversations.map((c: any) => ({
      channel: c.channel,
      status: c.status,
      date: c.created_at,
    })),
    recentMessages: recentMessages.reverse().map((m: any) => ({
      role: m.role,
      content: m.content?.slice(0, 200) || '',
      channel: m.metadata?.channel || 'web_chat',
      date: m.created_at,
    })),
    appointments: {
      upcoming: appointments
        .filter((a: any) => new Date(a.starts_at) >= now && a.status !== 'cancelled')
        .slice(0, 5)
        .map((a: any) => ({
          serviceName: (a.services as any)?.name || a.title || 'Appointment',
          date: new Date(a.starts_at).toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: new Date(a.starts_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
          status: a.status,
        })),
      past: appointments
        .filter((a: any) => new Date(a.starts_at) < now)
        .slice(0, 5)
        .map((a: any) => ({
          serviceName: (a.services as any)?.name || a.title || 'Appointment',
          date: new Date(a.starts_at).toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: new Date(a.starts_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
          status: a.status,
        })),
    },
    quotes: quotes.map((q: any) => ({
      quoteNumber: q.quote_number,
      totalCents: q.total_cents,
      status: q.status,
      date: q.created_at,
    })),
    invoices: invoices.map((i: any) => ({
      invoiceNumber: i.invoice_number,
      totalCents: i.total_cents,
      status: i.status,
      dueDate: i.due_date,
    })),
    notes: notes.map((n: any) => ({
      note: n.note,
      date: n.created_at,
      source: n.source || 'manual',
    })),
    tags: tags.map((t: any) => t.tag),
  }
}

export function formatClientContextForPrompt(client: ClientContext): string {
  const sections: string[] = []

  // Identity
  if (client.isNew) {
    sections.push(`This is a NEW customer${client.name ? ` named ${client.name}` : ''}. This is their first interaction.`)
  } else {
    const name = client.name || 'Unknown'
    const since = client.firstSeen
      ? new Date(client.firstSeen).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      : 'unknown'
    sections.push(`Returning customer: ${name} (customer since ${since}, ${client.totalConversations} past conversations)`)
  }

  if (client.tags.length > 0) {
    sections.push(`Tags: ${client.tags.join(', ')}`)
  }

  // Upcoming appointments
  if (client.appointments.upcoming.length > 0) {
    const lines = client.appointments.upcoming.map(
      (a) => `  - ${a.serviceName} on ${a.date} at ${a.time} (${a.status})`
    )
    sections.push(`Upcoming appointments:\n${lines.join('\n')}`)
  }

  // Past appointments
  if (client.appointments.past.length > 0) {
    const lines = client.appointments.past.map(
      (a) => `  - ${a.serviceName} on ${a.date} at ${a.time} (${a.status})`
    )
    sections.push(`Recent past appointments:\n${lines.join('\n')}`)
  }

  // Open quotes
  const openQuotes = client.quotes.filter((q) => q.status === 'sent' || q.status === 'draft')
  if (openQuotes.length > 0) {
    const lines = openQuotes.map(
      (q) => `  - ${q.quoteNumber}: $${(q.totalCents / 100).toFixed(2)} (${q.status})`
    )
    sections.push(`Open quotes:\n${lines.join('\n')}`)
  }

  // Outstanding invoices
  const unpaidInvoices = client.invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
  if (unpaidInvoices.length > 0) {
    const lines = unpaidInvoices.map(
      (i) => `  - ${i.invoiceNumber}: $${(i.totalCents / 100).toFixed(2)} (${i.status}${i.dueDate ? `, due ${new Date(i.dueDate).toLocaleDateString('en-AU')}` : ''})`
    )
    sections.push(`Outstanding invoices:\n${lines.join('\n')}`)
  }

  // Notes
  if (client.notes.length > 0) {
    const lines = client.notes.slice(0, 5).map((n) => `  - ${n.note}`)
    sections.push(`Notes about this customer:\n${lines.join('\n')}`)
  }

  // Recent conversation summary
  if (client.recentMessages.length > 0) {
    const lastFew = client.recentMessages.slice(-6)
    const lines = lastFew.map(
      (m) => `  [${m.role}]: ${m.content.slice(0, 150)}${m.content.length > 150 ? '...' : ''}`
    )
    sections.push(`Recent conversation history:\n${lines.join('\n')}`)
  }

  return sections.join('\n\n')
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
