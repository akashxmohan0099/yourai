function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let mismatch = 0
  for (let i = 0; i < left.length; i++) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }

  return mismatch === 0
}

async function signBody(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyNylasWebhookRequest(
  request: Request
): Promise<{ ok: true; body: string } | { ok: false; response: Response }> {
  const secret = process.env.NYLAS_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return {
      ok: false,
      response: new Response('NYLAS_WEBHOOK_SECRET not configured', { status: 503 }),
    }
  }

  const signature = request.headers.get('x-nylas-signature')?.trim().toLowerCase()
  if (!signature) {
    return {
      ok: false,
      response: new Response('Missing signature', { status: 401 }),
    }
  }

  const body = await request.text()
  const expected = await signBody(body, secret)

  if (!constantTimeEqual(expected, signature)) {
    return {
      ok: false,
      response: new Response('Invalid signature', { status: 401 }),
    }
  }

  return { ok: true, body }
}
