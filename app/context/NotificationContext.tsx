import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import type { AppNotification } from "@/models/notification.types"
import { mockNotificationService } from "@/services/notifications/mockNotificationService"
import {
  notificationDeviceService,
  type ScheduleLocalNotificationResult,
} from "@/services/notifications/notificationDeviceService"
import {
  countUnreadNotifications,
  getUnseenNotifications,
  hasNotificationHistory,
  markNotificationsKnown,
  markNotificationsRead,
  markNotificationsScheduled,
  mergeReadState,
  parsePersistedNotificationState,
  serializePersistedNotificationState,
} from "@/services/notifications/notificationState"
import { sortNotificationsNewestFirst } from "@/services/notifications/sortNotifications"

const NOTIFICATION_STATE_KEY = "NotificationProvider.state"

type ScheduledMockNotificationResult = ScheduleLocalNotificationResult & {
  pendingCount: number | null
}

export type NotificationContextType = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAllRead: () => void
  addNotification: (notification: AppNotification) => void
  scheduleMockNotification: () => Promise<ScheduledMockNotificationResult>
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
  const persistedStateRef = useRef(persistedState)

  const notifications = useMemo(
    () =>
      // The mock/API feed is the source of notification content; MMKV only stores read timestamps.
      // Merging here keeps unread count and row UI correct across app restarts.
      sortNotificationsNewestFirst(mergeReadState(sourceNotifications, persistedState)),
    [persistedState, sourceNotifications],
  )

  const unreadCount = useMemo(() => countUnreadNotifications(notifications), [notifications])

  useEffect(() => {
    persistedStateRef.current = persistedState
  }, [persistedState])

  const syncMockNotificationScheduling = useCallback(
    async (nextNotifications: AppNotification[]) => {
      if (!__DEV__) return

      const currentPersistedState = persistedStateRef.current
      const now = new Date().toISOString()

      if (!hasNotificationHistory(currentPersistedState)) {
        // First app run should only establish the baseline feed.
        // Without this, every existing mock row would fire at once after install.
        const nextPersistedState = markNotificationsKnown(
          nextNotifications,
          currentPersistedState,
          now,
        )
        persistedStateRef.current = nextPersistedState
        setPersistedStateString(serializePersistedNotificationState(nextPersistedState))
        return
      }

      const unseenNotifications = getUnseenNotifications(nextNotifications, currentPersistedState)
      if (unseenNotifications.length === 0) return

      const scheduledNotificationIds: string[] = []
      const nextUnreadCount = countUnreadNotifications(
        mergeReadState(nextNotifications, currentPersistedState),
      )

      for (const [index, notification] of unseenNotifications.entries()) {
        // Stagger multiple new mock rows so iOS does not receive a burst at the same second.
        // The badge number is attached to the scheduled notification so iOS can update
        // the app icon even while the app is locked/backgrounded.
        const result = await notificationDeviceService.scheduleLocalNotification(
          notification,
          5 + index * 2,
          nextUnreadCount,
        )
        if (result.status === "scheduled") scheduledNotificationIds.push(notification.id)
      }

      // Mark all unseen rows as known so refresh/app reload does not keep re-triggering them.
      // Successful schedules also get tracked separately for interview/debug visibility.
      const knownPersistedState = markNotificationsKnown(
        unseenNotifications,
        currentPersistedState,
        now,
      )
      const nextPersistedState = markNotificationsScheduled(
        scheduledNotificationIds,
        knownPersistedState,
        now,
      )
      persistedStateRef.current = nextPersistedState
      setPersistedStateString(serializePersistedNotificationState(nextPersistedState))
    },
    [setPersistedStateString],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // This is the temporary data boundary. When a real API exists,
      // only the service implementation should change, not the screen UI.
      const result = await mockNotificationService.getNotifications()
      setSourceNotifications(result)
      await syncMockNotificationScheduling(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications.")
    } finally {
      setLoading(false)
    }
  }, [syncMockNotificationScheduling])

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

  const scheduleMockNotification =
    useCallback(async (): Promise<ScheduledMockNotificationResult> => {
      // Development helper: schedule the newest mock notification locally.
      // Production push/API work can reuse the same AppNotification shape later.
      const notification = notifications[0] ?? (await mockNotificationService.getNotifications())[0]
      if (!notification) {
        return {
          status: "failed",
          scheduledId: null,
          pendingCount: null,
          error: "No mock notification is available to schedule.",
        }
      }

      const result = await notificationDeviceService.scheduleLocalNotification(
        notification,
        5,
        Math.max(unreadCount, 1),
      )
      const pendingCount = await notificationDeviceService.getScheduledNotificationCount()

      return { ...result, pendingCount }
    }, [notifications, unreadCount])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    // Keep the app icon badge aligned with the same unread count shown on the bell icon.
    notificationDeviceService.setAppBadgeCount(unreadCount)
  }, [unreadCount])

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
