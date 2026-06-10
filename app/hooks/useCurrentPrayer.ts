import { useEffect, useState } from "react"

import type { PrayerTime } from "@/models/prayer.types"
import {
  nowOrderedMinutes,
  prayerBeginsMinutes,
  prayerJamaahMinutes,
  prayerTimeToMinutes,
} from "@/utils/prayerTime"

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

function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function findNextJamaah(prayers: PrayerTime[], nowMin: number): CurrentPrayerInfo["nextJamaah"] {
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

  const firstWithJamaah = prayers.find((p) => p.jamaah !== null)
  if (!firstWithJamaah?.jamaah) return null

  const jamaahMin = prayerTimeToMinutes(firstWithJamaah.jamaah)
  const minutesUntilTomorrow = 1440 - nowMin + jamaahMin

  return {
    prayer: firstWithJamaah,
    countdownLabel: formatCountdown(minutesUntilTomorrow),
    minutesLeft: minutesUntilTomorrow,
  }
}

function compute(prayers: PrayerTime[], now: Date): CurrentPrayerInfo | null {
  if (!prayers.length) return null

  const nowMin = nowOrderedMinutes(prayers, now)
  const beginsMins = prayers.map((_, i) => prayerBeginsMinutes(prayers, i))

  let idx = -1
  for (let i = 0; i < prayers.length; i++) {
    if (beginsMins[i] <= nowMin) idx = i
  }

  const nextJamaah = findNextJamaah(prayers, nowMin)

  if (idx === -1) {
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
      : 1440 - nowMin + beginsMins[0]

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
