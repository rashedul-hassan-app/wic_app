import { parseISO, subMinutes } from "date-fns"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import type { DayPrayerTimes, PrayerTime } from "@/models/prayer.types"
import type { AlertEvent } from "@/stores/useAlertStore"

import {
  jamaahWarningAlertId,
  jumuahReminderAlertId,
  prayerStartAlertId,
} from "./alertEventIds"
import { ensureAndroidExactAlarms, initializeNotifications } from "./notificationService"
import { PRAYER_NOTIFICATION_PREFIX, type PrayerNotificationData } from "./notificationTypes"

const ANDROID_CHANNEL_ID = "prayer-alerts"

/** Legacy schedule ids from before date-scoped keys — cancel explicitly on iOS. */
const LEGACY_SCHEDULE_SUFFIXES = [
  "jumuah-reminder",
  "fajr-start-now",
  "sunrise-start-now",
  "duha-start-now",
  "dhuhr-start-now",
  "asr-start-now",
  "maghrib-start-now",
  "isha-start-now",
  "fajr-jamaah-10min",
  "dhuhr-jamaah-10min",
  "asr-jamaah-10min",
  "maghrib-jamaah-10min",
  "isha-jamaah-10min",
]

let rescheduleChain: Promise<void> = Promise.resolve()

function dateAtTime(isoDate: string, time24h: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [hour, minute] = time24h.split(":").map(Number)
  // Use local calendar components — parseISO(date-only) is UTC and can shift the day.
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

function notificationBody(time: string, title: string): string {
  if (time === "00:00") return title
  return `At ${time}`
}

export function buildNotificationContent(event: AlertEvent) {
  const data: PrayerNotificationData = {
    eventId: event.id,
    title: event.title,
    time: event.time,
    eventAt: event.eventAt,
  }

  return {
    title: event.title,
    body: notificationBody(event.time, event.title),
    data,
    // iOS accepts "default"; Android needs boolean true for the system sound.
    sound: Platform.OS === "android" ? true : "default",
    ...(Platform.OS === "android"
      ? {
          channelId: ANDROID_CHANNEL_ID,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }
      : {}),
  }
}

async function scheduleEvent(event: AlertEvent, triggerAt: Date) {
  await Notifications.scheduleNotificationAsync({
    identifier: `${PRAYER_NOTIFICATION_PREFIX}${event.id}`,
    content: buildNotificationContent(event),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  })
}

/** Future prayer alerts for today — used by the Alerts screen Upcoming section. */
export function getUpcomingAlertEvents(day: DayPrayerTimes, now: Date = new Date()): AlertEvent[] {
  return buildSchedulableEvents(day, now).map(({ event }) => event)
}

function buildSchedulableEvents(day: DayPrayerTimes, now: Date): { event: AlertEvent; triggerAt: Date }[] {
  const scheduled: { event: AlertEvent; triggerAt: Date }[] = []
  const date = parseISO(day.date)
  const isFriday = date.getDay() === 5

  if (isFriday) {
    const fridayStart = dateAtTime(day.date, "00:00")
    if (fridayStart > now) {
      scheduled.push({
        event: {
          id: jumuahReminderAlertId(day.date),
          title: "Jumu'ah reminder — Friday has begun",
          time: "00:00",
          eventAt: fridayStart.toISOString(),
        },
        triggerAt: fridayStart,
      })
    }
  }

  for (const prayer of day.prayers) {
    scheduled.push(...buildPrayerEvents(day.date, prayer, now))
  }

  return scheduled
}

function buildPrayerEvents(isoDate: string, prayer: PrayerTime, now: Date) {
  const scheduled: { event: AlertEvent; triggerAt: Date }[] = []

  const startAt = dateAtTime(isoDate, prayer.begins)
  if (startAt > now) {
    scheduled.push({
      event: {
        id: prayerStartAlertId(isoDate, prayer.name, prayer.begins),
        title: `${prayer.label} has started`,
        time: prayer.begins,
        eventAt: startAt.toISOString(),
      },
      triggerAt: startAt,
    })
  }

  if (prayer.jamaah) {
    const jamaahAt = dateAtTime(isoDate, prayer.jamaah)
    const warningAt = subMinutes(jamaahAt, 10)

    if (warningAt > now) {
      scheduled.push({
        event: {
          id: jamaahWarningAlertId(isoDate, prayer.name, prayer.jamaah),
          title: `${prayer.label} jamaah in 10 mins`,
          time: prayer.jamaah,
          eventAt: warningAt.toISOString(),
        },
        triggerAt: warningAt,
      })
    }
  }

  return scheduled
}

export async function cancelPrayerNotifications() {
  if (Platform.OS === "web") return

  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const cancelIds = new Set<string>()

  for (const request of scheduled) {
    if (request.identifier?.startsWith(PRAYER_NOTIFICATION_PREFIX)) {
      cancelIds.add(request.identifier)
    }
  }

  for (const suffix of LEGACY_SCHEDULE_SUFFIXES) {
    cancelIds.add(`${PRAYER_NOTIFICATION_PREFIX}${suffix}`)
    cancelIds.add(`${PRAYER_NOTIFICATION_PREFIX}${suffix}-foreground`)
  }

  await Promise.all(
    Array.from(cancelIds).map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  )
}

async function reschedulePrayerNotificationsInternal(day: DayPrayerTimes) {
  if (Platform.OS === "web") return

  const granted = await initializeNotifications()
  if (!granted) {
    if (__DEV__) {
      console.warn("[notifications] POST_NOTIFICATIONS not granted — OS banners will not show.")
    }
    return
  }

  if (Platform.OS === "android") {
    await ensureAndroidExactAlarms()
  }

  await cancelPrayerNotifications()

  const now = new Date()
  const toSchedule = buildSchedulableEvents(day, now)

  for (const { event, triggerAt } of toSchedule) {
    await scheduleEvent(event, triggerAt)
  }

  if (__DEV__) {
    console.log(
      `[notifications] Scheduled ${toSchedule.length} OS notification(s) for ${day.date}.`,
      toSchedule.map(({ event, triggerAt }) => `${event.title} @ ${triggerAt.toLocaleString()}`),
    )
  }
}

export function reschedulePrayerNotifications(day: DayPrayerTimes) {
  rescheduleChain = rescheduleChain
    .catch(() => undefined)
    .then(() => reschedulePrayerNotificationsInternal(day))

  return rescheduleChain
}
