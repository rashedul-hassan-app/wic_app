import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SectionList, View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { format, parseISO } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import type { MainStackParamList } from "@/navigators/navigationTypes"
import {
  alertInstanceKey,
  alertInstanceKeyFromParts,
} from "@/services/notifications/alertEventIds"
import { getUpcomingAlertEvents } from "@/services/notifications/prayerNotificationScheduler"
import type { AlertEvent } from "@/stores/useAlertStore"
import { useAlertStore } from "@/stores/useAlertStore"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

const HEADER_HEIGHT = 48

type AlertsRoute = RouteProp<MainStackParamList, "Alerts">

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

function isToday(eventAt: string) {
  return format(parseISO(eventAt), "yyyy-MM-dd") === todayISO()
}

function sortByEventAtDesc(a: AlertEvent, b: AlertEvent) {
  return new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
}

function sortByEventAtAsc(a: AlertEvent, b: AlertEvent) {
  return new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime()
}

export function AlertsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const route = useRoute<AlertsRoute>()
  const highlightEventId = route.params?.highlightEventId
  const listRef = useRef<SectionList>(null)
  const [now, setNow] = useState(() => Date.now())

  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const events = useAlertStore((s) => s.events)
  const clearAlerts = useAlertStore((s) => s.clear)
  const { data: todayPrayerTimes } = usePrayerTimes(todayISO())
  const isFocusedRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const markReadIfNeeded = useCallback(() => {
    const store = useAlertStore.getState()
    if (store.events.some((event) => !event.read)) {
      store.markAllAsRead()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true
      markReadIfNeeded()

      return () => {
        isFocusedRef.current = false
      }
    }, [markReadIfNeeded]),
  )

  useEffect(() => {
    if (isFocusedRef.current) markReadIfNeeded()
  }, [events, markReadIfNeeded])

  const highlightKey = highlightEventId ? alertInstanceKeyFromParts(highlightEventId, "") : null

  const sections = useMemo(() => {
    const storedKeys = new Set(events.map((event) => alertInstanceKey(event)))
    const nowDate = new Date(now)

    const upcoming =
      todayPrayerTimes && todayPrayerTimes.date === todayISO()
        ? getUpcomingAlertEvents(todayPrayerTimes, nowDate)
            .filter((event) => !storedKeys.has(alertInstanceKey(event)))
            .sort(sortByEventAtAsc)
        : []

    const newAlerts = events
      .filter((event) => !event.read && new Date(event.eventAt).getTime() <= now)
      .sort(sortByEventAtDesc)

    const recent = events
      .filter((event) => event.read && isToday(event.eventAt))
      .sort(sortByEventAtDesc)

    const older = events
      .filter((event) => event.read && !isToday(event.eventAt))
      .sort(sortByEventAtDesc)

    const result: { title: string; data: AlertEvent[] }[] = []

    if (newAlerts.length) result.push({ title: "New", data: newAlerts })
    if (upcoming.length) result.push({ title: "Upcoming", data: upcoming })
    if (recent.length) result.push({ title: "Recent", data: recent })
    if (older.length) result.push({ title: "Older", data: older })

    return result
  }, [events, now, todayPrayerTimes])

  useEffect(() => {
    if (!highlightEventId) return

    const sectionIndex = sections.findIndex((section) =>
      section.data.some(
        (event) =>
          event.id === highlightEventId ||
          (highlightKey != null &&
            alertInstanceKeyFromParts(event.id, event.time) === highlightKey),
      ),
    )
    if (sectionIndex === -1) return

    const itemIndex = sections[sectionIndex].data.findIndex(
      (event) =>
        event.id === highlightEventId ||
        (highlightKey != null && alertInstanceKeyFromParts(event.id, event.time) === highlightKey),
    )

    const timer = setTimeout(() => {
      listRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex,
        animated: true,
        viewOffset: 8,
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [highlightEventId, highlightKey, sections])

  return (
    <Screen preset="fixed" backgroundColor={colors.background} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate("Tabs")
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text weight="bold" style={themed($title)}>
          Alerts
        </Text>

        <TouchableOpacity onPress={clearAlerts} hitSlop={8} style={themed($clearButton)}>
          <Text weight="medium" style={themed($clearText)}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={themed($list)}
        ListEmptyComponent={
          <View style={themed($emptyContainer)}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.tintInactive} />
            <Text style={themed($empty)} weight="semiBold">
              No alerts yet
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={themed($sectionHeader)}>
            <Text weight="bold">{title}</Text>
          </View>
        )}
        renderItem={({ item, section }) => {
          const isHighlighted =
            item.id === highlightEventId ||
            (highlightKey != null && alertInstanceKeyFromParts(item.id, item.time) === highlightKey)
          const isUpcoming = section.title === "Upcoming"

          return (
            <View
              style={[
                themed($card),
                isHighlighted && themed($highlightedCard),
                isHighlighted && { borderColor: colors.tint, backgroundColor: colors.elevated },
                isUpcoming && themed($upcomingCard),
              ]}
            >
              <View style={themed($iconWrapper)}>
                <Ionicons
                  name={isUpcoming ? "time-outline" : "alarm-outline"}
                  size={30}
                  color={colors.tint}
                />
              </View>
              <View style={themed($bar)} />
              <View style={themed($itemContent)}>
                <Text weight="medium">{item.title}</Text>
                <Text style={themed($time)}>{item.time}</Text>
              </View>
            </View>
          )
        }}
      />
    </Screen>
  )
}

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.md,
  height: HEADER_HEIGHT,
})

const $title: ThemedStyle<TextStyle> = () => ({
  fontSize: 17,
})

const $list: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: spacing.md,
  marginBottom: spacing.sm,
  padding: spacing.md,
  borderRadius: spacing.sm,
  gap: spacing.md,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $upcomingCard: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.85,
})

const $highlightedCard: ThemedStyle<ViewStyle> = () => ({
  borderWidth: 2,
})

const $bar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: "100%",
  backgroundColor: colors.tint,
  marginRight: 10,
})

const $time: ThemedStyle<TextStyle> = () => ({
  fontSize: 12,
  opacity: 0.6,
  marginTop: 2,
})

const $itemContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $iconWrapper: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: "rgba(0,0,0,0.04)",
  justifyContent: "center",
  alignItems: "center",
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.xs,
})

const $clearButton: ThemedStyle<ViewStyle> = () => ({
  marginLeft: "auto",
})

const $clearText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 14,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  alignItems: "center",
  gap: spacing.md,
})

const $empty: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.text,
})
