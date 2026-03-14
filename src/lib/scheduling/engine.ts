import { SupabaseClient } from '@supabase/supabase-js'

export interface TimeSlot {
  start: Date
  end: Date
}

export interface AppointmentInput {
  tenantId: string
  clientId?: string
  serviceId?: string
  staffId?: string
  title: string
  startsAt: Date
  endsAt: Date
  notes?: string
  source?: 'ai' | 'manual' | 'online' | 'calendar_sync'
  createdBy?: string
}

export async function createAppointment(
  supabase: SupabaseClient,
  input: AppointmentInput
): Promise<{ id: string } | { error: string }> {
  // Check for conflicts
  const conflicts = await checkConflicts(
    supabase,
    input.tenantId,
    input.startsAt,
    input.endsAt,
    input.staffId
  )

  if (conflicts.length > 0) {
    return {
      error: `Time conflict with existing appointment: "${conflicts[0].title}" at ${new Date(conflicts[0].starts_at).toLocaleTimeString()}`,
    }
  }

  // Check availability rules
  const available = await checkStaffAvailability(
    supabase,
    input.tenantId,
    input.startsAt,
    input.endsAt,
    input.staffId
  )

  if (!available) {
    return { error: 'This time slot is outside of available hours' }
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: input.tenantId,
      client_id: input.clientId || null,
      service_id: input.serviceId || null,
      staff_id: input.staffId || null,
      title: input.title,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      notes: input.notes || null,
      source: input.source || 'ai',
      created_by: input.createdBy || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: `Failed to create appointment: ${error.message}` }
  }

  return { id: data.id }
}

