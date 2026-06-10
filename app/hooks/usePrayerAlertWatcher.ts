import { useEffect } from "react"

import type { PrayerTime } from "@/models/prayer.types"
import { syncDuePrayerAlerts } from "@/services/alerts/prayerAlertEngine"

import type { CurrentPrayerInfo } from "./useCurrentPrayer"

/** Tick-driven in-app alerts — independent of OS notification delivery. */
export function usePrayerAlertWatcher(
  current: CurrentPrayerInfo | null,
  prayers: PrayerTime[],
  dayDate: string,
) {
  useEffect(() => {
    if (!prayers.length || !dayDate) return

    syncDuePrayerAlerts(prayers, dayDate)
  }, [current, prayers, dayDate])
}
