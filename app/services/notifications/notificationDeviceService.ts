import { Platform } from "react-native"
import type * as ExpoNotifications from "expo-notifications"

import type { AppNotification, NotificationType } from "@/models/notification.types"

const NOTIFICATION_CHANNEL_ID = "wic-prayer-reminders"

type NotificationListener = (notification: AppNotification) => void
type EventSubscription = { remove: () => void }
type NotificationsModule = typeof ExpoNotifications

type NotificationData = {
  id?: unknown
  title?: unknown
  message?: unknown
  type?: unknown
  createdAt?: unknown
  prayer?: unknown
  screen?: unknown
}

type PermissionStatusWithRuntimeFields = ExpoNotifications.NotificationPermissionsStatus & {
  granted?: boolean
  status?: ExpoNotifications.PermissionStatus
}

let cachedNotificationsModule: NotificationsModule | null | undefined

function emptySubscription(): EventSubscription {
  return { remove: () => undefined }
}

function getNotificationsModule(): NotificationsModule | null {
  if (cachedNotificationsModule !== undefined) return cachedNotificationsModule

  try {
    // expo-notifications needs a native rebuild after install.
    // Lazy require keeps Expo Go/old dev clients from crashing if the module is missing.
    cachedNotificationsModule = require("expo-notifications") as NotificationsModule
  } catch {
    cachedNotificationsModule = null
  }

  return cachedNotificationsModule
}

function isNotificationType(value: unknown): value is NotificationType {
  return value === "prayer" || value === "announcement" || value === "system"
}

function hasNotificationPermission(
  status: ExpoNotifications.NotificationPermissionsStatus,
  Notifications: NotificationsModule,
): boolean {
  const runtimeStatus = status as PermissionStatusWithRuntimeFields

  return (
    runtimeStatus.granted === true ||
    runtimeStatus.status === Notifications.PermissionStatus.GRANTED ||
    runtimeStatus.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    runtimeStatus.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    runtimeStatus.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  )
}

function toLocalNotificationData(notification: AppNotification): NotificationData {
  // Store only primitive payload fields so Expo can safely serialize notification data.
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
    prayer: notification.data?.prayer,
    screen: notification.data?.screen,
  }
}

function fromExpoNotification(notification: ExpoNotifications.Notification): AppNotification {
  // Convert Expo's native event shape back into our app-level notification model.
  // This keeps NotificationProvider independent from Expo-specific details.
  const { content, identifier } = notification.request
  const data = content.data as NotificationData
  const id = typeof data.id === "string" ? data.id : `local_${identifier}`
  const title = typeof data.title === "string" ? data.title : (content.title ?? "Notification")
  const message = typeof data.message === "string" ? data.message : (content.body ?? "")
  const createdAt =
    typeof data.createdAt === "string" ? data.createdAt : new Date(notification.date).toISOString()

  return {
    id,
    title,
    message,
    type: isNotificationType(data.type) ? data.type : "system",
    createdAt,
    data: {
      prayer: typeof data.prayer === "string" ? data.prayer : null,
      screen: typeof data.screen === "string" ? data.screen : null,
      source: "local",
    },
  }
}

class NotificationDeviceService {
  configureForegroundHandler() {
    const Notifications = getNotificationsModule()
    if (!Notifications) return

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
  }

  async requestPermissions(): Promise<boolean> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return false

    const current = await Notifications.getPermissionsAsync()
    if (hasNotificationPermission(current, Notifications)) return true

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })

    return hasNotificationPermission(requested, Notifications)
  }

  async configureAndroidChannel() {
    const Notifications = getNotificationsModule()
    if (!Notifications) return

    if (Platform.OS !== "android") return

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Prayer reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: true,
    })
  }

  addReceivedListener(listener: NotificationListener) {
    const Notifications = getNotificationsModule()
    if (!Notifications) return emptySubscription()

    return Notifications.addNotificationReceivedListener((notification) => {
      listener(fromExpoNotification(notification))
    })
  }

  addResponseListener(listener: NotificationListener) {
    const Notifications = getNotificationsModule()
    if (!Notifications) return emptySubscription()

    return Notifications.addNotificationResponseReceivedListener((response) => {
      listener(fromExpoNotification(response.notification))
    })
  }

  async scheduleLocalNotification(
    notification: AppNotification,
    seconds = 5,
  ): Promise<string | null> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return null

    const hasPermission = await this.requestPermissions()
    if (!hasPermission) return null

    await this.configureAndroidChannel()

    // Scheduled demo notifications get a fresh id/time so they appear as new inbox rows.
    const scheduledNotification: AppNotification = {
      ...notification,
      id: `local_${notification.id}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      readAt: undefined,
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: scheduledNotification.title,
        body: scheduledNotification.message,
        sound: "default",
        data: toLocalNotificationData(scheduledNotification),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    })
  }

  async getScheduledNotificationCount(): Promise<number | null> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return null

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()
    return scheduledNotifications.length
  }
}

export const notificationDeviceService = new NotificationDeviceService()
