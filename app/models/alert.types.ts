export interface PrayerAlert {
  id: string
  title: string
  time: string
  read: boolean
  type: "prayer" | "jumuah"
}