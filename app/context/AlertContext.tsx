import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react"
import { format } from "date-fns"

import type { PrayerAlert } from "@/models/alert.types"
import { alertService } from "@/services/prayer/AlertService"

interface AlertsContextValue {
  alerts: PrayerAlert[]
  unreadCount: number
  markAllRead: () => void
  refreshAlerts: () => Promise<void>
}

const AlertsContext = createContext<AlertsContextValue | null>(null)

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<PrayerAlert[]>([])

  const refreshAlerts = useCallback(async () => {
    const generated = await alertService.getAlerts(todayISO())

    setAlerts(generated)
  }, [])

  useEffect(() => {
    refreshAlerts()
  }, [refreshAlerts])

  const markAllRead = useCallback(() => {
    setAlerts((current) =>
      current.map((alert) => ({
        ...alert,
        read: true,
      })),
    )
  }, [])

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts])

  const value = useMemo(
    () => ({
      alerts,
      unreadCount,
      markAllRead,
      refreshAlerts,
    }),
    [alerts, unreadCount, markAllRead, refreshAlerts],
  )

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlertsContext() {
  const context = useContext(AlertsContext)

  if (!context) {
    throw new Error("useAlertsContext must be used inside AlertsProvider")
  }

  return context
}
