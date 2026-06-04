export type NotificationType = "prayer" | "announcement" | "system"

export type AppNotification = {
  id: string
  title: string
  message: string
  type: NotificationType
  createdAt: string
  readAt?: string
  data?: Record<string, string | number | boolean | null>
}
