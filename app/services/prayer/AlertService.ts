import type { PrayerAlert } from "@/models/alert.types"
import type { DayPrayerTimes } from "@/models/prayer.types"

import type { IPrayerService } from "./IPrayerService"
import { mockPrayerService } from "./mockPrayerService"

export class AlertService {
  constructor(private prayerService: IPrayerService) {}

  async getAlerts(date: string): Promise<PrayerAlert[]> {
    const data = await this.prayerService.getPrayerTimes(date)
    return AlertService.buildAlerts(data)
  }

  static buildAlerts(data: DayPrayerTimes): PrayerAlert[] {
    const alerts: PrayerAlert[] = []

    data.prayers.forEach((prayer) => {
      if (!prayer.jamaah) return

      alerts.push({
        id: `${prayer.name}-jamaah`,
        title: `${prayer.label} jamaah in 10 mins`,
        time: prayer.jamaah,
        read: false,
        type: "prayer",
      })
    })

    data.jumuah.forEach((jumuah) => {
      alerts.push({
        id: jumuah.id,
        title: `${jumuah.label} reminder`,
        time: jumuah.jamaah,
        read: false,
        type: "jumuah",
      })
    })

    return alerts
  }
}

export const alertService = new AlertService(mockPrayerService)
