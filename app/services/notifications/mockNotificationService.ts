import type { AppNotification } from "@/models/notification.types"

import type { INotificationService } from "./INotificationService"

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "announcement_jumuah_update",
    title: "Jumu'ah reminder",
    message: "Khutbah starts at 1:15 pm and Salah begins at 1:40 pm.",
    type: "announcement",
    createdAt: "2026-06-04T08:30:00.000Z",
    data: { screen: "Timetable" },
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
    id: "prayer_asr",
    title: "Asr Jamaah soon",
    message: "Asr Jamaah is scheduled for 7:00 pm today.",
    type: "prayer",
    createdAt: "2026-06-04T16:30:00.000Z",
    data: { prayer: "asr" },
  },
  {
    id: "system_notifications_enabled",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "4",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "5",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "6",
    title: "Notifications ready",
    message: "Prayer reminders and mosque updates will appear here.",
    type: "system",
    createdAt: "2026-06-03T12:00:00.000Z",
  },
]

class MockNotificationService implements INotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, 80))
    return [...MOCK_NOTIFICATIONS]
  }
}

export const mockNotificationService = new MockNotificationService()
