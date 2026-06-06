import { countUnreadAlerts, useAlertStore } from "@/stores/useAlertStore"

export function useAlertBadge() {
  const events = useAlertStore((s) => s.events)
  const count = countUnreadAlerts(events)

  return {
    count,
    hasUnread: count > 0,
  }
}
