import { Platform } from "react-native"

import type {
  IBrowserNotificationService,
  NotificationPermissionStatus,
} from "./IBrowserNotificationService"
import { playPrayerNotificationSound } from "./notificationSound"

const APP_TITLE = "WIC Prayer App"

function canUseBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

class NoopBrowserNotificationService implements IBrowserNotificationService {
  getPermission(): NotificationPermissionStatus {
    return "unsupported"
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    return "unsupported"
  }

  show(_title: string, _body: string): void {}
}

class WebBrowserNotificationService implements IBrowserNotificationService {
  getPermission(): NotificationPermissionStatus {
    if (!canUseBrowserNotifications()) return "unsupported"
    return Notification.permission
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!canUseBrowserNotifications()) return "unsupported"
    if (Notification.permission === "granted") return "granted"
    if (Notification.permission === "denied") return "denied"
    return Notification.requestPermission()
  }

  show(title: string, body: string): void {
    if (!canUseBrowserNotifications()) return
    if (Notification.permission !== "granted") return

    try {
      const notification = new Notification(title, {
        body,
        tag: `wic-prayer-${Date.now()}`,
        silent: false,
      })

      playPrayerNotificationSound()

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("[notifications] Failed to show browser notification:", error)
      }
    }
  }
}

let serviceInstance: IBrowserNotificationService | undefined

function getService(): IBrowserNotificationService {
  if (!serviceInstance) {
    serviceInstance =
      Platform.OS === "web" && canUseBrowserNotifications()
        ? new WebBrowserNotificationService()
        : new NoopBrowserNotificationService()
  }
  return serviceInstance
}

/** Reset cached service (useful if platform APIs become available after first import). */
export function resetBrowserNotificationService(): void {
  serviceInstance = undefined
}

export const browserNotificationService: IBrowserNotificationService = {
  getPermission: () => getService().getPermission(),
  requestPermission: () => getService().requestPermission(),
  show: (title, body) => getService().show(title, body),
}

export { APP_TITLE }
