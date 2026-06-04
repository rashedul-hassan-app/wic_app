export type PrayerAlertType =
  | "PRAYER_10_MIN"
  | "PRAYER_START"
  | "JAMAAH"
  | "JUMUAH"
  | "CURRENT_PRAYER"

export interface PrayerAlert {
  id: string
  type: PrayerAlertType
  title: string
  createdAt: string
  read: boolean
}