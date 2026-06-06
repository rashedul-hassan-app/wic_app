import { AppState, Linking, Platform } from "react-native"
import * as Application from "expo-application"
import * as Notifications from "expo-notifications"
import { CommonActions } from "@react-navigation/native"

import { ensureTimetableOnLaunch, navigationRef } from "@/navigators/navigationUtilities"
import { normalizeAlertEvent } from "@/services/notifications/alertEventIds"
import type { AlertEvent } from "@/stores/useAlertStore"
import { countUnreadAlerts, useAlertStore } from "@/stores/useAlertStore"
import { loadString, saveString } from "@/utils/storage"

const ANDROID_CHANNEL_ID = "prayer-alerts"
const ANDROID_EXACT_ALARM_PROMPT_KEY = "ANDROID_EXACT_ALARM_PROMPTED"

const NOTIFICATION_LISTENERS_KEY = "__wicNotificationListeners"

// Android replays the last notification response even on icon launches. We only navigate
// to Alerts when the user genuinely tapped a notification (fresh response) or the app
// was already running in the background.
const LAUNCH_NOTIFICATION_MAX_AGE_MS = 15_000

type NotificationListenerRegistry = {
  cleanup: (() => void) | null
}

let initialized = false
let lastHandledResponseKey: string | null = null
let hasBeenBackground = false
let launchNavigationHandled = false

function isNativePlatform() {
  return Platform.OS === "ios" || Platform.OS === "android"
}

function isAppActive() {
  return AppState.currentState === "active"
}

function hasNotificationPermission(settings: Notifications.NotificationPermissionsStatus) {
  const granted = (settings as { granted?: boolean }).granted
  if (granted) return true

  const iosStatus = settings.ios?.status
  if (iosStatus != null) {
    return (
      iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    )
  }

  return false
}

/** Android 12+ needs "Alarms & reminders" or DATE triggers are batched and may not fire. */
export async function ensureAndroidExactAlarms() {
  if (Platform.OS !== "android" || Number(Platform.Version) < 31) return

  if (__DEV__) {
    if (!loadString(ANDROID_EXACT_ALARM_PROMPT_KEY)) {
      console.warn(
        "[notifications] On Android 12+, enable Alarms & reminders for com.wicapp " +
          "(Settings → Apps → Wic Prayer App → Alarms & reminders) or OS banners may not fire.",
      )
      saveString(ANDROID_EXACT_ALARM_PROMPT_KEY, "1")
    }
    return
  }

  if (loadString(ANDROID_EXACT_ALARM_PROMPT_KEY)) return

  const packageName = Application.applicationId
  if (!packageName) return

  saveString(ANDROID_EXACT_ALARM_PROMPT_KEY, "1")

  const intentUrl = `intent:#Intent;action=android.settings.REQUEST_SCHEDULE_EXACT_ALARM;package=${packageName};end`

  try {
    if (await Linking.canOpenURL(intentUrl)) {
      await Linking.openURL(intentUrl)
    }
  } catch {
    // User can enable Alarms & reminders manually in app settings.
  }
}

export async function initializeNotifications(): Promise<boolean> {
  if (!isNativePlatform()) return false

  if (initialized) {
    const settings = await Notifications.getPermissionsAsync()
    return hasNotificationPermission(settings)
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const foreground = isAppActive()

      // In-app alerts are time-driven; suppress the OS banner while the app is open.
      return {
        shouldShowBanner: !foreground,
        shouldShowList: !foreground,
        shouldPlaySound: !foreground,
        shouldSetBadge: false,
      }
    },
  })

  if (Platform.OS === "android") {
    // Recreate channel so sound config updates (Android channels are sticky).
    // Omit `sound` — Android treats the string "default" as a missing custom file.
    await Notifications.deleteNotificationChannelAsync(ANDROID_CHANNEL_ID)
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Prayer Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }

  const existingSettings = await Notifications.getPermissionsAsync()
  let settings = existingSettings

  if (!hasNotificationPermission(existingSettings)) {
    settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
  }

  if (Platform.OS === "android" && hasNotificationPermission(settings)) {
    await ensureAndroidExactAlarms()
  }

  initialized = true
  return hasNotificationPermission(settings)
}

