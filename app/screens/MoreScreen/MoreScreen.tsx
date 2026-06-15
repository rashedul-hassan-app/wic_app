import { FC } from "react"
import { Share, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const MoreScreen: FC = () => {
  const { themed, theme: { colors } } = useAppTheme()
  const navigation = useNavigation<NavigationProp<AppStackParamList>>()

  const handleShareApp = async () => {
    await Share.share({
      message: "Check out the WIC Prayer App for accurate prayer times.",
    })
  }

  const handleAdminLogin = () => {
    navigation.navigate("AdminLogin")
  }

  return (
    <Screen
      preset="scroll"
      backgroundColor={colors.background}
      safeAreaEdges={["top"]}
      systemBarStyle="light"
    >
      <View style={themed($header)}>
        <Text style={themed($headerTitle)} weight="bold">More</Text>
      </View>

      <View style={themed($section)}>
        <SettingsRow
          icon="share-social-outline"
          label="Share App"
          onPress={handleShareApp}
        />
        <SettingsRow
          icon="shield-outline"
          label="Admin Login"
          onPress={handleAdminLogin}
          isLast
        />
      </View>

      <Text style={themed($footer)}>Version 1.0.0 • Powered by La Rayba™</Text>
    </Screen>
  )
}

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"]
  label: string
  onPress: () => void
  isLast?: boolean
}

function SettingsRow({ icon, label, onPress, isLast = false }: SettingsRowProps) {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <TouchableOpacity
      style={[themed($row), !isLast && themed($rowBorder)]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={themed($rowIcon)}>
        <Ionicons name={icon} size={20} color={colors.tint} />
      </View>
      <Text style={themed($rowLabel)} weight="medium">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </TouchableOpacity>
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

const $section: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden",
})

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
})

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $rowIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: colors.tintSubtle,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.xxs,
})

const $rowLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.text,
  fontSize: 15,
})

const $footer: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  fontSize: 12,
  marginTop: spacing.xxl,
})
