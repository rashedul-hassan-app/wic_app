import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import type { AppNotification } from "@/models/notification.types"
import { mockNotificationService } from "@/services/notifications/mockNotificationService"
import { notificationDeviceService } from "@/services/notifications/notificationDeviceService"
import {
  countUnreadNotifications,
  markNotificationsRead,
  mergeReadState,
  parsePersistedNotificationState,
  serializePersistedNotificationState,
} from "@/services/notifications/notificationState"
import { sortNotificationsNewestFirst } from "@/services/notifications/sortNotifications"

const NOTIFICATION_STATE_KEY = "NotificationProvider.state"

export type NotificationContextType = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAllRead: () => void
  addNotification: (notification: AppNotification) => void
  scheduleMockNotification: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [persistedStateString, setPersistedStateString] = useMMKVString(NOTIFICATION_STATE_KEY)
  const [sourceNotifications, setSourceNotifications] = useState<AppNotification[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // MMKV stores only read metadata, not the whole notification list.
  // That lets mock/API notifications change later without wiping the user's read history.
  const persistedState = useMemo(
    () => parsePersistedNotificationState(persistedStateString),
    [persistedStateString],
  )

  const notifications = useMemo(
    () =>
      // The mock/API feed is the source of notification content; MMKV only stores read timestamps.
      // Merging here keeps unread count and row UI correct across app restarts.
      sortNotificationsNewestFirst(mergeReadState(sourceNotifications, persistedState)),
    [persistedState, sourceNotifications],
  )

  const unreadCount = useMemo(() => countUnreadNotifications(notifications), [notifications])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // This is the temporary data boundary. When a real API exists,
      // only the service implementation should change, not the screen UI.
      const result = await mockNotificationService.getNotifications()
      setSourceNotifications(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications.")
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllRead = useCallback(() => {
    if (unreadCount === 0) return

    const result = markNotificationsRead(notifications, persistedState, new Date().toISOString())

    // Update memory immediately for the current render and persist ids so the badge stays cleared.
    setSourceNotifications(result.notifications)
    setPersistedStateString(serializePersistedNotificationState(result.persistedState))
  }, [notifications, persistedState, setPersistedStateString, unreadCount])

  const addNotification = useCallback((notification: AppNotification) => {
    setSourceNotifications((current) => {
      // Local notification listeners can fire more than once for the same item.
      // Guarding by id prevents duplicate rows in the inbox.
      if (current.some((item) => item.id === notification.id)) return current

      // New notifications should behave like a real inbox: newest item first.
      return sortNotificationsNewestFirst([notification, ...current])
    })
  }, [])

  const scheduleMockNotification = useCallback(async () => {
    // Development helper: schedule the newest mock notification locally.
    // Production push/API work can reuse the same AppNotification shape later.
    const notification = notifications[0] ?? (await mockNotificationService.getNotifications())[0]
    if (!notification) return

    await notificationDeviceService.scheduleLocalNotification(notification)
  }, [notifications])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    // Device notification setup is isolated here so screens stay focused on rendering.
    notificationDeviceService.configureForegroundHandler()
    notificationDeviceService.configureAndroidChannel()

    // Received/response events are converted into inbox rows through addNotification.
    const receivedSubscription = notificationDeviceService.addReceivedListener(addNotification)
    const responseSubscription = notificationDeviceService.addResponseListener(addNotification)

    return () => {
      receivedSubscription.remove()
      responseSubscription.remove()
    }
  }, [addNotification])

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAllRead,
    addNotification,
    scheduleMockNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}
