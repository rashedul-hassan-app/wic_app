import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const MosqueScreen: FC = () => {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <Screen
      preset="fixed"
      backgroundColor={colors.background}
      safeAreaEdges={["top"]}
      systemBarStyle="light"
    >
      <View style={themed($header)}>
        <Text style={themed($headerTitle)} weight="bold">Mosque</Text>
      </View>

      <View style={themed($emptyState)}>
        <Ionicons name="business-outline" size={48} color={colors.tintInactive} />
        <Text style={themed($emptyTitle)} weight="semiBold">Coming Soon</Text>
        <Text style={themed($emptySubtitle)}>
          Mosque information, announcements, and events will appear here.
        </Text>
      </View>
    </Screen>
  )
}

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 17,
  color: colors.text,
  letterSpacing: 0.3,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.xxl,
  gap: spacing.md,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  textAlign: "center",
})

const $emptySubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  textAlign: "center",
  lineHeight: 22,
  marginTop: -spacing.xs,
})
