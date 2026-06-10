import { useCallback, useEffect, useState } from "react"

import type { DayPrayerTimes } from "@/models/prayer.types"
import { mockPrayerService, subscribeVenusRestart } from "@/services/prayer/mockPrayerService"

export interface UsePrayerTimesResult {
  data: DayPrayerTimes | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

export function usePrayerTimes(date: string): UsePrayerTimesResult {
  const [data, setData] = useState<DayPrayerTimes | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mockPrayerService.getPrayerTimes(date)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => subscribeVenusRestart(fetch), [fetch])

  return { data, isLoading, error, refresh: fetch }
}
