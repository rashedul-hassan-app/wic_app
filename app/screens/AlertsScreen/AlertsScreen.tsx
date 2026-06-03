import { useEffect, useMemo, useState } from "react"
import { TouchableOpacity, View, TextStyle, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { parseISO, isAfter, differenceInCalendarDays } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAlerts } from "@/hooks/useAlerts"
import { alertService } from "@/services/prayer/AlertService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type LocalPrayerAlert = {
  id: string
  title: string
  time: string
  read: boolean
  type: "prayer" | "jumuah"
}

export function AlertsScreen() {
  const navigation = useNavigation()
  const { alerts, markAllRead } = useAlerts()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  // olderAlerts holds alerts generated from previous days (not today's context alerts)
  const [olderAlerts, setOlderAlerts] = useState<Array<LocalPrayerAlert & { date: string }>>([])

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  useEffect(() => {
    let mounted = true

    async function loadOlder() {
      // fetch last 13 days (excluding today)
      const today = new Date()
      const dates: string[] = []
      for (let i = 1; i <= 13; i++) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        dates.push(d.toISOString().slice(0, 10))
      }

      const results = await Promise.all(dates.map((d) => alertService.getAlerts(d)))

      const items: Array<LocalPrayerAlert & { date: string }> = []
      results.forEach((alertsForDate, index) => {
        const date = dates[index]
        alertsForDate.forEach((alert) => items.push({ ...alert, date }))
      })

      if (mounted) setOlderAlerts(items)
    }

    loadOlder()
    return () => {
      mounted = false
    }
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)

  const combined = useMemo(() => {
    // attach today's alerts with today's date
    const todays = alerts.map((a) => ({ ...a, date: todayIso }))
    return [...todays, ...olderAlerts]
  }, [alerts, olderAlerts, todayIso])

  const groups = useMemo(() => {
    const now = new Date()
    const upcoming: Array<LocalPrayerAlert & { date: string }> = []
    const last7: Array<LocalPrayerAlert & { date: string }> = []
    const older: Array<LocalPrayerAlert & { date: string }> = []

    combined.forEach((item) => {
      const day = parseISO(item.date)
      const daysDiff = differenceInCalendarDays(now, day)

      // parse time (HH:mm) to check future
      const [h, m] = item.time.split(":").map(Number)
      const dt = new Date(item.date + "T00:00:00")
      dt.setHours(h, m, 0, 0)

      if (item.date === todayIso && isAfter(dt, now)) {
        upcoming.push(item)
      } else if (daysDiff <= 7) {
        last7.push(item)
      } else {
        older.push(item)
      }
    })

    // sort upcoming by time asc, others by date desc
    upcoming.sort((a, b) => a.time.localeCompare(b.time))
    last7.sort((a, b) => b.date.localeCompare(a.date))
    older.sort((a, b) => b.date.localeCompare(a.date))

    return { upcoming, last7, older }
  }, [combined, todayIso])

  return (
    <Screen preset="scroll" backgroundColor={colors.background} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack?.()) {
              navigation.goBack()
            } else {
              // navigate to the main tabs
              // prefer top-level Main route then Tabs inside it
              // @ts-ignore
              navigation.navigate("Main", { screen: "Tabs" })
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.tint} />
        </TouchableOpacity>

        <Text style={themed($headerTitle)} weight="bold">
          Alerts
        </Text>
      </View>

      {/* Upcoming */}
      <View style={themed($section)}>
        <Text style={themed($sectionHeader)} weight="bold">
          Upcoming
        </Text>
        {groups.upcoming.length ? (
          groups.upcoming.map((alert, i) => (
            <View
              key={alert.id}
              style={[themed($row), i < groups.upcoming.length - 1 && themed($rowBorder)]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.tint} />
              <View style={themed($rowContent)}>
                <Text weight="medium">{alert.title}</Text>
                <Text style={themed($time)}>{alert.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={themed($muted)}>No upcoming notifications</Text>
        )}
      </View>

      {/* Last 7 days */}
      <View style={themed($section)}>
        <Text style={themed($sectionHeader)} weight="bold">
          Last 7 days
        </Text>
        {groups.last7.length ? (
          groups.last7.map((alert, i) => (
            <View
              key={`${alert.id}-${alert.date}`}
              style={[themed($row), i < groups.last7.length - 1 && themed($rowBorder)]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.tint} />
              <View style={themed($rowContent)}>
                <Text weight="medium">{alert.title}</Text>
                <Text style={themed($time)}>
                  {alert.time} • {alert.date}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={themed($muted)}>No notifications in the last 7 days</Text>
        )}
      </View>

      {/* Older */}
      <View style={themed($section)}>
        <Text style={themed($sectionHeader)} weight="bold">
          Older
        </Text>
        {groups.older.length ? (
          <>
            {groups.older.slice(0, 5).map((alert, i) => (
              <View
                key={`${alert.id}-${alert.date}`}
                style={[
                  themed($row),
                  i < Math.min(groups.older.length, 5) - 1 && themed($rowBorder),
                ]}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.tint} />
                <View style={themed($rowContent)}>
                  <Text weight="medium">{alert.title}</Text>
                  <Text style={themed($time)}>
                    {alert.time} • {alert.date}
                  </Text>
                </View>
              </View>
            ))}
            {groups.older.length > 5 ? (
              <Text style={themed($summary)}>
                +{groups.older.length - 5} more older notifications
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={themed($muted)}>No older notifications</Text>
        )}
      </View>
    </Screen>
  )
}
const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  borderRadius: 10,
  borderWidth: 1,
  overflow: "hidden",
})

const $sectionHeader: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.elevated,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  color: colors.textDim,
  fontSize: 12,
})

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  paddingVertical: 14,
  paddingHorizontal: spacing.sm,
  gap: spacing.md,
})

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $rowContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $time: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.sm,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 17,
})

const $muted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  padding: 12,
})

const $summary: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginHorizontal: spacing.sm,
  marginVertical: spacing.xs,
  fontSize: 12,
})
