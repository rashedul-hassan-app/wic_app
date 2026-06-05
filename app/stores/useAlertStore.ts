import { create } from "zustand"

import {
  alertInstanceKey,
  migratePersistedAlertEvents,
  normalizeAlertEvent,
} from "@/services/notifications/alertEventIds"
import { load, save } from "@/utils/storage"

export type AlertEvent = {
  id: string
  title: string
  time: string
  eventAt: string
  read?: boolean
}

type AlertState = {
  events: AlertEvent[]
  jumuahLastShown: string | null

  addEvents: (events: AlertEvent[]) => void
  clear: () => void
  markAllAsRead: () => void
  setJumuahLastShown: (date: string | null) => void
}

const ALERT_EVENTS_STORAGE_KEY = "ALERT_EVENTS"
const JUMUAH_STORAGE_KEY = "JUMUAH_LAST_SHOWN"

const loadedEvents = load<AlertEvent[]>(ALERT_EVENTS_STORAGE_KEY) ?? []
const persistedEvents = migratePersistedAlertEvents(loadedEvents)

const migratedIds = persistedEvents.map((event) => event.id).join("|")
const loadedIds = loadedEvents.map((event) => event.id).join("|")

if (migratedIds !== loadedIds) {
  save(ALERT_EVENTS_STORAGE_KEY, persistedEvents)
}
const persistedJumuah = load<string | null>(JUMUAH_STORAGE_KEY) ?? null

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
        .map((event) => ({ ...event, read: event.read ?? false }))

      if (!toAdd.length) return state

      const nextEvents = [...state.events, ...toAdd]
      persistEvents(nextEvents)

      return { events: nextEvents }
    }),

  clear: () => {
    persistEvents([])
    return set({ events: [] })
  },

  markAllAsRead: () =>
    set((state) => {
      const nextEvents = state.events.map((event) => ({ ...event, read: true }))
      persistEvents(nextEvents)
      return { events: nextEvents }
    }),

  setJumuahLastShown: (date) =>
    set(() => {
      persistJumuah(date)
      return { jumuahLastShown: date }
    }),
}))
