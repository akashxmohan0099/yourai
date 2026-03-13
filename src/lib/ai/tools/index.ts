import { BusinessContext } from '../context-builder'
import { getServicesTool } from './get-services'
import { getPricingTool } from './get-pricing'
import { getHoursTool } from './get-hours'
import { getFaqsTool } from './get-faqs'
import { checkAvailabilityTool } from './check-availability'

export function getCustomerTools(context: BusinessContext) {
  return {
    getServices: getServicesTool(context),
    getPricing: getPricingTool(context),
    getHours: getHoursTool(context),
    getFaqs: getFaqsTool(context),
    checkAvailability: checkAvailabilityTool(context),
  }
}

export function getOwnerTools(context: BusinessContext) {
  return {
    ...getCustomerTools(context),
    // Owner-specific tools added in Phase 3
  }
}
