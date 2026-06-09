import { differenceInCalendarDays, format, parseISO } from "date-fns"

import type { DayPrayerTimes, PrayerTime } from "@/models/prayer.types"
import { resetPrayerAlertSession } from "@/services/alerts/prayerAlertEngine"
import { syncBadgeCount } from "@/services/notifications/notificationService"
import { useAlertStore } from "@/stores/useAlertStore"
import { load, remove, save } from "@/utils/storage"

import type { IPrayerService } from "./IPrayerService"

/** Flip to true for Maghrib +1 min test timetable; false for real WIC times. */
export const DEV_PRAYER_MOCK_ENABLED = false

/** Dev: every launch, set Upcoming eventAt to 1 min ago (after sync) to test New → Recent. */
export const DEV_BACKDATE_UPCOMING_ALERTS = false

/**
 * Venus test: shift today's real timetable so upcoming prayers sit just ahead of now.
 * Anchored once per day (persisted) — survives app close. Flip false before release.
 */
export const VENUS_SHIFTED_TIMETABLE = true

const NORMAL_ANNOUNCEMENT = "Jumu'ah 1: Khutbah 1:15 pm • Salah 1:40 pm"

/** Bump when re-anchoring Venus for another test run. */
const VENUS_TIMETABLE_KEY = "VENUS_TIMETABLE_V7"

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

/** Venus offsets — Duha +2m, Dhuhr +4m / jamaah +12m, then +2m steps on begins. */
function buildVenusPrayerTimes(now: Date): PrayerTime[] {
  return [
    { name: "fajr", label: "Fajr", begins: offsetFromNow(now, -30), jamaah: offsetFromNow(now, -20) },
    { name: "sunrise", label: "Sunrise 🌅", begins: offsetFromNow(now, -28), jamaah: null },
    { name: "duha", label: "Duha ☀️", begins: offsetFromNow(now, 2), jamaah: null },
    { name: "dhuhr", label: "Dhuhr", begins: offsetFromNow(now, 4), jamaah: offsetFromNow(now, 12) },
    { name: "asr", label: "Asr", begins: offsetFromNow(now, 6), jamaah: offsetFromNow(now, 16) },
    { name: "maghrib", label: "Maghrib", begins: offsetFromNow(now, 8), jamaah: offsetFromNow(now, 18) },
    { name: "isha", label: "Isha", begins: offsetFromNow(now, 10), jamaah: offsetFromNow(now, 20) },
  ]
}

/** Dev-only: Maghrib in 1 min, jamaah in 11 min (10-min warning at +1 min). */
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
let cachedVenusDate: string | null = null
let cachedVenusDayPrayerTimes: DayPrayerTimes | null = null

/** Clears cached test times — only call on app launch, not when returning to Timetable. */
export function resetDevMockPrayerCache() {
  cachedDevDate = null
  cachedDevDayPrayerTimes = null
}

/** Clear persisted Venus timetable — next load re-anchors from now. */
export function resetVenusTimetableCache() {
  cachedVenusDate = null
  cachedVenusDayPrayerTimes = null
  remove(VENUS_TIMETABLE_KEY)
  resetPrayerAlertSession()
}

function loadPersistedVenusTimetable(today: string): DayPrayerTimes | null {
  const persisted = load<DayPrayerTimes>(VENUS_TIMETABLE_KEY)
  if (!persisted || persisted.date !== today) return null
  return persisted
}

function persistVenusTimetable(day: DayPrayerTimes) {
  save(VENUS_TIMETABLE_KEY, day)
}

const venusRestartListeners = new Set<() => void>()

export function subscribeVenusRestart(listener: () => void) {
  venusRestartListeners.add(listener)
  return () => {
    venusRestartListeners.delete(listener)
  }
}

function anchorVenusTimetableForToday(now = new Date()): DayPrayerTimes {
  const date = format(now, "yyyy-MM-dd")

  resetPrayerAlertSession()
  useAlertStore.getState().clear()
  void syncBadgeCount()

  const day: DayPrayerTimes = {
    date,
    prayers: buildVenusPrayerTimes(now),
    jumuah: [
      {
        id: "jumuah_1",
        label: "Jumu'ah 1",
        khutbah: "13:15",
        jamaah: "13:40",
      },
    ],
    announcement: NORMAL_ANNOUNCEMENT,
  }

  cachedVenusDate = date
  cachedVenusDayPrayerTimes = day
  persistVenusTimetable(day)
  return day
}

/** Re-anchor Venus from now — clears alerts, session watch, and refreshes all timetable hooks. */
export function restartVenusTest() {
  if (!VENUS_SHIFTED_TIMETABLE) return

  cachedVenusDate = null
  cachedVenusDayPrayerTimes = null
  remove(VENUS_TIMETABLE_KEY)

  anchorVenusTimetableForToday()
  venusRestartListeners.forEach((listener) => listener())
}

class MockPrayerService implements IPrayerService {
  async getPrayerTimes(date: string): Promise<DayPrayerTimes> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return this.build(date)
  }

  private build(date: string): DayPrayerTimes {
    const today = format(new Date(), "yyyy-MM-dd")

    if (VENUS_SHIFTED_TIMETABLE && date === today) {
      if (cachedVenusDate === today && cachedVenusDayPrayerTimes) {
        return cachedVenusDayPrayerTimes
      }

      const persisted = loadPersistedVenusTimetable(today)
      if (persisted) {
        cachedVenusDate = today
        cachedVenusDayPrayerTimes = persisted
        return persisted
      }

      return anchorVenusTimetableForToday()
    }

    if (DEV_PRAYER_MOCK_ENABLED && date === today) {
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
        announcement: `TEST · Maghrib ${maghribBegins} (1 min) · Jamaah ${maghribJamaah} (11 min, warning 10 min before)`,
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
      announcement: NORMAL_ANNOUNCEMENT,
    }
  }
}

export const mockPrayerService = new MockPrayerService()
