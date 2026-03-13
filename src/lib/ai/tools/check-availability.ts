import { tool } from 'ai'
import { z } from 'zod'
import { BusinessContext } from '../context-builder'

export function checkAvailabilityTool(context: BusinessContext) {
  return tool({
    description: 'Check if the business is open on a given day and time',
    inputSchema: z.object({
      day: z.string().describe('Day of the week (e.g., "monday")'),
      time: z.string().optional().describe('Time to check (e.g., "14:00"), optional'),
    }),
    execute: async ({ day, time }: { day: string; time?: string }) => {
      const dayLower = day.toLowerCase()
      const hours = context.hours[dayLower]

      if (hours === undefined) {
        return {
          available: false,
          reason: `No hours information for ${day}`,
        }
      }

      if (hours === null) {
        return {
          available: false,
          reason: `The business is closed on ${day}s`,
        }
      }

      if (!time) {
        return {
          available: true,
          hours: `${hours.open} - ${hours.close}`,
          message: `The business is open on ${day}s from ${hours.open} to ${hours.close}`,
        }
      }

      // Simple time comparison
      const requestedTime = time.replace(':', '')
      const openTime = hours.open.replace(':', '')
      const closeTime = hours.close.replace(':', '')

      const isWithinHours =
        requestedTime >= openTime && requestedTime < closeTime

      return {
        available: isWithinHours,
        requestedTime: time,
        businessHours: `${hours.open} - ${hours.close}`,
        message: isWithinHours
          ? `Yes, the business is open at ${time} on ${day}s`
          : `Sorry, the business is not open at ${time} on ${day}s. Hours are ${hours.open} - ${hours.close}`,
      }
    },
  })
}
