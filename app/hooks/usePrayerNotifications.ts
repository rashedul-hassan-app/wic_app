import { useCallback, useEffect, useRef, useState } from "react"
import { Platform } from "react-native"

import type { PrayerName, PrayerTime } from "@/models/prayer.types"
import { fireTestNotification, deliverNotification } from "@/services/notifications/fireTestNotification"
import {
  browserNotificationService,
  resetBrowserNotificationService,
} from "@/services/notifications/browserNotificationService"
import type { NotificationPermissionStatus } from "@/services/notifications/IBrowserNotificationService"
import {
  getInboxNotifications,
  getUnreadCount,
  markAllInboxRead,
  subscribeInboxChange,
  type InboxNotification,
} from "@/services/notifications/notificationInbox"
import {
  formatPrayerNotificationBody,
  loadNotifiedPrayers,
  saveNotifiedPrayers,
  toPrayerMinutes,
} from "@/utils/prayerTime"

export interface UsePrayerNotificationsOptions {
  prayers: PrayerTime[]
  /** ISO date, e.g. "2026-06-15" */
  date: string
  /** Only schedule notifications for today's timetable */
  enabled: boolean
}

export interface UsePrayerNotificationsResult {
  permission: NotificationPermissionStatus
  isEnabled: boolean
  unreadCount: number
  notifications: InboxNotification[]
  requestPermission: () => Promise<boolean>
  markAllAsRead: () => void
  fireTestNotification: (requestPermission?: boolean) => Promise<boolean>
}

function markPastPrayersAsNotified(prayers: PrayerTime[], nowMin: number, notified: Set<PrayerName>) {
  for (const prayer of prayers) {
    if (toPrayerMinutes(prayer.begins) <= nowMin) {
      notified.add(prayer.name)
    }
  }
}

function msUntilPrayerBegins(begins: string, now: Date): number {
  const prayerMin = toPrayerMinutes(begins)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const secondsPastMinute = now.getSeconds() * 1000 + now.getMilliseconds()

  if (prayerMin > nowMin) {
    return (prayerMin - nowMin) * 60_000 - secondsPastMinute
  }

  return 0
}

function consumeTestNotificationQuery(): boolean {
  if (typeof window === "undefined") return false

  const url = new URL(window.location.href)
  if (url.searchParams.get("testNotification") !== "1") return false

  url.searchParams.delete("testNotification")
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  return true
}

export function usePrayerNotifications({
  prayers,
  date,
  enabled,
}: UsePrayerNotificationsOptions): UsePrayerNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() =>
    browserNotificationService.getPermission(),
  )
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount())
  const [notifications, setNotifications] = useState<InboxNotification[]>(() =>
    getInboxNotifications(),
  )
  const notifiedRef = useRef<Set<PrayerName>>(new Set())

  const refreshInbox = useCallback(() => {
    setUnreadCount(getUnreadCount())
    setNotifications(getInboxNotifications())
  }, [])

  const requestPermission = useCallback(async () => {
    const result = await browserNotificationService.requestPermission()
    setPermission(result)
    return result === "granted"
  }, [])

  const markAllAsRead = useCallback(() => {
    markAllInboxRead()
    refreshInbox()
  }, [refreshInbox])

  const triggerTestNotification = useCallback(
    async (requestPermissionOnFire = false) => {
      const success = await fireTestNotification(requestPermissionOnFire)
      setPermission(browserNotificationService.getPermission())
      refreshInbox()
      return success
    },
    [refreshInbox],
  )

  useEffect(() => subscribeInboxChange(refreshInbox), [refreshInbox])

  useEffect(() => {
    if (Platform.OS !== "web") return
    resetBrowserNotificationService()
    setPermission(browserNotificationService.getPermission())
  }, [])

  useEffect(() => {
    if (!consumeTestNotificationQuery()) return
    void triggerTestNotification(false)
  }, [triggerTestNotification])

  useEffect(() => {
    if (typeof globalThis === "undefined") return
    globalThis.__wicFireTestNotification = () => triggerTestNotification(true)
    return () => {
      delete globalThis.__wicFireTestNotification
    }
  }, [triggerTestNotification])

  useEffect(() => {
    if (!enabled || !prayers.length) return

    const now = new Date()
    const notified = loadNotifiedPrayers(date)
    markPastPrayersAsNotified(prayers, now.getHours() * 60 + now.getMinutes(), notified)
    saveNotifiedPrayers(date, notified)
    notifiedRef.current = notified

    const timeouts: ReturnType<typeof setTimeout>[] = []

    const notifyPrayer = (prayer: PrayerTime) => {
      if (notifiedRef.current.has(prayer.name)) return

      const body = formatPrayerNotificationBody(prayer)
      deliverNotification("WIC Prayer App", body, prayer.name)
      notifiedRef.current.add(prayer.name)
      saveNotifiedPrayers(date, notifiedRef.current)
      refreshInbox()
    }

    for (const prayer of prayers) {
      if (notifiedRef.current.has(prayer.name)) continue

      const delayMs = msUntilPrayerBegins(prayer.begins, now)
      if (delayMs <= 0) continue

      timeouts.push(setTimeout(() => notifyPrayer(prayer), delayMs))
    }

    return () => timeouts.forEach(clearTimeout)
  }, [prayers, date, enabled, refreshInbox])

  return {
    permission,
    isEnabled: permission === "granted",
    unreadCount,
    notifications,
    requestPermission,
    markAllAsRead,
    fireTestNotification: triggerTestNotification,
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __wicFireTestNotification: (() => Promise<boolean>) | undefined
}
