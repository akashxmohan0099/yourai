export interface VapiServerConfig {
  url: string
  headers?: Record<string, string>
}

export function getVapiWebhookSecret(): string | null {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim()
  return secret || null
}

export function buildVapiServerConfig(url: string): VapiServerConfig {
  const secret = getVapiWebhookSecret()

  if (!secret) {
    return { url }
  }

  return {
    url,
    headers: {
      'X-Vapi-Secret': secret,
    },
  }
}

export function buildVapiServerFields(url: string) {
  return {
    server: buildVapiServerConfig(url),
  }
}

export function verifyVapiRequest(request: Request): Response | null {
  const secret = getVapiWebhookSecret()
  if (!secret) {
    return new Response('VAPI_WEBHOOK_SECRET not configured', { status: 503 })
  }

  const authorization = request.headers.get('authorization')?.trim()
  if (authorization === `Bearer ${secret}`) {
    return null
  }

  const legacySecret = request.headers.get('x-vapi-secret')?.trim()
  if (legacySecret === secret) {
    return null
  }

  return new Response('Forbidden', { status: 403 })
}
