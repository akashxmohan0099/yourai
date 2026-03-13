import { tool } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { createAppointment } from '@/lib/scheduling/engine'
import { BusinessContext } from '../context-builder'

export function createAppointmentTool(
  context: BusinessContext,
  supabase: SupabaseClient,
  tenantId: string
) {
  return tool({
    description:
      'Book a new appointment. Use when someone wants to schedule a service. Checks for conflicts and availability automatically.',
    inputSchema: z.object({
      clientName: z.string().describe('Name of the client'),
      serviceName: z
        .string()
        .optional()
        .describe('Name of the service being booked'),
      date: z
        .string()
        .describe('Date for the appointment in YYYY-MM-DD format'),
      time: z.string().describe('Start time in HH:MM format (24-hour)'),
      durationMinutes: z
        .number()
        .optional()
        .describe('Duration in minutes. If not specified, uses the service default duration.'),
      notes: z.string().optional().describe('Any additional notes'),
    }),
    execute: async ({
      clientName,
      serviceName,
      date,
      time,
      durationMinutes,
      notes,
    }: {
      clientName: string
      serviceName?: string
      date: string
      time: string
      durationMinutes?: number
      notes?: string
    }) => {
      // Find client by name
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${clientName}%`)
        .limit(1)

      let clientId = clients?.[0]?.id

      // Auto-create client if not found (common for first-time voice callers)
      if (!clientId) {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            tenant_id: tenantId,
            name: clientName,
            source_channel: 'ai',
          })
          .select('id')
          .single()
        clientId = newClient?.id
      }

      // Find service by name
      let serviceId: string | undefined
      let duration = durationMinutes || 60
      if (serviceName) {
        const match = context.services.find(
          (s) => s.name.toLowerCase() === serviceName.toLowerCase()
        )
        if (match) {
          duration = match.durationMinutes || duration
          // Get service ID from DB
          const { data: svc } = await supabase
            .from('services')
            .select('id')
            .eq('tenant_id', tenantId)
            .ilike('name', serviceName)
            .limit(1)
          serviceId = svc?.[0]?.id
        }
      }

      const startsAt = new Date(`${date}T${time}:00`)
      const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000)

      if (isNaN(startsAt.getTime())) {
        return { success: false, message: 'Invalid date or time format. Use YYYY-MM-DD and HH:MM.' }
      }

      const title = serviceName
        ? `${serviceName} - ${clientName}`
        : `Appointment - ${clientName}`

      const result = await createAppointment(supabase, {
        tenantId,
        clientId,
        serviceId,
        title,
        startsAt,
        endsAt,
        notes,
        source: 'ai',
      })

      if ('error' in result) {
        return { success: false, message: result.error }
      }

      return {
        success: true,
        appointmentId: result.id,
        message: `Booked "${title}" on ${date} from ${time} to ${endsAt.toTimeString().slice(0, 5)} (${duration} min)`,
        details: {
          date,
          startTime: time,
          endTime: endsAt.toTimeString().slice(0, 5),
          duration,
          client: clientName,
          service: serviceName,
        },
      }
    },
  })
}
