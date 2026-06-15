import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import type { JumuahTime } from "@/models/prayer.types"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatPrayerTime } from "@/utils/prayerTime"

interface JumuahTableProps {
  jumuah: JumuahTime[]
}

export function JumuahTable({ jumuah }: JumuahTableProps) {
  const { themed } = useAppTheme()

  if (!jumuah.length) return null

  return (
    <View style={themed($container)}>
      <View style={themed($headerRow)}>
        <Text style={[themed($headerCell), $nameCellText]}>PRAYER</Text>
        <Text style={[themed($headerCell), themed($timeCell)]}>KHUTBAH</Text>
        <Text style={[themed($headerCell), themed($timeCell)]}>JAMA'AH</Text>
      </View>

      {jumuah.map((item, index) => (
        <View
          key={item.id}
          style={[
            themed($row),
            index < jumuah.length - 1 && themed($rowBorder),
          ]}
        >
          <Text style={[$nameCellText, $cellText]} weight="medium">
            {item.label}
          </Text>
          <Text style={[themed($timeCell), $cellText]}>
            {formatPrayerTime(item.khutbah)}
          </Text>
          <Text style={[themed($timeCell), $cellText]}>
            {formatPrayerTime(item.jamaah)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.sm,
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
})

// Used on View (header) and Text (body) — flex works in both contexts
const $nameCellText: TextStyle = { flex: 2.2 }

const $timeCell: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  textAlign: "right",
  color: colors.text,
})

const $cellText: TextStyle = {
  fontSize: 15,
}
