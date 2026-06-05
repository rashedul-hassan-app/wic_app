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
import {
  eventAtForTimetableTime,
  nowOrderedMinutes,
  prayerBeginsMinutes,
  prayerJamaahMinutes,
} from "@/utils/prayerTime"

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

function nowSeconds(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
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
  const nowMin = nowOrderedMinutes(prayers, now)

  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i]

    if (prayerBeginsMinutes(prayers, i) > nowMin) {
      watchedKeys.add(
        alertInstanceKeyFromParts(
          prayerStartAlertId(dayDate, prayer.name, prayer.begins),
          prayer.begins,
        ),
      )
    }

    const jamaahMin = prayerJamaahMinutes(prayers, i)
    if (jamaahMin !== null && jamaahMin > nowMin) {
      watchedKeys.add(
        alertInstanceKeyFromParts(
          jamaahWarningAlertId(dayDate, prayer.name, prayer.jamaah!),
          prayer.jamaah!,
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
  const nowMin = nowOrderedMinutes(prayers, now, true)

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

  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i]
    const startId = prayerStartAlertId(dayDate, prayer.name, prayer.begins)
    const beginsMin = prayerBeginsMinutes(prayers, i)

    if (isWatched(startId, prayer.begins) && nowMin >= beginsMin) {
      addAlert({
        id: startId,
        title: `${prayer.label} has started`,
        time: prayer.begins,
        eventAt: eventAtForTimetableTime(prayer.begins, now),
      })
    }

    const jamaahMin = prayerJamaahMinutes(prayers, i)
    if (jamaahMin !== null && prayer.jamaah) {
      const warningMin = jamaahMin - JAMAAH_WARNING_MINUTES
      const jamaahId = jamaahWarningAlertId(dayDate, prayer.name, prayer.jamaah)

      if (isWatched(jamaahId, prayer.jamaah) && nowMin >= warningMin) {
        addAlert({
          id: jamaahId,
          title: `${prayer.label} jamaah in ${JAMAAH_WARNING_MINUTES} mins`,
          time: prayer.jamaah,
          eventAt: eventAtForTimetableTime(prayer.jamaah, now),
        })
      }
    }
  }
}
