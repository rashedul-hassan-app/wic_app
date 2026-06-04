import { format, parseISO } from "date-fns"

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