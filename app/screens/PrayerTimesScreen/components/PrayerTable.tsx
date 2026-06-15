import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import type { PrayerName, PrayerTime } from "@/models/prayer.types"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatPrayerTime } from "@/utils/prayerTime"

interface PrayerTableProps {
  prayers: PrayerTime[]
  currentPrayerName: PrayerName | null
  countdownLabel?: string
}

export function PrayerTable({ prayers, currentPrayerName, countdownLabel }: PrayerTableProps) {
  const { themed } = useAppTheme()

  return (
    <View style={themed($container)}>
      <TableHeader />
      {prayers.map((prayer, index) => (
        <PrayerRow
          key={prayer.name}
          prayer={prayer}
          isActive={prayer.name === currentPrayerName}
          countdownLabel={prayer.name === currentPrayerName ? countdownLabel : undefined}
          isLast={index === prayers.length - 1}
        />
      ))}
    </View>
  )
}

function TableHeader() {
  const { themed } = useAppTheme()

  return (
    <View style={themed($headerRow)}>
      <Text style={[themed($headerCell), $nameCell]}>PRAYER</Text>
      <Text style={[themed($headerCell), $timeCell]}>BEGINS</Text>
      <Text style={[themed($headerCell), $timeCell]}>JAMA'AH</Text>
    </View>
  )
}

interface PrayerRowProps {
  prayer: PrayerTime
  isActive: boolean
  countdownLabel?: string
  isLast: boolean
}

function PrayerRow({ prayer, isActive, countdownLabel, isLast }: PrayerRowProps) {
  const { themed, theme: { colors } } = useAppTheme()

  const rowStyle = [
    themed($row),
    isActive && { backgroundColor: colors.tint },
    !isLast && themed($rowBorder),
  ]

  const textColor = isActive ? colors.background : colors.text
  const dimTextColor = isActive ? colors.background : colors.textDim

  return (
    <View style={rowStyle}>
      <View style={[$nameCell, $rowNameInner]}>
        <Text style={[$cellText, { color: textColor }]} weight={isActive ? "semiBold" : "normal"}>
          {prayer.label}
        </Text>
        {countdownLabel && (
          <View style={themed($countdownBadge)}>
            <Text style={themed($countdownText)} weight="medium">
              {countdownLabel} left
            </Text>
          </View>
        )}
      </View>
      <Text style={[$timeCell, $cellText, { color: textColor }]}>
        {formatPrayerTime(prayer.begins)}
      </Text>
      <Text style={[$timeCell, $cellText, { color: prayer.jamaah ? textColor : dimTextColor }]}>
        {prayer.jamaah ? formatPrayerTime(prayer.jamaah) : "—"}
      </Text>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.xs,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden",
})

const $headerRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.elevated,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  paddingVertical: 14,
  paddingHorizontal: spacing.sm,
})

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $headerCell: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
})

// flex works in both View and Text contexts
const $nameCell = { flex: 2.2 }
const $timeCell: TextStyle = { flex: 1, textAlign: "right" }

const $rowNameInner: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const $cellText: TextStyle = {
  fontSize: 15,
}

const $countdownBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 20,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
})

const $countdownText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tintLight,
  fontSize: 10,
})
