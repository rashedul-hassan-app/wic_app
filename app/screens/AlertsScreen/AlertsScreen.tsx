import { useCallback, useEffect, useMemo, useRef } from "react"
import { SectionList, View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { MainStackParamList } from "@/navigators/navigationTypes"
import { alertInstanceKeyFromParts } from "@/services/notifications/alertEventIds"
import { useAlertStore } from "@/stores/useAlertStore"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

const HEADER_HEIGHT = 48

type AlertsRoute = RouteProp<MainStackParamList, "Alerts">

export function AlertsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const route = useRoute<AlertsRoute>()
  const highlightEventId = route.params?.highlightEventId
  const listRef = useRef<SectionList>(null)

  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const events = useAlertStore((s) => s.events)
  const clearAlerts = useAlertStore((s) => s.clear)
  const isFocusedRef = useRef(false)

  const markReadIfNeeded = useCallback(() => {
    const store = useAlertStore.getState()
    if (store.events.some((event) => !event.read)) {
      store.markAllAsRead()
    }
  }, [])

  // Mark read on focus AND whenever new alerts arrive while focused — covers the case
  // where an alert (e.g. opened via notification) is added to the store just after focus.
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
    const sorted = [...events].sort(
      (a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime(),
    )

    if (!sorted.length) return []

    return [{ title: "", data: sorted }]
  }, [events])

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
        renderSectionHeader={({ section: { title } }) =>
          title ? (
            <View style={themed($sectionHeader)}>
              <Text weight="bold">{title}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isHighlighted =
            item.id === highlightEventId ||
            (highlightKey != null && alertInstanceKeyFromParts(item.id, item.time) === highlightKey)

          return (
            <View
              style={[
                themed($card),
                isHighlighted && themed($highlightedCard),
                isHighlighted && { borderColor: colors.tint, backgroundColor: colors.elevated },
              ]}
            >
              <View style={themed($iconWrapper)}>
                <Ionicons name="alarm-outline" size={30} color={colors.tint} />
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
  paddingVertical: spacing.sm,
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
