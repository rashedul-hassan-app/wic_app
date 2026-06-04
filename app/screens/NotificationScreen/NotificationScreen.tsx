import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface NotificationScreenProps extends AppStackScreenProps<"Notifications"> {}

export const NotificationScreen: FC<NotificationScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Screen
      preset="scroll"
      backgroundColor={colors.background}
      safeAreaEdges={["top", "bottom"]}
      systemBarStyle="light"
      contentContainerStyle={themed($container)}
    >
      <View style={themed($header)}>
        <PressableIcon
          icon="back"
          size={20}
          color={colors.textDim}
          onPress={() => navigation.goBack()}
        />
        <Text style={themed($headerTitle)} weight="bold">
          Notifications
        </Text>
        <View style={$headerSpacer} />
      </View>

      <View style={themed($emptyState)}>
        <View style={themed($emptyIcon)}>
          <Ionicons name="notifications-outline" size={34} color={colors.tint} />
        </View>
        <Text style={themed($emptyTitle)} weight="bold">
          No notifications yet
        </Text>
        <Text style={themed($emptyText)}>
          Prayer reminders and mosque updates will appear here.
        </Text>
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  textAlign: "center",
  fontSize: 17,
  color: colors.text,
  letterSpacing: 0.3,
})

const $headerSpacer: ViewStyle = {
  width: 20,
}

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.xxxl,
})

const $emptyIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 72,
  height: 72,
  borderRadius: 18,
  backgroundColor: colors.tintSubtle,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 18,
  marginBottom: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
  lineHeight: 20,
  textAlign: "center",
})
