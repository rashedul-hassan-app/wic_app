import { create } from "zustand"

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
  addEvents: (events: AlertEvent[]) => void
  clear: () => void
  markAllAsRead: () => void
}

const ALERT_EVENTS_STORAGE_KEY = "ALERT_EVENTS"
const persistedEvents = load<AlertEvent[]>(ALERT_EVENTS_STORAGE_KEY) ?? []

function persistEvents(events: AlertEvent[]) {
  save(ALERT_EVENTS_STORAGE_KEY, events)
}

export const useAlertStore = create<AlertState>((set) => ({
  events: persistedEvents,

  addEvents: (events) =>
    set((state) => {
      const map = new Map(state.events.map((e) => [e.id, e]))
      events.forEach((e) => map.set(e.id, e))
      const nextEvents = Array.from(map.values())
      persistEvents(nextEvents)
      return { events: nextEvents }
    }),

  clear: () => {
    persistEvents([])
    return set({ events: [] })
  },

  markAllAsRead: () =>
    set((state) => {
      const nextEvents = state.events.map((e) => ({ ...e, read: true }))
      persistEvents(nextEvents)
      return { events: nextEvents }
    }),
}))