export function eventFromNotificationData(data: unknown): AlertEvent | null {
  if (!data || typeof data !== "object") return null

  const payload = data as {
    eventId?: string
    title?: string
    time?: string
    eventAt?: string
  }

  if (!payload.eventId || !payload.title || !payload.time || !payload.eventAt) return null

  return normalizeAlertEvent({
    id: payload.eventId,
    title: payload.title,
    time: payload.time,
    eventAt: payload.eventAt,
  })
}

function openAlertsForEvent(eventId: string) {
  const open = () => {
    if (!navigationRef.isReady()) {
      setTimeout(open, 50)
      return
    }

    navigationRef.dispatch(
      CommonActions.navigate({
        name: "Main",
        params: {
          screen: "Alerts",
          params: { highlightEventId: eventId },
        },
      }),
    )
  }

  open()
}

function getResponseKey(response: Notifications.NotificationResponse) {
  const identifier = response.notification.request.identifier ?? "unknown"
  const action = response.actionIdentifier ?? "default"
  const date = response.notification.date ?? 0
  return `${identifier}:${action}:${date}`
}

function notificationAgeMs(response: Notifications.NotificationResponse) {
  const raw = response.notification.date ?? 0
  const tappedAt = raw > 1_000_000_000_000 ? raw : raw * 1000
  return Date.now() - tappedAt
}

function isFreshNotificationLaunch(response: Notifications.NotificationResponse) {
  const ageMs = notificationAgeMs(response)
  return ageMs >= 0 && ageMs < LAUNCH_NOTIFICATION_MAX_AGE_MS
}

function canNavigateToAlertsFromNotification() {
  return hasBeenBackground
}

/** Tapping an OS notification only navigates — the in-app list is time-driven. */
function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const responseKey = getResponseKey(response)
  if (responseKey === lastHandledResponseKey) return null
  lastHandledResponseKey = responseKey

  const event = eventFromNotificationData(response.notification.request.content.data)
  if (!event) return null

  if (!canNavigateToAlertsFromNotification()) return event

  openAlertsForEvent(event.id)
  return event
}

/** Decide the initial screen once navigation is ready. */
export async function handleNavigationContainerReady() {
  if (launchNavigationHandled) return
  launchNavigationHandled = true

  if (!isNativePlatform()) {
    ensureTimetableOnLaunch()
    return
  }

  const response = await Notifications.getLastNotificationResponseAsync()
  const event = response
    ? eventFromNotificationData(response.notification.request.content.data)
    : null

  if (response && event && isFreshNotificationLaunch(response)) {
    lastHandledResponseKey = getResponseKey(response)
    openAlertsForEvent(event.id)
    return
  }

  if (response) {
    lastHandledResponseKey = getResponseKey(response)
  }

  ensureTimetableOnLaunch()
}

export async function syncBadgeCount() {
  if (!isNativePlatform()) return

  const { events } = useAlertStore.getState()
  await Notifications.setBadgeCountAsync(countUnreadAlerts(events))
}

/** Clear the OS icon badge when the user opens Alerts. */
export async function clearNotificationBadge() {
  if (!isNativePlatform()) return
  await Notifications.setBadgeCountAsync(0)
}

function getNotificationListenerRegistry(): NotificationListenerRegistry {
  const host = globalThis as typeof globalThis & {
    [NOTIFICATION_LISTENERS_KEY]?: NotificationListenerRegistry
  }

  if (!host[NOTIFICATION_LISTENERS_KEY]) {
    host[NOTIFICATION_LISTENERS_KEY] = { cleanup: null }
  }

  return host[NOTIFICATION_LISTENERS_KEY]!
}

export function setupNotificationListeners() {
  if (!isNativePlatform()) {
    return () => undefined
  }

  const registry = getNotificationListenerRegistry()
  registry.cleanup?.()

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response)
  })

  const appStateSubscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "background") {
      hasBeenBackground = true
    }
  })

  registry.cleanup = () => {
    responseSubscription.remove()
    appStateSubscription.remove()
    registry.cleanup = null
  }

  return registry.cleanup
}
