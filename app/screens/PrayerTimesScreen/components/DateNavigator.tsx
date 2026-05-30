import { TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { parseISO } from "date-fns"
import { Ionicons } from "@expo/vector-icons"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatHijriDate } from "@/utils/hijriDate"
import { formatDisplayDate } from "@/utils/prayerTime"

interface DateNavigatorProps {
  date: string
  isToday: boolean
  onPrev: () => void
  onNext: () => void
}

export function DateNavigator({ date, isToday, onPrev, onNext }: DateNavigatorProps) {
  const { themed, theme: { colors } } = useAppTheme()

  const gregorian = formatDisplayDate(date)
  const hijri = formatHijriDate(parseISO(date))

  return (
    <View style={themed($container)}>
      <TouchableOpacity onPress={onPrev} hitSlop={12} style={themed($arrowButton)}>
        <Ionicons name="chevron-back" size={18} color={colors.textDim} />
      </TouchableOpacity>

      <View style={themed($dateCenter)}>
        <View style={$titleRow}>
          <Text style={themed($gregorianText)} weight="semiBold">
            {gregorian}
          </Text>
          {isToday && (
            <View style={themed($todayBadge)}>
              <Text style={themed($todayBadgeText)} weight="bold">Today</Text>
            </View>
          )}
        </View>
        {hijri ? (
          <Text style={themed($hijriText)}>{hijri}</Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={onNext} hitSlop={12} style={themed($arrowButton)}>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </TouchableOpacity>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  marginHorizontal: spacing.md,
  marginVertical: spacing.xs,
  borderRadius: 10,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $arrowButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $dateCenter: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $titleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
}

const $gregorianText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 13,
  letterSpacing: 0.3,
})

const $hijriText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  marginTop: 2,
})

const $todayBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 4,
  paddingHorizontal: spacing.xs,
  paddingVertical: 1,
})

const $todayBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 10,
  letterSpacing: 0.3,
})
