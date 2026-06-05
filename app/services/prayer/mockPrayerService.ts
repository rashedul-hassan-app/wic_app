import { differenceInCalendarDays, format, parseISO } from "date-fns"

import Config from "@/config"
import type { DayPrayerTimes, PrayerTime } from "@/models/prayer.types"

import type { IPrayerService } from "./IPrayerService"

// Authoritative base times for 2026-05-27 (WIC, London)
const BASE_DATE = "2026-05-27"

type BasePrayer = { begins: string; jamaah: string | null }
const BASE: Record<string, BasePrayer> = {
  fajr: { begins: "03:47", jamaah: "04:15" },
  sunrise: { begins: "04:54", jamaah: null },
  duha: { begins: "05:10", jamaah: null },
  dhuhr: { begins: "12:59", jamaah: "13:30" },
  asr: { begins: "17:16", jamaah: "19:00" },
  maghrib: { begins: "21:03", jamaah: "21:09" },
  isha: { begins: "22:11", jamaah: "22:30" },
}

function offsetFromNow(now: Date, deltaMinutes: number): string {
  const d = new Date(now)
  d.setMinutes(d.getMinutes() + deltaMinutes)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** Dev-only: Maghrib in 1 min, Maghrib jamaah in 11 min. */
function buildDevTestPrayerTimes(now: Date): PrayerTime[] {
  return [
    { name: "fajr", label: "Fajr", begins: offsetFromNow(now, -600), jamaah: offsetFromNow(now, -572) },
    { name: "sunrise", label: "Sunrise 🌅", begins: offsetFromNow(now, -580), jamaah: null },
    { name: "duha", label: "Duha ☀️", begins: offsetFromNow(now, -565), jamaah: null },
    { name: "dhuhr", label: "Dhuhr", begins: offsetFromNow(now, -240), jamaah: offsetFromNow(now, -209) },
    { name: "asr", label: "Asr", begins: offsetFromNow(now, -90), jamaah: offsetFromNow(now, -50) },
    { name: "maghrib", label: "Maghrib", begins: offsetFromNow(now, 1), jamaah: offsetFromNow(now, 11) },
    { name: "isha", label: "Isha", begins: offsetFromNow(now, 90), jamaah: offsetFromNow(now, 109) },
  ]
}

function shiftTime(time24h: string, deltaMinutes: number): string {
  const [h, m] = time24h.split(":").map(Number)
  const total = (((h * 60 + m + deltaMinutes) % 1440) + 1440) % 1440
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

let cachedDevDate: string | null = null
let cachedDevDayPrayerTimes: DayPrayerTimes | null = null

/** Fresh mock times each app launch so dev alerts can fire again at the new slot. */
export function resetDevMockPrayerCache() {
  cachedDevDate = null
  cachedDevDayPrayerTimes = null
}

class MockPrayerService implements IPrayerService {
  async getPrayerTimes(date: string): Promise<DayPrayerTimes> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return this.build(date)
  }

  private build(date: string): DayPrayerTimes {
    const today = format(new Date(), "yyyy-MM-dd")
    if (__DEV__ && Config.USE_DEV_PRAYER_MOCK && date === today) {
      if (cachedDevDate === today && cachedDevDayPrayerTimes) {
        return cachedDevDayPrayerTimes
      }

      const now = new Date()
      const maghribBegins = offsetFromNow(now, 1)
      const maghribJamaah = offsetFromNow(now, 11)

      cachedDevDate = today
      cachedDevDayPrayerTimes = {
        date,
        prayers: buildDevTestPrayerTimes(now),
        jumuah: [
          {
            id: "jumuah_1",
            label: "Jumu'ah 1",
            khutbah: offsetFromNow(now, 60),
            jamaah: offsetFromNow(now, 85),
          },
        ],
        announcement: `TEST · Maghrib ${maghribBegins} (1 min) · Jamaah ${maghribJamaah} (11 min)`,
      }

      return cachedDevDayPrayerTimes
    }

    const offset = differenceInCalendarDays(parseISO(date), parseISO(BASE_DATE))

    // London summer: Fajr gets ~1.5min earlier per day, Maghrib/Isha get later
    const fajrDelta = Math.round(-offset * 1.5)
    const maghribDelta = Math.round(offset * 0.8)
    const ishaDelta = Math.round(offset * 1.2)

    const prayers: PrayerTime[] = [
      {
        name: "fajr",
        label: "Fajr",
        begins: shiftTime(BASE.fajr.begins, fajrDelta),
        jamaah: "04:15",
      },
      {
        name: "sunrise",
        label: "Sunrise 🌅",
        begins: shiftTime(BASE.sunrise.begins, fajrDelta),
        jamaah: null,
      },
      {
        name: "duha",
        label: "Duha ☀️",
        begins: shiftTime(BASE.duha.begins, fajrDelta),
        jamaah: null,
      },
      {
        name: "dhuhr",
        label: "Dhuhr",
        begins: "12:59",
        jamaah: "13:30",
      },
      {
        name: "asr",
        label: "Asr",
        begins: "17:16",
        jamaah: "19:00",
      },
      {
        name: "maghrib",
        label: "Maghrib",
        begins: shiftTime(BASE.maghrib.begins, maghribDelta),
        jamaah: shiftTime(BASE.maghrib.jamaah!, maghribDelta),
      },
      {
        name: "isha",
        label: "Isha",
        begins: shiftTime(BASE.isha.begins, ishaDelta),
        jamaah: shiftTime(BASE.isha.jamaah!, ishaDelta),
      },
    ]

    return {
      date,
      prayers,
      jumuah: [
        {
          id: "jumuah_1",
          label: "Jumu'ah 1",
          khutbah: "13:15",
          jamaah: "13:40",
        },
      ],
      announcement: "Jumu'ah 1: Khutbah 1:15 pm • Salah 1:40 pm",
    }
  }
}

export const mockPrayerService = new MockPrayerService()
