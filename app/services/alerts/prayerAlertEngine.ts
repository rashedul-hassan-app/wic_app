import { format } from "date-fns"

import type { PrayerTime } from "@/models/prayer.types"
import {
  alertInstanceKey,
  alertInstanceKeyFromParts,
  jamaahWarningAlertId,
  jumuahReminderAlertId,
  prayerStartAlertId,
} from "@/services/notifications/alertEventIds"
import type { AlertEvent } from "@/stores/useAlertStore"
import { useAlertStore } from "@/stores/useAlertStore"

/**
 * Time-driven alert engine. Mirrors how the timetable derives its state purely from
 * `now` + the prayer schedule — completely independent of OS notifications.
 *
 * An alert is recorded the moment its scheduled time arrives WHILE the app is in use
 * (from when this session started onward), then persisted. Prayers whose time already
 * passed before the session began are never backfilled.
 */

const JAMAAH_WARNING_MINUTES = 10
/** Jumu'ah fires at Friday 00:00 — only watch during that first minute (no afternoon backfill). */
const JUMUAH_REMINDER_WINDOW_SEC = 60

let sessionWatch: { dayDate: string; watchedKeys: Set<string> } | null = null
const processedKeys = new Set<string>()

function toSeconds(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 3600 + m * 60
}

function nowSeconds(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

function toEventAt(time24h: string, date: Date): string {
  const [h, m] = time24h.split(":").map(Number)
  const eventAt = new Date(date)
  eventAt.setHours(h, m, 0, 0)
  return eventAt.toISOString()
}

export function hasAlert(eventId: string, time = ""): boolean {
  const targetKey = alertInstanceKeyFromParts(eventId, time)
  return useAlertStore.getState().events.some((item) => alertInstanceKey(item) === targetKey)
}

function addAlert(event: AlertEvent) {
  const key = alertInstanceKeyFromParts(event.id, event.time)

  if (processedKeys.has(key) || hasAlert(event.id, event.time)) {
    processedKeys.add(key)
    return
  }

  processedKeys.add(key)
  useAlertStore.getState().addEvents([{ ...event, read: false }])
}

/** Reset the per-launch baseline (used on a fresh dev session). */
export function resetPrayerAlertSession() {
  sessionWatch = null
  processedKeys.clear()
}

/** Capture which events are still upcoming at session start — only these may be recorded. */
export function initPrayerAlertSession(
  prayers: PrayerTime[],
  dayDate: string,
  now: Date = new Date(),
) {
  const todayDate = format(now, "yyyy-MM-dd")

  if (dayDate !== todayDate) {
    sessionWatch = null
    return
  }

  const watchedKeys = new Set<string>()
  const nowSec = nowSeconds(now)

  for (const prayer of prayers) {
    if (toSeconds(prayer.begins) > nowSec) {
      watchedKeys.add(
        alertInstanceKeyFromParts(
          prayerStartAlertId(dayDate, prayer.name, prayer.begins),
          prayer.begins,
        ),
      )
    }

    if (prayer.jamaah && toSeconds(prayer.jamaah) - JAMAAH_WARNING_MINUTES * 60 > nowSec) {
      watchedKeys.add(
        alertInstanceKeyFromParts(
          jamaahWarningAlertId(dayDate, prayer.name, prayer.jamaah),
          prayer.jamaah,
        ),
      )
    }
  }

  if (now.getDay() === 5 && nowSec <= JUMUAH_REMINDER_WINDOW_SEC) {
    watchedKeys.add(alertInstanceKeyFromParts(jumuahReminderAlertId(todayDate), "00:00"))
  }

  sessionWatch = { dayDate, watchedKeys }
}

function isWatched(eventId: string, time: string): boolean {
  if (!sessionWatch) return false
  return sessionWatch.watchedKeys.has(alertInstanceKeyFromParts(eventId, time))
}

/** Record any watched event whose time has arrived but isn't in the list yet. */
export function syncDuePrayerAlerts(
  prayers: PrayerTime[],
  dayDate: string,
  now: Date = new Date(),
) {
  if (!prayers.length || !dayDate) return

  const todayDate = format(now, "yyyy-MM-dd")
  if (dayDate !== todayDate) return

  const store = useAlertStore.getState()
  const nowSec = nowSeconds(now)

  if (store.jumuahLastShown && store.jumuahLastShown !== todayDate) {
    store.setJumuahLastShown(null)
  }

  if (now.getDay() === 5) {
    const jumuahId = jumuahReminderAlertId(todayDate)

    if (
      isWatched(jumuahId, "00:00") &&
      !hasAlert(jumuahId) &&
      store.jumuahLastShown !== todayDate
    ) {
      addAlert({
        id: jumuahId,
        title: "Jumu'ah reminder — Friday has begun",
        time: "00:00",
        eventAt: now.toISOString(),
      })
      store.setJumuahLastShown(todayDate)
    }
  }

  for (const prayer of prayers) {
    const startId = prayerStartAlertId(dayDate, prayer.name, prayer.begins)

    if (isWatched(startId, prayer.begins) && toSeconds(prayer.begins) <= nowSec) {
      addAlert({
        id: startId,
        title: `${prayer.label} has started`,
        time: prayer.begins,
        eventAt: toEventAt(prayer.begins, now),
      })
    }

    if (prayer.jamaah) {
      const warningSec = toSeconds(prayer.jamaah) - JAMAAH_WARNING_MINUTES * 60
      const jamaahId = jamaahWarningAlertId(dayDate, prayer.name, prayer.jamaah)

      if (isWatched(jamaahId, prayer.jamaah) && nowSec >= warningSec) {
        addAlert({
          id: jamaahId,
          title: `${prayer.label} jamaah in ${JAMAAH_WARNING_MINUTES} mins`,
          time: prayer.jamaah,
          eventAt: toEventAt(prayer.jamaah, now),
        })
      }
    }
  }
}
