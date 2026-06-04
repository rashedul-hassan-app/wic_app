import type { AppNotification } from "@/models/notification.types"

// Persist only read timestamps by notification id, not the full notification feed.
// This lets mock/API notification content change while preserving local read history.
export type PersistedNotificationState = {
  readById: Record<string, string>
  knownById: Record<string, string>
  scheduledById: Record<string, string>
}

export const emptyPersistedNotificationState: PersistedNotificationState = {
  readById: {},
  knownById: {},
  scheduledById: {},
}

export function parsePersistedNotificationState(value?: string): PersistedNotificationState {
  if (!value) return emptyPersistedNotificationState

  try {
    const parsed = JSON.parse(value) as Partial<PersistedNotificationState>
    return {
      readById: parsed.readById ?? {},
      knownById: parsed.knownById ?? {},
      scheduledById: parsed.scheduledById ?? {},
    }
  } catch {
    return emptyPersistedNotificationState
  }
}

export function serializePersistedNotificationState(state: PersistedNotificationState): string {
  return JSON.stringify(state)
}

// Rehydrates read timestamps onto the latest notification payload from the data source.
export function mergeReadState(
  notifications: AppNotification[],
  persistedState: PersistedNotificationState,
): AppNotification[] {
  return notifications.map((notification) => ({
    ...notification,
    readAt: notification.readAt ?? persistedState.readById[notification.id],
  }))
}

export function countUnreadNotifications(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.readAt).length
}

// Marks the current feed as read while keeping read history for ids no longer in the feed.
export function markNotificationsRead(
  notifications: AppNotification[],
  persistedState: PersistedNotificationState,
  now: string,
): {
  notifications: AppNotification[]
  persistedState: PersistedNotificationState
} {
  const readById = notifications.reduce<Record<string, string>>(
    (acc, notification) => {
      acc[notification.id] = notification.readAt ?? now
      return acc
    },
    { ...persistedState.readById },
  )
  const nextPersistedState = {
    ...persistedState,
    readById,
  }

  return {
    notifications: mergeReadState(notifications, nextPersistedState),
    persistedState: nextPersistedState,
  }
}

// Marks one notification as read without changing the unread state of other current items.
export function markNotificationRead(
  notifications: AppNotification[],
  persistedState: PersistedNotificationState,
  notificationId: string,
  now: string,
): {
  notifications: AppNotification[]
  persistedState: PersistedNotificationState
} {
  const readById = notifications.reduce<Record<string, string>>(
    (acc, notification) => {
      if (notification.readAt) acc[notification.id] = notification.readAt
      if (notification.id === notificationId) acc[notification.id] = notification.readAt ?? now
      return acc
    },
    { ...persistedState.readById },
  )
  const nextPersistedState = {
    ...persistedState,
    readById,
  }

  return {
    notifications: mergeReadState(notifications, nextPersistedState),
    persistedState: nextPersistedState,
  }
}

export function hasNotificationHistory(persistedState: PersistedNotificationState): boolean {
  return (
    Object.keys(persistedState.readById).length > 0 ||
    Object.keys(persistedState.knownById).length > 0 ||
    Object.keys(persistedState.scheduledById).length > 0
  )
}

export function getUnseenNotifications(
  notifications: AppNotification[],
  persistedState: PersistedNotificationState,
): AppNotification[] {
  return notifications.filter(
    (notification) =>
      !persistedState.readById[notification.id] &&
      !persistedState.knownById[notification.id] &&
      !persistedState.scheduledById[notification.id],
  )
}

export function markNotificationsKnown(
  notifications: AppNotification[],
  persistedState: PersistedNotificationState,
  now: string,
): PersistedNotificationState {
  const knownById = notifications.reduce<Record<string, string>>(
    (acc, notification) => {
      acc[notification.id] = acc[notification.id] ?? now
      return acc
    },
    { ...persistedState.knownById },
  )

  return {
    ...persistedState,
    knownById,
  }
}

export function markNotificationsScheduled(
  notificationIds: string[],
  persistedState: PersistedNotificationState,
  now: string,
): PersistedNotificationState {
  const scheduledById = notificationIds.reduce<Record<string, string>>(
    (acc, id) => {
      acc[id] = acc[id] ?? now
      return acc
    },
    { ...persistedState.scheduledById },
  )

  return {
    ...persistedState,
    scheduledById,
  }
}
