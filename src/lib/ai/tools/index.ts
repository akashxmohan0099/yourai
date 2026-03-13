import { BusinessContext } from '../context-builder'
import { getServicesTool } from './get-services'
import { getPricingTool } from './get-pricing'
import { getHoursTool } from './get-hours'
import { getFaqsTool } from './get-faqs'
import { checkAvailabilityTool } from './check-availability'
import { requestApprovalTool } from './request-approval'
import { createAppointmentTool } from './create-appointment'
import { rescheduleAppointmentTool } from './reschedule-appointment'
import { cancelAppointmentTool } from './cancel-appointment'
import { getScheduleTool } from './get-schedule'
import { searchClientsTool } from './search-clients'
import { addClientNoteTool } from './add-client-note'
import { createQuoteTool } from './create-quote'
import { createInvoiceTool } from './create-invoice'
import { checkPaymentTool } from './check-payment'
import { SupabaseClient } from '@supabase/supabase-js'

export function getCustomerTools(
  context: BusinessContext,
  supabase?: SupabaseClient,
  tenantId?: string,
  conversationId?: string,
  clientId?: string
) {
  const tools: Record<string, any> = {
    getServices: getServicesTool(context),
    getPricing: getPricingTool(context),
    getHours: getHoursTool(context),
    getFaqs: getFaqsTool(context),
    checkAvailability: checkAvailabilityTool(context),
  }

  if (supabase && tenantId && conversationId) {
    tools.requestApproval = requestApprovalTool(supabase, tenantId, conversationId, clientId)
  }

  return tools
}

export function getOwnerTools(
  context: BusinessContext,
  supabase?: SupabaseClient,
  tenantId?: string,
  conversationId?: string
) {
  const customerTools = getCustomerTools(context)
  const tools: Record<string, any> = { ...customerTools }

  if (supabase && tenantId) {
    tools.createAppointment = createAppointmentTool(context, supabase, tenantId)
    tools.rescheduleAppointment = rescheduleAppointmentTool(supabase, tenantId)
    tools.cancelAppointment = cancelAppointmentTool(supabase, tenantId)
    tools.getSchedule = getScheduleTool(supabase, tenantId)
    tools.searchClients = searchClientsTool(supabase, tenantId)
    tools.addClientNote = addClientNoteTool(supabase, tenantId)
    tools.createQuote = createQuoteTool(supabase, tenantId)
    tools.createInvoice = createInvoiceTool(supabase, tenantId)
    tools.checkPayment = checkPaymentTool(supabase, tenantId)
  }

  if (supabase && tenantId && conversationId) {
    tools.requestApproval = requestApprovalTool(supabase, tenantId, conversationId)
  }

  return tools
}
