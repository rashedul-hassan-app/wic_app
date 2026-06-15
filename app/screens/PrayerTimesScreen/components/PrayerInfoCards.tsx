import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import type { CurrentPrayerInfo } from "@/hooks/useCurrentPrayer"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatPrayerTime } from "@/utils/prayerTime"

interface PrayerInfoCardsProps {
  currentPrayer: CurrentPrayerInfo | null
  /** Fajr begins time in 24h format — defines when Suhoor ends */
  suhoorEnds: string
}

export function PrayerInfoCards({ currentPrayer, suhoorEnds }: PrayerInfoCardsProps) {
  const { themed } = useAppTheme()

  return (
    <View style={themed($row)}>
      <InfoCard
        label="Now"
        title={currentPrayer?.prayer.label ?? "—"}
        subtitle={currentPrayer ? `${currentPrayer.countdownLabel} left` : ""}
        isActive
      />
      <InfoCard
        label="Next Jama'ah"
        title={currentPrayer?.nextJamaah?.prayer.label ?? "—"}
        subtitle={currentPrayer?.nextJamaah ? `${currentPrayer.nextJamaah.countdownLabel} left` : ""}
      />
      <InfoCard
        label="Suhoor Ends"
        title={formatPrayerTime(suhoorEnds)}
        subtitle=""
      />
    </View>
  )
}

interface InfoCardProps {
  label: string
  title: string
  subtitle: string
  isActive?: boolean
}

function InfoCard({ label, title, subtitle, isActive = false }: InfoCardProps) {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <View style={[themed($card), isActive && { borderColor: colors.tint, borderWidth: 1 }]}>
      <Text style={themed($cardLabel)}>{label}</Text>
      <Text style={[themed($cardTitle), isActive && { color: colors.tintLight }]} weight="semiBold">
        {title}
      </Text>
      {subtitle ? (
        <Text style={themed($cardSubtitle)}>{subtitle}</Text>
      ) : null}
    </View>
  )
}

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.xs,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.surface,
  borderRadius: 10,
  padding: spacing.sm,
  borderColor: colors.border,
  borderWidth: 1,
  minHeight: 74,
  justifyContent: "center",
})

const $cardLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 10,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  marginBottom: 3,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  lineHeight: 18,
})

const $cardSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  marginTop: 2,
})
