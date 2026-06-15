import { format, parseISO } from "date-fns"

import type { PrayerName, PrayerTime } from "@/models/prayer.types"

const NOTIFIED_PRAYERS_KEY = "prayerNotifications.notified"

/**
 * Converts a 24h time string to minutes since midnight.
 */
export function toPrayerMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

/**
 * Display name for prayer notifications, e.g. "Sunrise" (no emoji).
 */
export function getPrayerNotificationName(prayer: PrayerTime): string {
  return prayer.label.replace(/[\s\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim()
}

/**
 * Notification body shown when a prayer time begins.
 */
export function formatPrayerNotificationBody(prayer: PrayerTime): string {
  return `This is ${getPrayerNotificationName(prayer)} time`
}

export function notifiedPrayersStorageKey(date: string): string {
  return `${NOTIFIED_PRAYERS_KEY}.${date}`
}

export function loadNotifiedPrayers(date: string): Set<PrayerName> {
  try {
    const raw = globalThis.localStorage?.getItem(notifiedPrayersStorageKey(date))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as PrayerName[])
  } catch {
    return new Set()
  }
}

export function saveNotifiedPrayers(date: string, notified: Set<PrayerName>): void {
  try {
    globalThis.localStorage?.setItem(
      notifiedPrayersStorageKey(date),
      JSON.stringify([...notified]),
    )
  } catch {
    // ignore write failures
  }
}

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
