import { tool } from 'ai'
import { z } from 'zod'
import { BusinessContext } from '../context-builder'

export function getServicesTool(context: BusinessContext) {
  return tool({
    description: 'Get the list of services offered by the business, optionally filtered by category',
    inputSchema: z.object({
      category: z.string().optional().describe('Filter by service category'),
    }),
    execute: async ({ category }: { category?: string }) => {
      let services = context.services
      if (category) {
        services = services.filter(
          (s) => s.category?.toLowerCase() === category.toLowerCase()
        )
      }
      return {
        services: services.map((s) => ({
          name: s.name,
          description: s.description,
          category: s.category,
          price: s.priceCents
            ? `$${(s.priceCents / 100).toFixed(2)}`
            : 'Contact for quote',
          priceType: s.priceType,
          duration: s.durationMinutes
            ? `${s.durationMinutes} minutes`
            : undefined,
        })),
      }
    },
  })
}
