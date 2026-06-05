import { useEffect, useMemo, useRef } from "react"
import { AppState } from "react-native"
import { format } from "date-fns"

import { useCurrentPrayer } from "@/hooks/useCurrentPrayer"
import { usePrayerAlertWatcher } from "@/hooks/usePrayerAlertWatcher"
import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import {
  initPrayerAlertSession,
  resetPrayerAlertSession,
  syncDuePrayerAlerts,
} from "@/services/alerts/prayerAlertEngine"
import {
  initializeNotifications,
  setupNotificationListeners,
  syncBadgeCount,
} from "@/services/notifications/notificationService"
import { reschedulePrayerNotifications } from "@/services/notifications/prayerNotificationScheduler"
import {
  DEV_PRAYER_MOCK_ENABLED,
  resetDevMockPrayerCache,
} from "@/services/prayer/mockPrayerService"
import { useAlertStore } from "@/stores/useAlertStore"

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

let alertSessionBootstrapped = false
let devMockSessionBootstrapped = false

export function usePrayerNotifications() {
  const bootstrapped = useRef(false)

  if (!bootstrapped.current && !alertSessionBootstrapped) {
    bootstrapped.current = true
    alertSessionBootstrapped = true
    resetPrayerAlertSession()
  }

  if (DEV_PRAYER_MOCK_ENABLED && !devMockSessionBootstrapped) {
    devMockSessionBootstrapped = true
    resetDevMockPrayerCache()
  }

  const { data: todayPrayerTimes } = usePrayerTimes(todayISO())
  const currentPrayer = useCurrentPrayer(todayPrayerTimes?.prayers ?? [])
  const events = useAlertStore((state) => state.events)

  const scheduleToken = useMemo(() => {
    if (!todayPrayerTimes) return null

    const maghrib = todayPrayerTimes.prayers.find((prayer) => prayer.name === "maghrib")
    return DEV_PRAYER_MOCK_ENABLED
      ? `${todayPrayerTimes.date}:${maghrib?.begins}:${maghrib?.jamaah}`
      : todayPrayerTimes.date
  }, [todayPrayerTimes])

  usePrayerAlertWatcher(
    currentPrayer,
    todayPrayerTimes?.prayers ?? [],
    todayPrayerTimes?.date ?? todayISO(),
  )

  useEffect(() => {
    if (!todayPrayerTimes?.prayers.length || !todayPrayerTimes.date || !scheduleToken) return

    initPrayerAlertSession(todayPrayerTimes.prayers, todayPrayerTimes.date)
    syncDuePrayerAlerts(todayPrayerTimes.prayers, todayPrayerTimes.date)
    // Keyed on scheduleToken so the session baseline only resets when the schedule changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleToken])

  // Catch up in-app alerts and refresh OS schedule when returning from background.
  useEffect(() => {
    if (!todayPrayerTimes?.prayers.length || !todayPrayerTimes.date) return

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return

      syncDuePrayerAlerts(todayPrayerTimes.prayers, todayPrayerTimes.date)

      void initializeNotifications().then(async (granted) => {
        if (!granted) return
        await reschedulePrayerNotifications(todayPrayerTimes)
      })
    })

    return () => subscription.remove()
  }, [todayPrayerTimes])

  useEffect(() => {
    let cancelled = false

    void initializeNotifications().then(async (granted) => {
      if (cancelled || !granted || !todayPrayerTimes || !scheduleToken) return

      await reschedulePrayerNotifications(todayPrayerTimes)
      if (cancelled) return

      void syncBadgeCount()
    })

    return () => {
      cancelled = true
    }
    // Reschedule OS notifications only when the schedule changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleToken])

  useEffect(() => {
    void syncBadgeCount()
  }, [events])

  useEffect(() => {
    return setupNotificationListeners()
  }, [])
}
