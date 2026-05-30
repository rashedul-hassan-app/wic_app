import { useEffect, useState } from "react"

import type { PrayerTime } from "@/models/prayer.types"

export interface CurrentPrayerInfo {
  prayer: PrayerTime
  /** Formatted countdown to next prayer, e.g. "4h 18m" */
  countdownLabel: string
  nextJamaah: {
    prayer: PrayerTime
    countdownLabel: string
  } | null
}

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function findNextJamaah(
  prayers: PrayerTime[],
  nowMin: number,
): CurrentPrayerInfo["nextJamaah"] {
  // Search same day first
  for (const prayer of prayers) {
    if (!prayer.jamaah) continue
    const jamaahMin = toMinutes(prayer.jamaah)
    if (jamaahMin > nowMin) {
      return {
        prayer,
        countdownLabel: formatCountdown(jamaahMin - nowMin),
      }
    }
  }
  // All today's jamaah times have passed — find the first one tomorrow
  const firstWithJamaah = prayers.find((p) => p.jamaah !== null)
  if (!firstWithJamaah?.jamaah) return null

  const jamaahMin = toMinutes(firstWithJamaah.jamaah)
  return {
    prayer: firstWithJamaah,
    countdownLabel: formatCountdown(1440 - nowMin + jamaahMin),
  }
}

function compute(prayers: PrayerTime[], now: Date): CurrentPrayerInfo | null {
  if (!prayers.length) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()

  // Find the last prayer whose begins time is ≤ now
  let idx = -1
  for (let i = 0; i < prayers.length; i++) {
    if (toMinutes(prayers[i].begins) <= nowMin) idx = i
  }

  const nextJamaah = findNextJamaah(prayers, nowMin)

  if (idx === -1) {
    // Before Fajr — we're in yesterday's Isha window
    const fajrMin = toMinutes(prayers[0].begins)
    return {
      prayer: prayers[prayers.length - 1],
      countdownLabel: formatCountdown(fajrMin - nowMin),
      nextJamaah,
    }
  }

  const nextIdx = idx + 1
  const minutesUntilNext =
    nextIdx < prayers.length
      ? toMinutes(prayers[nextIdx].begins) - nowMin
      : 1440 - nowMin + toMinutes(prayers[0].begins) // wrap to tomorrow's Fajr

  return {
    prayer: prayers[idx],
    countdownLabel: formatCountdown(minutesUntilNext),
    nextJamaah,
  }
}

export function useCurrentPrayer(prayers: PrayerTime[]): CurrentPrayerInfo | null {
  const [info, setInfo] = useState<CurrentPrayerInfo | null>(() =>
    compute(prayers, new Date()),
  )

  useEffect(() => {
    if (!prayers.length) return

    const update = () => setInfo(compute(prayers, new Date()))
    update()

    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [prayers])

  return info
}
