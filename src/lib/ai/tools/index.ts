import { BusinessContext } from '../context-builder'
import { checkPermission } from '../permission-gate'
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

/**
 * Wraps a tool's execute function with the permission gate.
 * If the gate returns allowed: false, the tool returns an error message
 * instead of executing. This enforces hard boundaries and approval requirements
 * BEFORE the tool runs, not after.
 */
function withPermissionGate(
  toolName: string,
  toolDef: any,
  rules: BusinessContext['rules']
): any {
  const originalExecute = toolDef.execute
  if (!originalExecute) return toolDef

  return {
    ...toolDef,
    execute: async (args: Record<string, unknown>) => {
      const permission = checkPermission(toolName, args, rules)
      if (!permission.allowed) {
        if (permission.requiresApproval) {
          return {
            error: true,
            message: `This action requires owner approval: ${permission.reason}`,
            requiresApproval: true,
          }
        }
        return {
          error: true,
          message: `Action blocked by business rule: ${permission.reason}`,
        }
      }
      return originalExecute(args)
    },
  }
}

/**
 * Apply permission gate to all tools in a map.
 */
function gateTools(
  tools: Record<string, any>,
  rules: BusinessContext['rules']
): Record<string, any> {
  const gated: Record<string, any> = {}
  for (const [name, def] of Object.entries(tools)) {
    gated[name] = withPermissionGate(name, def, rules)
  }
  return gated
}

export function getCustomerTools(
  context: BusinessContext,
  supabase?: SupabaseClient,
  tenantId?: string,
  conversationId?: string,
  clientId?: string,
  allowWriteTools: boolean = true
) {
  // Customer tools are read-only unless the caller explicitly enables write access.
  const tools: Record<string, any> = {
    getServices: getServicesTool(context),
    getPricing: getPricingTool(context),
    getHours: getHoursTool(context),
    getFaqs: getFaqsTool(context),
    checkAvailability: checkAvailabilityTool(context),
  }

  if (allowWriteTools && supabase && tenantId) {
    tools.createAppointment = createAppointmentTool(context, supabase, tenantId)
  }

  if (allowWriteTools && supabase && tenantId && conversationId) {
    tools.requestApproval = requestApprovalTool(supabase, tenantId, conversationId, clientId)
  }

  return gateTools(tools, context.rules)
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

  return gateTools(tools, context.rules)
}
