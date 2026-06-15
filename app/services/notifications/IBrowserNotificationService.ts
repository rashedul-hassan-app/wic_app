export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported"

export interface IBrowserNotificationService {
  getPermission(): NotificationPermissionStatus
  requestPermission(): Promise<NotificationPermissionStatus>
  show(title: string, body: string): void
}
