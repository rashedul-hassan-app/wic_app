import { useAlertStore } from "@/stores/useAlertStore"

export function useAlertBadge() {
  const events = useAlertStore((s) => s.events)
  const unread = events.filter((e) => !e.read).length
  return {
    count: unread,
    hasUnread: unread > 0,
  }
}