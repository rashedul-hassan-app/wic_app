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
}

export const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [persistedStateString, setPersistedStateString] = useMMKVString(NOTIFICATION_STATE_KEY)
  const [sourceNotifications, setSourceNotifications] = useState<AppNotification[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      if (current.some((item) => item.id === notification.id)) return current
      return sortNotificationsNewestFirst([notification, ...current])
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAllRead,
    addNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}
