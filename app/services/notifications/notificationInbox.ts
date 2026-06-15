import { Platform } from "react-native"

import * as storage from "@/utils/storage"

const INBOX_KEY = "prayerNotifications.inbox"
const INBOX_EVENT = "wic-inbox-change"

export interface InboxNotification {
  id: string
  body: string
  prayerName: string
  createdAt: number
  read: boolean
}

function useLocalStorage(): boolean {
  return Platform.OS === "web" && typeof globalThis.localStorage !== "undefined"
}

function loadRaw(): InboxNotification[] {
  try {
    if (useLocalStorage()) {
      const raw = globalThis.localStorage.getItem(INBOX_KEY)
      if (!raw) return []
      return JSON.parse(raw) as InboxNotification[]
    }

    return storage.load<InboxNotification[]>(INBOX_KEY) ?? []
  } catch {
    return []
  }
}

function saveRaw(items: InboxNotification[]): void {
  try {
    if (useLocalStorage()) {
      globalThis.localStorage.setItem(INBOX_KEY, JSON.stringify(items))
      return
    }

    storage.save(INBOX_KEY, items)
  } catch {
    // ignore write failures
  }
}

export function getInboxNotifications(): InboxNotification[] {
  return loadRaw().sort((a, b) => b.createdAt - a.createdAt)
}

export function getUnreadCount(): number {
  return loadRaw().filter((item) => !item.read).length
}

export function addInboxNotification(params: {
  body: string
  prayerName: string
}): InboxNotification {
  const item: InboxNotification = {
    id: `${Date.now()}-${params.prayerName}`,
    body: params.body,
    prayerName: params.prayerName,
    createdAt: Date.now(),
    read: false,
  }

  saveRaw([item, ...loadRaw()])
  dispatchInboxChange()
  return item
}

export function markAllInboxRead(): void {
  const items = loadRaw().map((item) => ({ ...item, read: true }))
  saveRaw(items)
  dispatchInboxChange()
}

export function markInboxRead(id: string): void {
  const items = loadRaw().map((item) => (item.id === id ? { ...item, read: true } : item))
  saveRaw(items)
  dispatchInboxChange()
}

const inboxListeners = new Set<() => void>()

export function dispatchInboxChange(): void {
  inboxListeners.forEach((listener) => listener())
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INBOX_EVENT))
  }
}

export function subscribeInboxChange(listener: () => void): () => void {
  inboxListeners.add(listener)

  if (typeof window !== "undefined") {
    window.addEventListener(INBOX_EVENT, listener)
    window.addEventListener("storage", listener)
  }

  return () => {
    inboxListeners.delete(listener)
    if (typeof window !== "undefined") {
      window.removeEventListener(INBOX_EVENT, listener)
      window.removeEventListener("storage", listener)
    }
  }
}
