import { sendSms } from './client'

// ---------------------------------------------------------------------------
// Send an approval request SMS to the business owner
// ---------------------------------------------------------------------------
export async function sendApprovalSMS(
  ownerPhone: string,
  summary: string,
  approvalId: string
) {
  const body = [
    '[YourAI] Approval needed:',
    '',
    summary,
    '',
    'Reply YES to approve or NO to deny.',
    '',
    `Ref: ${approvalId.slice(0, 8)}`,
  ].join('\n')

  return sendSms(ownerPhone, body)
}

// ---------------------------------------------------------------------------
// Send an appointment reminder to a client
// ---------------------------------------------------------------------------
export interface AppointmentDetails {
  businessName: string
  serviceName: string
  date: string      // e.g. "March 15, 2026"
  time: string      // e.g. "2:00 PM"
  duration?: string  // e.g. "30 min"
  location?: string
}

export async function sendAppointmentReminder(
  clientPhone: string,
  details: AppointmentDetails
) {
  const lines = [
    `Reminder from ${details.businessName}:`,
    '',
    `You have an upcoming appointment:`,
    `  ${details.serviceName}`,
    `  ${details.date} at ${details.time}`,
  ]

  if (details.duration) {
    lines.push(`  Duration: ${details.duration}`)
  }
  if (details.location) {
    lines.push(`  Location: ${details.location}`)
  }

  lines.push('', 'Reply to this message if you need to reschedule.')

  return sendSms(clientPhone, lines.join('\n'))
}

// ---------------------------------------------------------------------------
// Send an invoice notification to a client
// ---------------------------------------------------------------------------
export interface InvoiceDetails {
  businessName: string
  invoiceNumber: string
  amount: string        // e.g. "$150.00"
  dueDate?: string      // e.g. "March 20, 2026"
  paymentUrl?: string   // Link to pay online
}

export async function sendInvoiceNotification(
  clientPhone: string,
  details: InvoiceDetails
) {
  const lines = [
    `${details.businessName} — Invoice ${details.invoiceNumber}`,
    '',
    `Amount due: ${details.amount}`,
  ]

  if (details.dueDate) {
    lines.push(`Due by: ${details.dueDate}`)
  }

  if (details.paymentUrl) {
    lines.push('', `Pay online: ${details.paymentUrl}`)
  }

  lines.push('', 'Reply with any questions.')

  return sendSms(clientPhone, lines.join('\n'))
}
