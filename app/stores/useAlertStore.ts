import { create } from "zustand"

import {
  alertInstanceKey,
  migratePersistedAlertEvents,
  normalizeAlertEvent,
} from "@/services/notifications/alertEventIds"
import type { PrayerTime } from "@/models/prayer.types"
import { isTimetableSlotDue, isTimetableSlotPassed } from "@/utils/prayerTime"
import { load, save } from "@/utils/storage"

export type AlertEvent = {
  id: string
  title: string
  time: string
  eventAt: string
  read?: boolean
  /** True after leaving Alerts — you've seen this row; it won't return to New when it becomes due. */
  acknowledged?: boolean
}

type AlertState = {
  events: AlertEvent[]
  jumuahLastShown: string | null

  addEvents: (events: AlertEvent[]) => void
  clear: () => void
  /** Marks all alerts read — clears badge when Alerts is opened. */
  markAllAsRead: () => void
  /** Called when leaving Alerts — everything you've seen leaves New for good (including Upcoming). */
  acknowledgeAllAlerts: () => void
  replaceEvents: (events: AlertEvent[]) => void
  setJumuahLastShown: (date: string | null) => void
  /** __DEV__ only — set Upcoming rows' eventAt to 1 min ago for section-transition testing. */
  devBackdateUpcomingAlerts: () => void
}

export function isAlertDue(
  event: AlertEvent,
  nowMs = Date.now(),
  prayers?: PrayerTime[],
) {
  if (new Date(event.eventAt).getTime() <= nowMs) return true

  if (prayers?.length) {
    return isTimetableSlotPassed(prayers, event.time, new Date(nowMs))
  }

  return isTimetableSlotDue(event.time, nowMs)
}

/** Unread alerts — badge increments when a warning is added, clears when Alerts is opened. */
export function countUnreadAlerts(events: AlertEvent[]) {
  return events.filter((event) => !event.read).length
}

const ALERT_EVENTS_STORAGE_KEY = "ALERT_EVENTS"
const JUMUAH_STORAGE_KEY = "JUMUAH_LAST_SHOWN"

function loadPersistedAlertState(): { events: AlertEvent[]; jumuahLastShown: string | null } {
  try {
    const loadedEvents = load<AlertEvent[]>(ALERT_EVENTS_STORAGE_KEY) ?? []
    const persistedEvents = migratePersistedAlertEvents(loadedEvents).map((event) => ({
      ...event,
      acknowledged: event.acknowledged ?? (event.read ?? false),
    }))

    const migratedIds = persistedEvents.map((event) => event.id).join("|")
    const loadedIds = loadedEvents.map((event) => event.id).join("|")

    if (migratedIds !== loadedIds) {
      save(ALERT_EVENTS_STORAGE_KEY, persistedEvents)
    }

    return {
      events: persistedEvents,
      jumuahLastShown: load<string | null>(JUMUAH_STORAGE_KEY) ?? null,
    }
  } catch (error) {
    console.error("[useAlertStore] Failed to load persisted alerts", error)
    return { events: [], jumuahLastShown: null }
  }
}

const { events: persistedEvents, jumuahLastShown: persistedJumuah } = loadPersistedAlertState()

function persistEvents(events: AlertEvent[]) {
  save(ALERT_EVENTS_STORAGE_KEY, events)
}

function persistJumuah(date: string | null) {
  save(JUMUAH_STORAGE_KEY, date)
}

export const useAlertStore = create<AlertState>((set) => ({
  events: persistedEvents,
  jumuahLastShown: persistedJumuah,

  addEvents: (events) =>
    set((state) => {
      const existingKeys = new Set(state.events.map((event) => alertInstanceKey(event)))
      const toAdd = events
        .map((event) => normalizeAlertEvent(event))
        .filter((event) => !existingKeys.has(alertInstanceKey(event)))
        .map((event) => ({
          ...event,
          read: event.read ?? false,
          acknowledged: event.acknowledged ?? false,
        }))

      if (!toAdd.length) return state

      const nextEvents = [...state.events, ...toAdd]
      persistEvents(nextEvents)

      return { events: nextEvents }
    }),

  clear: () => {
    persistEvents([])
    set({ events: [] })
  },

  markAllAsRead: () =>
    set((state) => {
      const nextEvents = state.events.map((event) => ({ ...event, read: true }))
      persistEvents(nextEvents)
      return { events: nextEvents }
    }),

  acknowledgeAllAlerts: () =>
    set((state) => {
      let changed = false
      const nextEvents = state.events.map((event) => {
        if (event.acknowledged) return event
        changed = true
        return { ...event, acknowledged: true, read: true }
      })

      if (!changed) return state

      persistEvents(nextEvents)
      return { events: nextEvents }
    }),

  replaceEvents: (events) => {
    persistEvents(events)
    set({ events })
  },

  setJumuahLastShown: (date) =>
    set(() => {
      persistJumuah(date)
      return { jumuahLastShown: date }
    }),

  devBackdateUpcomingAlerts: () => {
    if (!__DEV__) return

    const nowMs = Date.now()
    const pastAt = new Date(nowMs - 60_000).toISOString()

    set((state) => {
      let changed = false
      const nextEvents = state.events.map((event) => {
        if (isAlertDue(event, nowMs)) return event
        changed = true
        return { ...event, eventAt: pastAt }
      })

      if (!changed) return state

      persistEvents(nextEvents)
      return { events: nextEvents }
    })
  },
}))
