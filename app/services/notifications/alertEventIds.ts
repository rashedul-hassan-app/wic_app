import { format, parseISO } from "date-fns"

import type { AlertEvent } from "@/stores/useAlertStore"

const DATE_SCOPED_ID_PATTERN = /^\d{4}-\d{2}-\d{2}-/
const LEGACY_TIMESTAMP_SUFFIX_PATTERN = /@\d{10,}$/
const DEV_TIME_SUFFIX_PATTERN = /@\d{2}:\d{2}$/

function devTimeSuffix(scheduledTime?: string): string {
  if (!__DEV__ || !scheduledTime) return ""
  return `@${scheduledTime}`
}

export function prayerStartAlertId(date: string, prayerName: string, beginsTime?: string) {
  return `${date}-${prayerName}-start-now${devTimeSuffix(beginsTime)}`
}

export function jamaahWarningAlertId(date: string, prayerName: string, jamaahTime?: string) {
  return `${date}-${prayerName}-jamaah-10min${devTimeSuffix(jamaahTime)}`
}

export function jumuahReminderAlertId(date: string) {
  return `${date}-jumuah-reminder`
}

/** Strip legacy @timestamp suffixes only — keep dev @HH:mm slots distinct. */
export function alertScheduleKey(eventId: string) {
  return eventId.replace(LEGACY_TIMESTAMP_SUFFIX_PATTERN, "")
}

/** One row per prayer/type/slot — collapses legacy bare ids with dev @HH:mm ids. */
export function alertInstanceKey(event: AlertEvent): string {
  return alertInstanceKeyFromParts(event.id, event.time)
}

export function alertInstanceKeyFromParts(id: string, time: string): string {
  const scheduleId = alertScheduleKey(id)
  if (DEV_TIME_SUFFIX_PATTERN.test(scheduleId)) return scheduleId

  if (__DEV__ && time && time !== "00:00") {
    return `${scheduleId}@${time}`
  }

  return scheduleId
}

export function prayerNameFromAlertId(eventId: string): string | null {
  const match = alertScheduleKey(eventId).match(/^\d{4}-\d{2}-\d{2}-([a-z]+)-/)
  return match?.[1] ?? null
}

export function isJumuahReminderAlertId(eventId: string) {
  return alertScheduleKey(eventId).endsWith("-jumuah-reminder")
}

export function jumuahDateFromAlertId(eventId: string) {
  const match = alertScheduleKey(eventId).match(/^(\d{4}-\d{2}-\d{2})-jumuah-reminder$/)
  return match?.[1] ?? null
}

function eventDateFromEventAt(eventAt: string) {
  try {
    return format(parseISO(eventAt), "yyyy-MM-dd")
  } catch {
    return format(new Date(), "yyyy-MM-dd")
  }
}

export function normalizeAlertEvent(event: AlertEvent): AlertEvent {
  const id = alertScheduleKey(event.id)

  if (DATE_SCOPED_ID_PATTERN.test(id.replace(DEV_TIME_SUFFIX_PATTERN, ""))) {
    return { ...event, id }
  }

  const eventDate = eventDateFromEventAt(event.eventAt)

  return {
    ...event,
    id: `${eventDate}-${id}`,
  }
}

/** Collapse legacy duplicates; keep distinct dev @HH:mm slots. */
export function migratePersistedAlertEvents(events: AlertEvent[]): AlertEvent[] {
  const byKey = new Map<string, AlertEvent>()

  for (const event of events) {
    const normalized = normalizeAlertEvent(event)
    const key = alertInstanceKey(normalized)
    const existing = byKey.get(key)

    if (!existing || Date.parse(normalized.eventAt) > Date.parse(existing.eventAt)) {
      byKey.set(key, normalized)
    }
  }

  return Array.from(byKey.values())
}
