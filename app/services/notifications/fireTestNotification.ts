import { browserNotificationService } from "./browserNotificationService"
import { addInboxNotification, getInboxNotifications } from "./notificationInbox"
import { playPrayerNotificationSound } from "./notificationSound"

const TEST_BODY = "This is Test time"
const APP_TITLE = "WIC Prayer App"

export function showBrowserPopup(title: string, body: string): boolean {
  if (browserNotificationService.getPermission() !== "granted") return false
  browserNotificationService.show(title, body)
  return true
}

export function showLatestUnreadBrowserPopup(): boolean {
  const latestUnread = getInboxNotifications().find((item) => !item.read)
  if (!latestUnread) return false
  return showBrowserPopup(APP_TITLE, latestUnread.body)
}

export function deliverNotification(title: string, body: string, prayerName: string): void {
  addInboxNotification({ body, prayerName })

  if (showBrowserPopup(title, body)) return

  playPrayerNotificationSound()
}

export async function fireTestNotification(requestPermission = true): Promise<boolean> {
  if (requestPermission) {
    await browserNotificationService.requestPermission()
  }

  const body = `${TEST_BODY} (${new Date().toLocaleTimeString()})`
  addInboxNotification({ body, prayerName: "test" })

  if (browserNotificationService.getPermission() === "granted") {
    browserNotificationService.show(APP_TITLE, body)
  } else {
    playPrayerNotificationSound()
  }

  return true
}
