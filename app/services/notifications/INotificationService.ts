import type { AppNotification } from "@/models/notification.types"

export interface INotificationService {
  getNotifications(): Promise<AppNotification[]>
}
