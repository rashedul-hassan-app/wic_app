import { create } from "zustand"

export type AlertEvent = {
  id: string
  title: string
  time: string
  read: boolean
}

type AlertState = {
  events: AlertEvent[]
  addEvents: (events: AlertEvent[]) => void
  clear: () => void
  markAllAsRead: () => void
}

export const useAlertStore = create<AlertState>((set, get) => ({
  events: [],

  addEvents: (events) =>
    set((state) => {
      const map = new Map(state.events.map((e) => [e.id, e]))
      events.forEach((e) => map.set(e.id, e))
      return { events: Array.from(map.values()) }
    }),

  clear: () => set({ events: [] }),
  markAllAsRead: () =>
    set((state) => ({
      events: state.events.map((e) => ({ ...e, read: true })),
    })),
}))
