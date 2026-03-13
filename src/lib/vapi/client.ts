const VAPI_API_BASE = 'https://api.vapi.ai'

export class VapiClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VAPI_API_KEY || ''
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  // ── Phone Numbers ──────────────────────────────────────────────

  async listPhoneNumbers(): Promise<any[]> {
    const res = await fetch(`${VAPI_API_BASE}/phone-number`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  // ── Assistants ─────────────────────────────────────────────────

  async getAssistant(id: string): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/assistant/${id}`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async updateAssistant(id: string, updates: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/assistant/${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  // ── Phone Number Assignment ────────────────────────────────────

  async assignPhoneToAssistant(phoneNumberId: string, assistantId: string): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/phone-number/${phoneNumberId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ assistantId }),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  // ── Calls ──────────────────────────────────────────────────────

  async makeOutboundCall(assistantId: string, phoneNumberId: string, customerNumber: string): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/call`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: customerNumber },
      }),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async getCall(callId: string) {
    const res = await fetch(`${VAPI_API_BASE}/call/${callId}`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async createPhoneCall(options: {
    assistantId: string
    phoneNumberId: string
    customerNumber: string
    firstMessage?: string
  }) {
    const res = await fetch(`${VAPI_API_BASE}/call/phone`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        assistantId: options.assistantId,
        phoneNumberId: options.phoneNumberId,
        customer: { number: options.customerNumber },
        firstMessage: options.firstMessage,
      }),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async transferCall(callId: string, destination: { number: string; message?: string }) {
    const res = await fetch(`${VAPI_API_BASE}/call/${callId}/transfer`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ destination }),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  // ── Squads ──────────────────────────────────────────────────────

  async createSquad(squad: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/squad`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(squad),
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async listSquads(): Promise<any[]> {
    const res = await fetch(`${VAPI_API_BASE}/squad`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async getSquad(id: string): Promise<any> {
    const res = await fetch(`${VAPI_API_BASE}/squad/${id}`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
    return res.json()
  }

  async deleteSquad(id: string): Promise<void> {
    const res = await fetch(`${VAPI_API_BASE}/squad/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`)
  }
}

export function getVapiClient() {
  return new VapiClient()
}
