import type { CurrentPrayerInfo } from "@/hooks/useCurrentPrayer"
import type { JumuahTime } from "@/models/prayer.types"
import { formatPrayerTime12h } from "@/utils/prayerTime"

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

function cleanPrayerLabel(label: string) {
  return label.replace(/[^\w\s']/g, "").trim()
}

function formatJumuahLine(jumuah: JumuahTime) {
  return `Jumu'ah · Khutbah ${formatPrayerTime12h(jumuah.khutbah)} · Salah ${formatPrayerTime12h(jumuah.jamaah)}`
}

export function getAnnouncementBannerText(options: {
  isToday: boolean
  currentPrayer: CurrentPrayerInfo | null
  jumuah: JumuahTime[]
  staticAnnouncement: string | null
  now?: Date
}): string | null {
  const { isToday, currentPrayer, jumuah, staticAnnouncement, now = new Date() } = options

  if (!isToday) {
    return staticAnnouncement
  }

  if (staticAnnouncement?.startsWith("TEST")) {
    return staticAnnouncement
  }

  if (!currentPrayer) return staticAnnouncement

  const next = currentPrayer.nextPrayer.prayer
  const nextLine = `Next: ${cleanPrayerLabel(next.label)} at ${formatPrayerTime12h(next.begins)} · ${currentPrayer.nextPrayer.countdownLabel}`

  const isFriday = now.getDay() === 5
  const primaryJumuah = jumuah[0]

  if (isFriday && primaryJumuah) {
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const jumuahPassed = toMinutes(primaryJumuah.jamaah) <= nowMin

    if (!jumuahPassed) {
      return `${formatJumuahLine(primaryJumuah)} · ${nextLine}`
    }
  }

  return nextLine
}
