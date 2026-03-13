const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)')
  }

  return { accountSid, authToken }
}

function authHeaders(accountSid: string, authToken: string): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
  }
}

// ---------------------------------------------------------------------------
// Send SMS
// ---------------------------------------------------------------------------
export async function sendSms(to: string, body: string, from?: string) {
  const { accountSid, authToken } = getCredentials()
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER

  if (!fromNumber) {
    throw new Error('Missing Twilio phone number (TWILIO_PHONE_NUMBER)')
  }

  const params = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  })

  const res = await fetch(
    `${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(accountSid, authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Twilio API error: ${error.message || res.status}`)
  }

  const data = await res.json()
  return {
    sid: data.sid,
    status: data.status,
  }
}

// ---------------------------------------------------------------------------
// List incoming phone numbers on the account
// ---------------------------------------------------------------------------
export async function listPhoneNumbers() {
  const { accountSid, authToken } = getCredentials()

  const res = await fetch(
    `${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
    {
      method: 'GET',
      headers: authHeaders(accountSid, authToken),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Twilio API error: ${error.message || res.status}`)
  }

  const data = await res.json()
  return (data.incoming_phone_numbers || []).map((num: any) => ({
    sid: num.sid,
    phoneNumber: num.phone_number,
    friendlyName: num.friendly_name,
    smsUrl: num.sms_url,
    capabilities: num.capabilities,
  }))
}

// ---------------------------------------------------------------------------
// Buy (provision) a phone number
// ---------------------------------------------------------------------------
export async function buyPhoneNumber(phoneNumber: string) {
  const { accountSid, authToken } = getCredentials()

  const params = new URLSearchParams({
    PhoneNumber: phoneNumber,
  })

  const res = await fetch(
    `${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(accountSid, authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Twilio API error: ${error.message || res.status}`)
  }

  const data = await res.json()
  return {
    sid: data.sid,
    phoneNumber: data.phone_number,
    friendlyName: data.friendly_name,
  }
}

// ---------------------------------------------------------------------------
// Configure the SMS webhook URL on an incoming phone number
// ---------------------------------------------------------------------------
export async function configureWebhook(phoneNumberSid: string, smsUrl: string) {
  const { accountSid, authToken } = getCredentials()

  const params = new URLSearchParams({
    SmsUrl: smsUrl,
    SmsMethod: 'POST',
  })

  const res = await fetch(
    `${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(accountSid, authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Twilio API error: ${error.message || res.status}`)
  }

  const data = await res.json()
  return {
    sid: data.sid,
    phoneNumber: data.phone_number,
    smsUrl: data.sms_url,
  }
}

// ---------------------------------------------------------------------------
// Search available phone numbers to buy
// ---------------------------------------------------------------------------
export async function searchAvailableNumbers(
  countryCode: string = 'US',
  options?: { areaCode?: string; smsEnabled?: boolean }
) {
  const { accountSid, authToken } = getCredentials()

  const queryParams = new URLSearchParams()
  if (options?.areaCode) queryParams.set('AreaCode', options.areaCode)
  if (options?.smsEnabled !== false) queryParams.set('SmsEnabled', 'true')

  const url = `${TWILIO_API_BASE}/Accounts/${accountSid}/AvailablePhoneNumbers/${countryCode}/Local.json?${queryParams.toString()}`

  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accountSid, authToken),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Twilio API error: ${error.message || res.status}`)
  }

  const data = await res.json()
  return (data.available_phone_numbers || []).map((num: any) => ({
    phoneNumber: num.phone_number,
    friendlyName: num.friendly_name,
    locality: num.locality,
    region: num.region,
    capabilities: num.capabilities,
  }))
}

// ---------------------------------------------------------------------------
// Validate Twilio webhook signature
// ---------------------------------------------------------------------------
export async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false

  // Sort params and build validation string
  const sortedKeys = Object.keys(params).sort()
  let dataString = url
  for (const key of sortedKeys) {
    dataString += key + params[key]
  }

  // HMAC-SHA1
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString))
  const computed = Buffer.from(sig).toString('base64')

  return computed === signature
}
