export type PrayerName = "fajr" | "sunrise" | "duha" | "dhuhr" | "asr" | "maghrib" | "isha"

export interface PrayerTime {
  name: PrayerName
  /** Display label, e.g. "Fajr", "Sunrise 🌅" */
  label: string
  /** 24h format, e.g. "03:47" */
  begins: string
  /** 24h format or null if no congregation time (e.g. Sunrise, Duha) */
  jamaah: string | null
}

export interface JumuahTime {
  id: string
  label: string
  /** 24h format */
  khutbah: string
  /** 24h format */
  jamaah: string
}

export interface DayPrayerTimes {
  /** ISO date string "2026-05-27" */
  date: string
  /** Ordered fajr → isha */
  prayers: PrayerTime[]
  /** Weekly Jumu'ah congregation times */
  jumuah: JumuahTime[]
  announcement: string | null
}
