import type { AppNotification } from "@/models/notification.types"

export function sortNotificationsNewestFirst(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}
