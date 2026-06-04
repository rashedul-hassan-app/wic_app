import { useEffect, useMemo } from "react"
import { SectionList, View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { MainStackParamList } from "@/navigators/navigationTypes"
import { useAlertStore } from "@/stores/useAlertStore"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

const HEADER_HEIGHT = 48

export function AlertsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()

  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  // 🔥 REACTIVE SUBSCRIPTION (FIXES ANDROID BUG)
  const events = useAlertStore((s) => s.events)

  const sorted = useMemo(() => [...events].reverse(), [events])
  const now = useMemo(() => new Date(), [])
  const upcomingEvents = useMemo(
    () =>
      sorted.filter((event) => {
        if (!event.eventAt) return false
        return new Date(event.eventAt) >= now
      }),
    [sorted, now],
  )
  const olderEvents = useMemo(
    () =>
      sorted.filter((event) => {
        if (!event.eventAt) return true
        return new Date(event.eventAt) < now
      }),
    [sorted, now],
  )
  const sections = useMemo(
    () => [
      ...(upcomingEvents.length ? [{ title: "Upcoming", data: upcomingEvents }] : []),
      ...(olderEvents.length ? [{ title: "Older", data: olderEvents }] : []),
    ],
    [upcomingEvents, olderEvents],
  )

  const markAllAsRead = useAlertStore((s) => s.markAllAsRead)
  const clearAlerts = useAlertStore((s) => s.clear)

  useEffect(() => {
    return () => {
      markAllAsRead()
    }
  }, [markAllAsRead])

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
        renderItem={({ item, section }) => (
          <View style={themed($card)}>
            <View style={themed($iconWrapper)}>
              <Ionicons
                name="alarm-outline"
                size={30}
                color={section.title === "Older" ? colors.tintInactive : colors.tint}
              />
            </View>
            <View style={themed($bar)} />
            <View style={themed($itemContent)}>
              <Text weight="medium">{item.title}</Text>
              <Text style={themed($time)}>{item.time}</Text>
            </View>
          </View>
        )}
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

const $iconWrapper: ThemedStyle<ViewStyle> = ({ spacing: _spacing }) => ({
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

const $clearButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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
