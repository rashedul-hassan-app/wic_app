import type { AppNotification } from "@/models/notification.types"

import type { INotificationService } from "./INotificationService"
import { sortNotificationsNewestFirst } from "./sortNotifications"

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "announcement_moon_sighting_update",
    title: "Moon sighting update",
    message:
      "The mosque will share the confirmed Eid announcement after Maghrib.",
    type: "announcement",
    createdAt: "2026-06-04T20:45:00.000Z",
  },
  {
    id: "announcement_eid_volunteers_needed",
    title: "Volunteers needed",
    message: "Please register at the office if you can help with Eid preparation.",
    type: "announcement",
    createdAt: "2026-06-04T20:10:00.000Z",
  },
  {
    id: "prayer_isha_jamaah_reminder",
    title: "Isha Jamaah reminder",
    message: "Isha Jamaah is scheduled for 10:30 pm tonight.",
    type: "prayer",
    createdAt: "2026-06-04T19:45:00.000Z",
    data: { prayer: "isha" },
  },
  {
    id: "system_app_updates_enabled",
    title: "App updates enabled",
    message: "You will receive mosque updates and prayer reminders here.",
    type: "system",
    createdAt: "2026-06-04T18:45:00.000Z",
  },
  {
    id: "prayer_asr_jamaah",
    title: "Asr Jamaah soon",
    message: "Asr Jamaah is scheduled for 7:00 pm today.",
    type: "prayer",
    createdAt: "2026-06-04T16:30:00.000Z",
    data: { prayer: "asr" },
  },
  {
    id: "announcement_jumuah_update",
    title: "Jumu'ah reminder",
    message: "Khutbah starts at 1:15 pm and Salah begins at 1:40 pm.",
    type: "announcement",
    createdAt: "2026-06-04T13:00:00.000Z",
    data: { screen: "Timetable" },
  },
  {
    id: "announcement_parking_notice",
    title: "Parking notice",
    message: "Please use the overflow parking area for busy prayer times.",
    type: "announcement",
    createdAt: "2026-06-04T10:15:00.000Z",
  },
  {
    id: "system_notifications_ready",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "system_notifications",
    title: "Prayer update",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-04T20:40:00.000Z",
  },
  {
    id: "4",
    title: "Prayer update",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-04T21:40:00.000Z",
  },
  {
    id: "5",
    title: "Prayer update",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-04T21:50:00.000Z",
  },
]

class MockNotificationService implements INotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return sortNotificationsNewestFirst(MOCK_NOTIFICATIONS)
  }
}

export const mockNotificationService = new MockNotificationService()
