import { useEffect, useRef } from "react"
import type { CurrentPrayerInfo } from "./useCurrentPrayer"
import type { PrayerTime } from "@/models/prayer.types"
import { useAlertStore } from "@/stores/useAlertStore"

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

export function usePrayerAlerts(
  current: CurrentPrayerInfo | null,
  prayers: PrayerTime[]
) {
  const prevRef = useRef<CurrentPrayerInfo | null>(null)

  // 🔥 prevent firing on first mount
  const initialized = useRef(false)

  useEffect(() => {
    if (!current || !prayers.length) return

    const prev = prevRef.current
    const store = useAlertStore.getState()

    const newEvents: any[] = []

    // =========================
    // 0. SKIP FIRST RUN COMPLETELY
    // =========================
    if (!initialized.current) {
      initialized.current = true
      prevRef.current = current
      return
    }

    // =========================
    // 1. PRAYER CHANGE ONLY
    // =========================
    if (prev && prev.prayer.name !== current.prayer.name) {
      newEvents.push({
        id: `${current.prayer.name}-start`,
        title: `${current.prayer.label} has started`,
        time: current.prayer.begins,
      })
    }

    // =========================
    // 2. JAMAAH EVENTS (SAFE)
    // =========================
    const currJ = current.nextJamaah
    const prevJ = prev?.nextJamaah

    if (currJ?.minutesLeft != null) {
      if (prevJ?.minutesLeft != null) {
        // 10 min threshold CROSSING ONLY
        if (prevJ.minutesLeft > 10 && currJ.minutesLeft <= 10) {
          newEvents.push({
            id: `${currJ.prayer.name}-jamaah-10min`,
            title: `${currJ.prayer.label} jamaah in 10 mins`,
            time: currJ.prayer.jamaah!,
          })
        }

        // NOW ONLY ON CROSSING
        if (prevJ.minutesLeft > 0 && currJ.minutesLeft <= 0) {
          newEvents.push({
            id: `${currJ.prayer.name}-jamaah-now`,
            title: `${currJ.prayer.label} jamaah now`,
            time: currJ.prayer.jamaah!,
          })
        }
      }
    }

    // =========================
    // 3. PRAYER START (10 MIN + NOW)
    // =========================
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes()

    for (const p of prayers) {
      const diff = toMinutes(p.begins) - nowMin
      const prevDiff = prev
        ? toMinutes(p.begins) -
          (prev.prayer ? toMinutes(prev.prayer.begins) : nowMin)
        : null

      // 10 min warning (crossing only)
      if (prevDiff != null && prevDiff > 10 && diff <= 10 && diff > 0) {
        newEvents.push({
          id: `${p.name}-start-10min`,
          title: `${p.label} starts in 10 mins`,
          time: p.begins,
        })
      }

      // START NOW (crossing only)
    //   if (prevDiff != null && prevDiff > 0 && diff <= 0) {
    //     newEvents.push({
    //       id: `${p.name}-start-now`,
    //       title: `${p.label} has started`,
    //       time: p.begins,
    //     })
    //   }
    }

    // =========================
    // PUSH EVENTS (DEDUP INSIDE STORE)
    // =========================
    if (newEvents.length) {
      store.addEvents(newEvents)
    }

    prevRef.current = current
  }, [current, prayers])
}