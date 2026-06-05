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
import { resetDevMockPrayerCache } from "@/services/prayer/mockPrayerService"
import { useAlertStore } from "@/stores/useAlertStore"

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

let devMockSessionBootstrapped = false

export function usePrayerNotifications() {
  const bootstrapped = useRef(false)

  if (__DEV__ && !bootstrapped.current && !devMockSessionBootstrapped) {
    bootstrapped.current = true
    devMockSessionBootstrapped = true
    resetDevMockPrayerCache()
    resetPrayerAlertSession()
  }

  const { data: todayPrayerTimes } = usePrayerTimes(todayISO())
  const currentPrayer = useCurrentPrayer(todayPrayerTimes?.prayers ?? [])
  const events = useAlertStore((state) => state.events)

  const scheduleToken = useMemo(() => {
    if (!todayPrayerTimes) return null

    const maghrib = todayPrayerTimes.prayers.find((prayer) => prayer.name === "maghrib")
    return __DEV__
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

  // Catch up immediately when returning to the app (timers are suspended in background).
  useEffect(() => {
    if (!todayPrayerTimes?.prayers.length || !todayPrayerTimes.date) return

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncDuePrayerAlerts(todayPrayerTimes.prayers, todayPrayerTimes.date)
      }
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
