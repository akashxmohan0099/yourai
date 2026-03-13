const NYLAS_API_BASE = 'https://api.us.nylas.com/v3'

interface NylasConfig {
  apiKey: string
  grantId: string
  calendarId?: string
}

function getConfig(): NylasConfig {
  const apiKey = process.env.NYLAS_API_KEY
  if (!apiKey) throw new Error('NYLAS_API_KEY not configured')
  return {
    apiKey,
    grantId: '', // Set per-tenant
    calendarId: undefined,
  }
}

async function nylasRequest(
  path: string,
  grantId: string,
  options: RequestInit = {}
): Promise<any> {
  const apiKey = process.env.NYLAS_API_KEY
  if (!apiKey) throw new Error('NYLAS_API_KEY not configured')

  const url = `${NYLAS_API_BASE}/grants/${grantId}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Nylas API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function createCalendarEvent(
  grantId: string,
  calendarId: string,
  event: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
    location?: string
    participants?: Array<{ email: string; name?: string }>
  }
) {
  return nylasRequest(`/events?calendar_id=${calendarId}`, grantId, {
    method: 'POST',
    body: JSON.stringify({
      title: event.title,
      description: event.description,
      location: event.location,
      when: {
        start_time: Math.floor(event.startTime.getTime() / 1000),
        end_time: Math.floor(event.endTime.getTime() / 1000),
      },
      participants: event.participants?.map((p) => ({
        email: p.email,
        name: p.name,
      })),
    }),
  })
}

export async function updateCalendarEvent(
  grantId: string,
  calendarId: string,
  eventId: string,
  updates: {
    title?: string
    startTime?: Date
    endTime?: Date
    description?: string
  }
) {
  const body: any = {}
  if (updates.title) body.title = updates.title
  if (updates.description) body.description = updates.description
  if (updates.startTime && updates.endTime) {
    body.when = {
      start_time: Math.floor(updates.startTime.getTime() / 1000),
      end_time: Math.floor(updates.endTime.getTime() / 1000),
    }
  }

  return nylasRequest(
    `/events/${eventId}?calendar_id=${calendarId}`,
    grantId,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  )
}

export async function deleteCalendarEvent(
  grantId: string,
  calendarId: string,
  eventId: string
) {
  return nylasRequest(
    `/events/${eventId}?calendar_id=${calendarId}`,
    grantId,
    { method: 'DELETE' }
  )
}

export async function listCalendarEvents(
  grantId: string,
  calendarId: string,
  startTime: Date,
  endTime: Date
) {
  const start = Math.floor(startTime.getTime() / 1000)
  const end = Math.floor(endTime.getTime() / 1000)
  return nylasRequest(
    `/events?calendar_id=${calendarId}&start=${start}&end=${end}`,
    grantId
  )
}

export async function listCalendars(grantId: string) {
  return nylasRequest('/calendars', grantId)
}

// Email functions

export async function sendEmail(
  grantId: string,
  email: {
    to: Array<{ email: string; name?: string }>
    subject: string
    body: string
    replyToMessageId?: string
  }
) {
  const payload: any = {
    to: email.to,
    subject: email.subject,
    body: email.body,
  }
  if (email.replyToMessageId) {
    payload.reply_to_message_id = email.replyToMessageId
  }
  return nylasRequest('/messages/send', grantId, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getEmailMessage(grantId: string, messageId: string) {
  return nylasRequest(`/messages/${messageId}`, grantId)
}

export async function listEmailMessages(
  grantId: string,
  options?: { limit?: number; unread?: boolean; in?: string }
) {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.unread !== undefined) params.set('unread', String(options.unread))
  if (options?.in) params.set('in', options.in)
  const query = params.toString() ? `?${params.toString()}` : ''
  return nylasRequest(`/messages${query}`, grantId)
}
