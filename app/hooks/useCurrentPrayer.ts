import { useEffect, useState } from "react"

import type { PrayerTime } from "@/models/prayer.types"

export interface CurrentPrayerInfo {
  prayer: PrayerTime
  /** Formatted countdown to next prayer, e.g. "4h 18m" */
  countdownLabel: string
  /** Exact minutes until next prayer (for alert scheduling) */
  minutesLeft: number
  nextPrayer: {
    prayer: PrayerTime
    countdownLabel: string
    minutesLeft: number
  }
  nextJamaah: {
    prayer: PrayerTime
    countdownLabel: string
    minutesLeft: number
  } | null
}

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

/** Minutes since midnight for a prayer's begins time, in real day order.
 *  If a later slot wraps past midnight (e.g. 00:31 after 23:01), add 24h so comparisons stay correct. */
function prayerBeginsMinutes(prayers: PrayerTime[], index: number): number {
  let min = toMinutes(prayers[index].begins)
  if (index === 0) return min

  const prev = prayerBeginsMinutes(prayers, index - 1)
  if (min < prev) min += 1440
  return min
}

/** Same as prayerBeginsMinutes, but for jamaah — keeps congregation times in order after midnight. */
function prayerJamaahMinutes(prayers: PrayerTime[], index: number): number | null {
  const jamaah = prayers[index].jamaah
  if (!jamaah) return null

  let min = toMinutes(jamaah)
  const beginsMin = prayerBeginsMinutes(prayers, index)
  if (min < beginsMin) min += 1440
  return min
}

function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function findNextJamaah(prayers: PrayerTime[], nowMin: number): CurrentPrayerInfo["nextJamaah"] {
  // Search same day first
  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i]
    const jamaahMin = prayerJamaahMinutes(prayers, i)
    if (jamaahMin === null) continue

    const minutesUntil = jamaahMin - nowMin
    if (minutesUntil > 0) {
      return {
        prayer,
        countdownLabel: formatCountdown(minutesUntil),
        minutesLeft: minutesUntil,
      }
    }
  }
  // All today's jamaah times have passed — find the first one tomorrow
  const firstWithJamaah = prayers.find((p) => p.jamaah !== null)
  if (!firstWithJamaah?.jamaah) return null

  const jamaahMin = toMinutes(firstWithJamaah.jamaah)
  const minutesUntilTomorrow = 1440 - nowMin + jamaahMin


  return {
    prayer: firstWithJamaah,
    countdownLabel: formatCountdown(minutesUntilTomorrow),
    minutesLeft: minutesUntilTomorrow,
  }
}

function compute(prayers: PrayerTime[], now: Date): CurrentPrayerInfo | null {
  if (!prayers.length) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const beginsMins = prayers.map((_, i) => prayerBeginsMinutes(prayers, i))

  // Find the last prayer whose begins time is ≤ now
  let idx = -1
  for (let i = 0; i < prayers.length; i++) {
    if (beginsMins[i] <= nowMin) idx = i
  }

  const nextJamaah = findNextJamaah(prayers, nowMin)

  if (idx === -1) {
    // Before Fajr — we're in yesterday's Isha window
    const fajrMin = beginsMins[0]
    const minutesUntilFajr = fajrMin - nowMin

    return {
      prayer: prayers[prayers.length - 1],
      countdownLabel: formatCountdown(minutesUntilFajr),
      nextPrayer: {
        prayer: prayers[0],
        countdownLabel: formatCountdown(minutesUntilFajr),
        minutesLeft: minutesUntilFajr,
      },
      nextJamaah,
      minutesLeft: minutesUntilFajr,
    }
  }

  const nextIdx = idx + 1
  const minutesUntilNext =
    nextIdx < prayers.length
      ? beginsMins[nextIdx] - nowMin
      : 1440 - nowMin + beginsMins[0] // wrap to tomorrow's Fajr

  const nextPrayer = nextIdx < prayers.length ? prayers[nextIdx] : prayers[0]

  return {
    prayer: prayers[idx],
    countdownLabel: formatCountdown(minutesUntilNext),
    nextPrayer: {
      prayer: nextPrayer,
      countdownLabel: formatCountdown(minutesUntilNext),
      minutesLeft: minutesUntilNext,
    },
    nextJamaah,
    minutesLeft: minutesUntilNext,
  }
}

export function useCurrentPrayer(prayers: PrayerTime[]): CurrentPrayerInfo | null {
  const [info, setInfo] = useState<CurrentPrayerInfo | null>(() => compute(prayers, new Date()))

  useEffect(() => {
    if (!prayers.length) return

    const update = () => setInfo(compute(prayers, new Date()))
    update()

    const tickMs = 1_000
    const id = setInterval(update, tickMs)
    return () => clearInterval(id)
  }, [prayers])

  return info
}
