/**
 * Vapi Squads — multi-agent handoff configuration for YourAI
 *
 * A squad consists of multiple AI assistants (members) that can hand off
 * to each other mid-call using transfer-destination-request messages.
 */

import type { VapiServerConfig } from './server-auth'

// ── Types ────────────────────────────────────────────────────────────

export interface SquadMemberConfig {
  name: string
  firstMessage?: string
  instructions: string
  model?: {
    provider: string
    model: string
  }
  voice?: {
    provider: string
    voiceId: string
  }
  /** Names of squad members this agent can transfer to */
  transferDestinations: string[]
}

export interface SquadConfig {
  name: string
  members: SquadMember[]
}

export interface SquadMember {
  assistant: {
    name: string
    firstMessage?: string
    model: {
      provider: string
      model: string
      messages: Array<{ role: string; content: string }>
    }
    voice?: {
      provider: string
      voiceId: string
    }
    serverUrl?: string
    server?: VapiServerConfig
    transcriber?: {
      provider: string
      model?: string
      language?: string
    }
  }
  assistantDestinations: Array<{
    type: 'assistant'
    assistantName: string
    message: string
    description: string
  }>
}

export interface BusinessSquadInput {
  businessName: string
  businessType?: string
  services?: string[]
  server: VapiServerConfig
  voiceProvider?: string
  voiceId?: string
}

// ── Squad builder ────────────────────────────────────────────────────

export function createBusinessSquad(config: BusinessSquadInput): SquadConfig {
  const {
    businessName,
    businessType = 'service business',
    services = [],
    server,
    voiceProvider = '11labs',
    voiceId = 'bIHbv24MWmeRgasZH58o',
  } = config
  const serverUrl = server.url

  const servicesText = services.length > 0
    ? `Available services: ${services.join(', ')}.`
    : ''

  const greeter: SquadMember = {
    assistant: {
      name: 'Greeter',
      firstMessage: `Hi! Thanks for calling ${businessName}. How can I help you today?`,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the greeting agent for ${businessName}, a ${businessType}. Your job is to warmly greet the caller, understand what they need, and hand them off to the right specialist.

${servicesText}

HANDOFF RULES:
- If the caller wants to book an appointment, check availability, reschedule, or cancel — transfer to "Booking Agent".
- If the caller wants pricing, a quote, or service information — transfer to "Quoting Agent".
- For general questions, answer briefly yourself.
- Always be warm, professional, and concise.
- Before transferring, briefly confirm what the caller needs.`,
          },
        ],
      },
      voice: { provider: voiceProvider, voiceId },
      serverUrl,
      server,
      transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
    },
    assistantDestinations: [
      {
        type: 'assistant',
        assistantName: 'Booking Agent',
        message: 'Let me transfer you to our booking specialist.',
        description: 'Transfer to the booking agent when the caller wants to schedule, reschedule, or cancel an appointment.',
      },
      {
        type: 'assistant',
        assistantName: 'Quoting Agent',
        message: 'Let me connect you with someone who can help with pricing.',
        description: 'Transfer to the quoting agent when the caller asks about pricing, service details, or wants a quote.',
      },
    ],
  }

  const bookingAgent: SquadMember = {
    assistant: {
      name: 'Booking Agent',
      firstMessage: "I'm here to help with your appointment. What were you looking to schedule?",
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the booking agent for ${businessName}, a ${businessType}. You help callers with appointment scheduling.

${servicesText}

CAPABILITIES:
- Check availability for requested dates/times
- Book new appointments
- Reschedule existing appointments
- Cancel appointments

HANDOFF RULES:
- If the caller starts asking about pricing or wants a quote — transfer to "Quoting Agent".
- If the caller has a completely different question — transfer to "Greeter".
- Use the server tools (check_availability, book_appointment) to actually manage bookings.
- Always confirm the appointment details before booking: service, date, time, and name.
- Be helpful, efficient, and professional.`,
          },
        ],
      },
      voice: { provider: voiceProvider, voiceId },
      serverUrl,
      server,
      transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
    },
    assistantDestinations: [
      {
        type: 'assistant',
        assistantName: 'Quoting Agent',
        message: "Let me connect you with our quoting specialist for that.",
        description: 'Transfer to the quoting agent when the caller asks about pricing or wants a quote.',
      },
      {
        type: 'assistant',
        assistantName: 'Greeter',
        message: "Let me transfer you back so we can help with that.",
        description: 'Transfer back to the greeter for general questions outside of booking.',
      },
    ],
  }

  const quotingAgent: SquadMember = {
    assistant: {
      name: 'Quoting Agent',
      firstMessage: "I'd be happy to help with pricing. What service are you interested in?",
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the quoting agent for ${businessName}, a ${businessType}. You help callers with service inquiries, pricing, and creating quotes.

${servicesText}

CAPABILITIES:
- Answer questions about available services
- Provide pricing information
- Create and send quotes
- Explain what each service includes

HANDOFF RULES:
- If the caller decides they want to book — transfer to "Booking Agent".
- If the caller has a different question — transfer to "Greeter".
- Use the server tools to look up accurate pricing.
- Be knowledgeable, helpful, and avoid hard-sell tactics.
- If you don't have exact pricing, offer to send a detailed quote via email or text.`,
          },
        ],
      },
      voice: { provider: voiceProvider, voiceId },
      serverUrl,
      server,
      transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
    },
    assistantDestinations: [
      {
        type: 'assistant',
        assistantName: 'Booking Agent',
        message: "Let me transfer you to our booking specialist to get that scheduled.",
        description: 'Transfer to the booking agent when the caller wants to proceed with booking.',
      },
      {
        type: 'assistant',
        assistantName: 'Greeter',
        message: "Let me transfer you back so we can help with that.",
        description: 'Transfer back to the greeter for general questions outside of quoting.',
      },
    ],
  }

  return {
    name: `${businessName} Squad`,
    members: [greeter, bookingAgent, quotingAgent],
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Given a squad config and a destination assistant name, return the
 * matching member's assistant config for transfer-destination-request.
 */
export function findSquadMember(
  squad: SquadConfig,
  assistantName: string
): SquadMember['assistant'] | null {
  const member = squad.members.find(
    (m) => m.assistant.name.toLowerCase() === assistantName.toLowerCase()
  )
  return member?.assistant ?? null
}

/**
 * Build the Vapi API payload for creating a squad.
 * Uses transferMode: "rolling-history" so each agent has context from previous agents.
 */
export function buildSquadPayload(squad: SquadConfig) {
  return {
    name: squad.name,
    members: squad.members.map((member) => ({
      assistant: member.assistant,
      assistantDestinations: member.assistantDestinations,
    })),
    membersOverrides: {
      transferMode: 'rolling-history' as const,
    },
  }
}
