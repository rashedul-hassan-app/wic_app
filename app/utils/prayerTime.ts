import { format, parseISO } from "date-fns"

import type { PrayerTime } from "@/models/prayer.types"

/**
 * Converts a 24h time string to a compact 12h display string.
 * "03:47" → "3:47",  "17:16" → "5:16",  "13:30" → "1:30"
 */
export function formatPrayerTime(time24h: string): string {
  const [h, m] = time24h.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return format(d, "h:mm")
}

/** "17:16" → "5:16 pm" */
export function formatPrayerTime12h(time24h: string): string {
  const [h, m] = time24h.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return format(d, "h:mm a").toLowerCase()
}

/**
 * Returns the display date header string.
 * "2026-05-27" → "WED • 27 MAY 2026"
 */
export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), "EEE • dd MMM yyyy").toUpperCase()
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

export function toDateFromHHMM(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}
export function toDate(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export function getCurrentTimeHHMM(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, "0")
  const m = String(now.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function prayerTimeToMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

/** Minutes since midnight for begins, in real day order (handles post-midnight slots). */
export function prayerBeginsMinutes(prayers: PrayerTime[], index: number): number {
  let min = prayerTimeToMinutes(prayers[index].begins)
  if (index === 0) return min

  const prev = prayerBeginsMinutes(prayers, index - 1)
  if (min < prev) min += 1440
  return min
}

export function prayerJamaahMinutes(prayers: PrayerTime[], index: number): number | null {
  const jamaah = prayers[index].jamaah
  if (!jamaah) return null

  let min = prayerTimeToMinutes(jamaah)
  const beginsMin = prayerBeginsMinutes(prayers, index)
  if (min < beginsMin) min += 1440
  return min
}

/** ISO timestamp for a timetable HH:mm on today's row (handles post-midnight slots). */
export function eventAtForTimetableTime(
  time24h: string,
  now: Date,
  prayers?: PrayerTime[],
): string {
  const [hour, minute] = time24h.split(":").map(Number)

  const eventAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  )

  if (prayers?.length) {
    for (let i = 0; i < prayers.length; i++) {
      if (prayers[i].begins === time24h) {
        if (prayerBeginsMinutes(prayers, i) >= 1440) eventAt.setDate(eventAt.getDate() + 1)
        return eventAt.toISOString()
      }

      if (prayers[i].jamaah === time24h) {
        const jamaahMin = prayerJamaahMinutes(prayers, i)
        if (jamaahMin !== null && jamaahMin >= 1440) eventAt.setDate(eventAt.getDate() + 1)
        return eventAt.toISOString()
      }
    }
  }

  const slotMin = hour * 60 + minute
  const nowClock = now.getHours() * 60 + now.getMinutes()

  // Post-midnight slot on today's row while it's still the evening
  if (nowClock > 12 * 60 && slotMin < 12 * 60) {
    eventAt.setDate(eventAt.getDate() + 1)
  }

  return eventAt.toISOString()
}

/** True when a begins/jamaah slot on today's timetable row has passed (ordered timeline). */
export function isTimetableSlotPassed(
  prayers: PrayerTime[],
  time24h: string,
  now: Date = new Date(),
): boolean {
  if (!prayers.length || time24h === "00:00") return false

  const nowMin = nowOrderedMinutes(prayers, now, true)

  for (let i = 0; i < prayers.length; i++) {
    if (prayers[i].begins === time24h) {
      return nowMin >= prayerBeginsMinutes(prayers, i)
    }

    if (prayers[i].jamaah === time24h) {
      const jamaahMin = prayerJamaahMinutes(prayers, i)
      return jamaahMin !== null && nowMin >= jamaahMin
    }
  }

  return false
}

/** Fallback when today's timetable is unavailable — wall-clock compare on today's date. */
export function isTimetableSlotDue(time24h: string, nowMs = Date.now()): boolean {
  if (time24h === "00:00") return false

  const now = new Date(nowMs)
  const [hour, minute] = time24h.split(":").map(Number)
  const slotMin = hour * 60 + minute
  const nowClock = now.getHours() * 60 + now.getMinutes()

  const slotAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  )

  // Post-midnight slot on today's row while it's still the evening
  if (nowClock > 12 * 60 && slotMin < 12 * 60) {
    return false
  }

  return nowMs >= slotAt.getTime()
}

export function nowOrderedMinutes(
  prayers: PrayerTime[],
  now: Date,
  includeSeconds = false,
): number {
  const clockMin =
    now.getHours() * 60 + now.getMinutes() + (includeSeconds ? now.getSeconds() / 60 : 0)

  if (!prayers.length) return clockMin

  const beginsMins = prayers.map((_, i) => prayerBeginsMinutes(prayers, i))
  const hasPostMidnight = beginsMins.some((min) => min >= 1440)

  if (hasPostMidnight && now.getHours() * 60 + now.getMinutes() < prayerTimeToMinutes(prayers[0].begins)) {
    return clockMin + 1440
  }

  return clockMin
}
