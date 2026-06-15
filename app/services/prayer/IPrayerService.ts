import type { DayPrayerTimes } from "@/models/prayer.types"

export interface IPrayerService {
  getPrayerTimes(date: string): Promise<DayPrayerTimes>
}
