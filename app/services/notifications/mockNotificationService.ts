import type { AppNotification } from "@/models/notification.types"

import type { INotificationService } from "./INotificationService"
import { sortNotificationsNewestFirst } from "./sortNotifications"

// Mock timestamps intentionally omit "Z" so the app parses them in device local time.
// If we use "Z", JavaScript treats the value as UTC and shifts the displayed date/time.
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "announcement_weekend_school_registration",
    title: "Weekend school registration",
    message: "Registration for weekend Islamic school opens after Jumu'ah this Friday.",
    type: "announcement",
    createdAt: "2026-06-04T22:25:00",
    data: { screen: "Announcements" },
  },
  {
    id: "prayer_tahajjud_program_reminder",
    title: "Tahajjud program reminder",
    message: "Join the community Tahajjud program tonight at 3:45 am.",
    type: "prayer",
    createdAt: "2026-06-04T22:20:00",
    data: { prayer: "tahajjud" },
  },
  {
    id: "prayer_fajr_reminder_tomorrow",
    title: "Fajr reminder",
    message: "Fajr Jamaah is scheduled for 4:30 am tomorrow.",
    type: "prayer",
    createdAt: "2026-06-04T22:05:00",
    data: { prayer: "fajr" },
  },
  {
    id: "announcement_moon_sighting_update",
    title: "Moon sighting update",
    message: "The mosque will share the confirmed Eid announcement after Maghrib.",
    type: "announcement",
    createdAt: "2026-06-04T20:45:00",
  },
  {
    id: "announcement_eid_volunteers_needed",
    title: "Volunteers needed",
    message: "Please register at the office if you can help with Eid preparation.",
    type: "announcement",
    createdAt: "2026-06-04T20:10:00",
  },
  {
    id: "prayer_isha_jamaah_reminder",
    title: "Isha Jamaah reminder",
    message: "Isha Jamaah is scheduled for 10:30 pm tonight.",
    type: "prayer",
    createdAt: "2026-06-04T19:45:00",
    data: { prayer: "isha" },
  },
  {
    id: "system_app_updates_enabled",
    title: "App updates enabled",
    message: "You will receive mosque updates and prayer reminders here.",
    type: "system",
    createdAt: "2026-06-04T18:45:00",
  },
  {
    id: "prayer_asr_jamaah",
    title: "Asr Jamaah soon",
    message: "Asr Jamaah is scheduled for 7:00 pm today.",
    type: "prayer",
    createdAt: "2026-06-04T16:30:00",
    data: { prayer: "asr" },
  },
  {
    id: "announcement_jumuah_update",
    title: "Jumu'ah reminder",
    message: "Khutbah starts at 1:15 pm and Salah begins at 1:40 pm.",
    type: "announcement",
    createdAt: "2026-06-04T13:00:00",
    data: { screen: "Timetable" },
  },
  {
    id: "announcement_parking_notice",
    title: "Parking notice",
    message: "Please use the overflow parking area for busy prayer times.",
    type: "announcement",
    createdAt: "2026-06-04T10:15:00",
  },
  {
    id: "system_notifications_ready",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00",
  },
]

class MockNotificationService implements INotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return sortNotificationsNewestFirst(MOCK_NOTIFICATIONS)
  }
}

export const mockNotificationService = new MockNotificationService()
