import { tool } from 'ai'
import { z } from 'zod'
import { BusinessContext } from '../context-builder'

export function getPricingTool(context: BusinessContext) {
  return tool({
    description: 'Get pricing information for a specific service',
    inputSchema: z.object({
      serviceName: z.string().describe('Name of the service to get pricing for'),
    }),
    execute: async ({ serviceName }: { serviceName: string }) => {
      const service = context.services.find(
        (s) => s.name.toLowerCase() === serviceName.toLowerCase()
      )

      if (!service) {
        return {
          found: false,
          message: `Service "${serviceName}" not found. Available services: ${context.services.map((s) => s.name).join(', ')}`,
        }
      }

      let priceDescription = ''
      if (service.priceCents) {
        const price = (service.priceCents / 100).toFixed(2)
        switch (service.priceType) {
          case 'fixed':
            priceDescription = `$${price}`
            break
          case 'hourly':
            priceDescription = `$${price} per hour`
            break
          case 'starting_at':
            priceDescription = `Starting at $${price}`
            break
          default:
            priceDescription = `$${price}`
        }
      } else {
        priceDescription = 'Contact for a custom quote'
      }

      return {
        found: true,
        service: service.name,
        price: priceDescription,
        duration: service.durationMinutes
          ? `${service.durationMinutes} minutes`
          : 'Varies',
        description: service.description,
      }
    },
  })
}
