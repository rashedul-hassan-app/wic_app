import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AnnouncementBannerProps {
  text: string
}

export function AnnouncementBanner({ text }: AnnouncementBannerProps) {
  const { themed } = useAppTheme()

  return (
    <View style={themed($banner)}>
      <Text style={themed($bannerText)} weight="medium">
        {text}
      </Text>
    </View>
  )
}

const $banner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
})

const $bannerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  textAlign: "center",
  fontSize: 13,
})
