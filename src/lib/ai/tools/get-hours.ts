import { tool } from 'ai'
import { z } from 'zod'
import { BusinessContext } from '../context-builder'

export function getHoursTool(context: BusinessContext) {
  return tool({
    description: 'Get the business hours for a specific day or all days',
    inputSchema: z.object({
      day: z.string().optional().describe('Specific day of the week (e.g., "monday"), or omit for all days'),
    }),
    execute: async ({ day }: { day?: string }) => {
      if (day) {
        const dayLower = day.toLowerCase()
        const hours = context.hours[dayLower]
        if (hours === undefined) {
          return {
            day: dayLower,
            message: `No hours information available for ${day}`,
          }
        }
        if (hours === null) {
          return { day: dayLower, status: 'closed' }
        }
        return {
          day: dayLower,
          status: 'open',
          open: hours.open,
          close: hours.close,
        }
      }

      return {
        timezone: context.timezone,
        hours: Object.entries(context.hours).map(([d, h]) => ({
          day: d,
          status: h ? 'open' : 'closed',
          open: h?.open,
          close: h?.close,
        })),
      }
    },
  })
}
