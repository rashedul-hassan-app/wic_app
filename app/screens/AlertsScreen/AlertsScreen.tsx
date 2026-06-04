import { useEffect, useMemo } from "react"
import { FlatList, View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAlertStore } from "@/stores/useAlertStore"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

export function AlertsScreen() {
  const navigation = useNavigation()

  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  // 🔥 REACTIVE SUBSCRIPTION (FIXES ANDROID BUG)
  const events = useAlertStore((s) => s.events)

  const sorted = useMemo(() => [...events].reverse(), [events])

  const markAllAsRead = useAlertStore((s) => s.markAllAsRead)

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
              navigation.navigate("Main", { screen: "Tabs" })
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text weight="bold" style={themed($title)}>
          Alerts
        </Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={themed($list)}
        ListEmptyComponent={<Text style={themed($empty)}>No alerts yet</Text>}
        renderItem={({ item }) => (
          <View style={themed($card)}>
            <View style={themed($bar)} />
            <View style={{ flex: 1 }}>
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
  padding: spacing.md,
  gap: spacing.md,
})

const $title: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
})

const $list: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: spacing.md,
  marginBottom: spacing.sm,
  padding: spacing.md,
  borderRadius: spacing.sm,
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.08)",
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

const $empty: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.md,
  opacity: 0.5,
})
