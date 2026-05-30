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
