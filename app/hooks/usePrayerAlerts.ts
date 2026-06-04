import { useEffect, useRef } from "react"

import type { CurrentPrayerInfo } from "./useCurrentPrayer"
import type { PrayerTime } from "@/models/prayer.types"
import { AlertEvent, useAlertStore } from "@/stores/useAlertStore"

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

function toEventAt(time24h: string, date: Date): string {
  const [h, m] = time24h.split(":").map(Number)
  const eventAt = new Date(date)
  eventAt.setHours(h, m, 0, 0)
  return eventAt.toISOString()
}

export function usePrayerAlerts(current: CurrentPrayerInfo | null, prayers: PrayerTime[]) {
  const prevRef = useRef<CurrentPrayerInfo | null>(null)
  const initialized = useRef(false)

  // Track actual clock time between updates
  const previousNowRef = useRef<number | null>(null)
  const previousDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!current || !prayers.length) return

    const now = new Date()
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const nowMin = now.getHours() * 60 + now.getMinutes()

    const prevNowMin = previousNowRef.current
    const prevDate = previousDateRef.current

    const prev = prevRef.current
    const store = useAlertStore.getState()

    const newEvents: AlertEvent[] = []

    // =========================
    // SKIP FIRST RUN
    // =========================
    if (!initialized.current) {
      initialized.current = true
      prevRef.current = current
      previousNowRef.current = nowMin
      previousDateRef.current = todayDate
      return
    }
    // =========================
    // CHECK WHETHER IT'S JUMUAH TODAY
    // =========================
    const isFriday = now.getDay() === 5
    if (isFriday && prevDate && prevDate !== todayDate) {
      newEvents.push({
        id: "jumuah-reminder",
        title: "Jumu'ah reminder — Friday has begun",
        time: "00:00",
        eventAt: toEventAt("00:00", now),
      })
    }

    // =========================
    // PRAYER START WARNINGS
    // =========================
    if (prevNowMin != null) {
      for (const prayer of prayers) {
        const prayerMin = toMinutes(prayer.begins)

        const prevDiff = prayerMin - prevNowMin
        const currDiff = prayerMin - nowMin

        // 10 min warning
        if (prevDiff > 10 && currDiff <= 10 && currDiff > 0) {
          newEvents.push({
            id: `${prayer.name}-start-10min`,
            title: `${prayer.label} starts in 10 mins`,
            time: prayer.begins,
            eventAt: toEventAt(prayer.begins, now),
          })
        }

        // Prayer started now
        if (prevDiff > 0 && currDiff <= 0) {
          newEvents.push({
            id: `${prayer.name}-start-now`,
            title: `${prayer.label} has started`,
            time: prayer.begins,
            eventAt: toEventAt(prayer.begins, now),
          })
        }
      }
    }

    // =========================
    // JAMAAH ALERTS
    // =========================
    const prevJamaah = prev?.nextJamaah
    const currJamaah = current.nextJamaah

    // 10 minute warning
    if (
      prevJamaah &&
      currJamaah &&
      prevJamaah.prayer.name === currJamaah.prayer.name &&
      prevJamaah.minutesLeft > 10 &&
      currJamaah.minutesLeft <= 10
    ) {
      newEvents.push({
        id: `${currJamaah.prayer.name}-jamaah-10min`,
        title: `${currJamaah.prayer.label} jamaah in 10 mins`,
        time: currJamaah.prayer.jamaah!,
        eventAt: toEventAt(currJamaah.prayer.jamaah!, now),
      })
    }

    // Jamaah NOW
    if (
      prevJamaah &&
      prevJamaah.minutesLeft <= 1 &&
      (!currJamaah || currJamaah.prayer.name !== prevJamaah.prayer.name)
    ) {
      newEvents.push({
        id: `${prevJamaah.prayer.name}-jamaah-now`,
        title: `${prevJamaah.prayer.label} jamaah now`,
        time: prevJamaah.prayer.jamaah!,
        eventAt: toEventAt(prevJamaah.prayer.jamaah!, now),
      })
    }

    // =========================
    // SAVE EVENTS
    // =========================
    if (newEvents.length) {
      store.addEvents(newEvents)
    }

    prevRef.current = current
    previousNowRef.current = nowMin
    previousDateRef.current = todayDate
  }, [current, prayers])
}