export async function rescheduleAppointment(
  supabase: SupabaseClient,
  tenantId: string,
  appointmentId: string,
  newStartsAt: Date,
  newEndsAt: Date
): Promise<{ success: boolean; error?: string }> {
  // Check the appointment exists
  const { data: existing } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) {
    return { success: false, error: 'Appointment not found' }
  }

  if (existing.status === 'cancelled') {
    return { success: false, error: 'Cannot reschedule a cancelled appointment' }
  }

  // Check for conflicts (excluding current appointment)
  const conflicts = await checkConflicts(
    supabase,
    tenantId,
    newStartsAt,
    newEndsAt,
    existing.staff_id,
    appointmentId
  )

  if (conflicts.length > 0) {
    return {
      success: false,
      error: `Time conflict with "${conflicts[0].title}" at ${new Date(conflicts[0].starts_at).toLocaleTimeString()}`,
    }
  }

  // Check availability rules (same check as createAppointment)
  const available = await checkStaffAvailability(
    supabase,
    tenantId,
    newStartsAt,
    newEndsAt,
    existing.staff_id
  )

  if (!available) {
    return { success: false, error: 'This time slot is outside of available hours' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: newStartsAt.toISOString(),
      ends_at: newEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function cancelAppointment(
  supabase: SupabaseClient,
  tenantId: string,
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) {
    return { success: false, error: 'Appointment not found' }
  }

  if (existing.status === 'cancelled') {
    return { success: false, error: 'Appointment is already cancelled' }
  }

  const notes = reason ? `Cancelled: ${reason}` : undefined

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      notes: notes || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getSchedule(
  supabase: SupabaseClient,
  tenantId: string,
  startDate: Date,
  endDate: Date,
  staffId?: string
): Promise<any[]> {
  let query = supabase
    .from('appointments')
    .select('*, clients(name, email, phone), services(name, duration_minutes)')
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .gte('starts_at', startDate.toISOString())
    .lte('starts_at', endDate.toISOString())
    .order('starts_at')

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { data } = await query
  return data || []
}

export async function findAvailableSlots(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  durationMinutes: number,
  staffId?: string,
  timezone: string = 'Australia/Sydney'
): Promise<TimeSlot[]> {
  // Get business hours for the day
  const dayOfWeek = date.getDay()

  // Check for overrides first
  const dateStr = date.toISOString().split('T')[0]
  const { data: overrides } = await supabase
    .from('availability_overrides')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('override_date', dateStr)
    .is('staff_id', staffId || null)

  if (overrides && overrides.length > 0) {
    const override = overrides[0]
    if (!override.is_available) return [] // Day off
    // Use override times if available
    if (override.start_time && override.end_time) {
      return findSlotsInRange(
        supabase,
        tenantId,
        date,
        override.start_time,
        override.end_time,
        durationMinutes,
        staffId
      )
    }
  }

  // Get regular availability
  let availQuery = supabase
    .from('availability_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (staffId) {
    availQuery = availQuery.eq('staff_id', staffId)
  } else {
    availQuery = availQuery.is('staff_id', null)
  }

  const { data: rules } = await availQuery

  if (!rules || rules.length === 0) return []

  const allSlots: TimeSlot[] = []
  for (const rule of rules) {
    const slots = await findSlotsInRange(
      supabase,
      tenantId,
      date,
      rule.start_time,
      rule.end_time,
      durationMinutes,
      staffId
    )
    allSlots.push(...slots)
  }

  return allSlots
}

async function findSlotsInRange(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  staffId?: string
): Promise<TimeSlot[]> {
  const dateStr = date.toISOString().split('T')[0]
  const rangeStart = new Date(`${dateStr}T${startTime}`)
  const rangeEnd = new Date(`${dateStr}T${endTime}`)

  // Get existing appointments in range
  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .gte('starts_at', rangeStart.toISOString())
    .lte('starts_at', rangeEnd.toISOString())

  const appointments = (existing || []).map((a: any) => ({
    start: new Date(a.starts_at),
    end: new Date(a.ends_at),
  }))

  // Find free slots
  const slots: TimeSlot[] = []
  let current = new Date(rangeStart)
  const slotDuration = durationMinutes * 60 * 1000

  while (current.getTime() + slotDuration <= rangeEnd.getTime()) {
    const slotEnd = new Date(current.getTime() + slotDuration)
    const hasConflict = appointments.some(
      (a: { start: Date; end: Date }) =>
        current < a.end && slotEnd > a.start
    )

    if (!hasConflict) {
      slots.push({ start: new Date(current), end: new Date(slotEnd) })
    }

    // Move to next 30-minute increment
    current = new Date(current.getTime() + 30 * 60 * 1000)
  }

  return slots
}

async function checkConflicts(
  supabase: SupabaseClient,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
  staffId?: string,
  excludeAppointmentId?: string
): Promise<any[]> {
  let query = supabase
    .from('appointments')
    .select('id, title, starts_at, ends_at')
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .lt('starts_at', endsAt.toISOString())
    .gt('ends_at', startsAt.toISOString())

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data } = await query
  return data || []
}

async function checkStaffAvailability(
  supabase: SupabaseClient,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
  staffId?: string
): Promise<boolean> {
  const dateStr = startsAt.toISOString().split('T')[0]
  const dayOfWeek = startsAt.getDay()

  // Check overrides first
  const { data: overrides } = await supabase
    .from('availability_overrides')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('override_date', dateStr)

  if (staffId) {
    const staffOverride = overrides?.find((o: any) => o.staff_id === staffId)
    if (staffOverride) {
      if (!staffOverride.is_available) return false
      if (staffOverride.start_time && staffOverride.end_time) {
        const startTime = startsAt.toTimeString().slice(0, 5)
        const endTime = endsAt.toTimeString().slice(0, 5)
        return startTime >= staffOverride.start_time && endTime <= staffOverride.end_time
      }
      return true
    }
  }

  // Check tenant-level override (no staff)
  const tenantOverride = overrides?.find((o: any) => !o.staff_id)
  if (tenantOverride && !tenantOverride.is_available) return false

  // Check regular availability rules
  let query = supabase
    .from('availability_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (staffId) {
    query = query.eq('staff_id', staffId)
  } else {
    query = query.is('staff_id', null)
  }

  const { data: rules } = await query

  // If no rules exist, allow by default (business hasn't configured availability yet)
  if (!rules || rules.length === 0) return true

  // Check if time falls within any rule
  const startTime = startsAt.toTimeString().slice(0, 5)
  const endTime = endsAt.toTimeString().slice(0, 5)

  return rules.some(
    (r: any) => startTime >= r.start_time && endTime <= r.end_time
  )
}
