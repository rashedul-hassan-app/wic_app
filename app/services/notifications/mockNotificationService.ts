import type { AppNotification } from "@/models/notification.types"

import type { INotificationService } from "./INotificationService"
import { sortNotificationsNewestFirst } from "./sortNotifications"

// Mock timestamps intentionally omit "Z" so the app parses them in device local time.
// If we use "Z", JavaScript treats the value as UTC and shifts the displayed date/time.
function formatLocalMockTimestamp(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 19)
}
// Offsets keep dynamic demo notifications ordered while still appearing newer 
function getCurrentLocalMockTimestamp(offsetMinutes = 0) {
  return formatLocalMockTimestamp(new Date(Date.now() + offsetMinutes * 60 * 1000))
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "prayer_late_night_reminder",
    title: "Late night prayer reminder",
    message: "The mosque will remain open tonight for extra time after Isha.",
    type: "prayer",
    // Offsets keep dynamic demo notifications ordered while still appearing newer than fixed mocks.
    createdAt: getCurrentLocalMockTimestamp(2),
    data: { prayer: "isha" },
  },
  {
    id: "late_night_prayer",
    title: "Late night prayer reminder",
    message: "The mosque will remain open tonight for extra worship after Isha.",
    type: "prayer",
    createdAt: getCurrentLocalMockTimestamp(1),
    data: { prayer: "isha" },
  },
  {
    id: "class_update",
    title: "Qur'an class update",
    message: "Tonight's Qur'an class will begin 15 minutes after Isha Jamaah.",
    type: "announcement",
    createdAt: getCurrentLocalMockTimestamp(0),
    data: { screen: "Announcements" },
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
    id: "system_notifications_enabled",
    title: "Notifications enabled",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-02T12:00:00",
  },
]

class MockNotificationService implements INotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return sortNotificationsNewestFirst(MOCK_NOTIFICATIONS)
  }
}

export const mockNotificationService = new MockNotificationService()
