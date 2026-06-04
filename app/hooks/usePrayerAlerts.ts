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

function getTodayString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

export function usePrayerAlerts(current: CurrentPrayerInfo | null, prayers: PrayerTime[]) {
  const prevRef = useRef<CurrentPrayerInfo | null>(null)
  const initialized = useRef(false)

  const previousNowRef = useRef<number | null>(null)
  const previousDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!prayers.length) return

    const store = useAlertStore.getState()

    const now = new Date()
    const todayDate = getTodayString(now)
    const nowMin = now.getHours() * 60 + now.getMinutes()

    // =========================
    // 🟡 CLEANUP OLD JUMUAH FLAG
    // =========================
    if (store.jumuahLastShown && store.jumuahLastShown !== todayDate) {
      store.setJumuahLastShown(null)
    }

    // =========================
    // 🟢 JUMUAH (BOOT-TIME SAFE)
    // =========================
    const isFriday = now.getDay() === 5
    const alreadyShown = store.jumuahLastShown === todayDate

    if (isFriday && !alreadyShown) {
      store.addEvents([
        {
          id: "jumuah-reminder",
          title: "Jumu'ah reminder — Friday has begun",
          time: "00:00",
          eventAt: now.toISOString(),
        },
      ])

      store.setJumuahLastShown(todayDate)
    }

    const prevNowMin = previousNowRef.current
    const prev = prevRef.current

    const newEvents: AlertEvent[] = []

    // =========================
    // SKIP FIRST RUN (for reactive logic only)
    // =========================
    if (!initialized.current) {
      initialized.current = true
      prevRef.current = current
      previousNowRef.current = nowMin
      previousDateRef.current = todayDate
      return
    }

    // =========================
    // PRAYER START WARNINGS
    // =========================
    if (prevNowMin != null && current) {
      for (const prayer of prayers) {
        const prayerMin = toMinutes(prayer.begins)

        const prevDiff = prayerMin - prevNowMin
        const currDiff = prayerMin - nowMin

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
    const currJamaah = current?.nextJamaah

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