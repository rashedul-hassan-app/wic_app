import { useEffect, useRef } from "react"
import { Animated, View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { useCountdown } from "@/hooks/useCountdown"
import type { PrayerTime } from "@/models/prayer.types"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatPrayerTime } from "@/utils/prayerTime"

interface CountdownDisplayProps {
  prayers: PrayerTime[]
}

export function CountdownDisplay({ prayers }: CountdownDisplayProps) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const countdown = useCountdown(prayers)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const isUrgent =
    countdown !== null && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds < 60

  useEffect(() => {
    if (isUrgent) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      )
      animation.start()
      return () => animation.stop()
    }

    pulseAnim.setValue(1)
    return undefined
  }, [isUrgent, pulseAnim])

  if (!countdown) return null

  const animatedStyle = { opacity: pulseAnim } as object

  return (
    <View style={themed($container)}>
      <Text style={themed($label)}>NEXT PRAYER</Text>

      <Text style={themed($prayerName)} weight="semiBold">
        {countdown.nextPrayer.label}
      </Text>

      <Animated.View style={animatedStyle}>
        <Text
          style={[themed($countdownText), isUrgent && ({ color: colors.error } as TextStyle)]}
          weight="bold"
        >
          {countdown.formatted}
        </Text>
      </Animated.View>

      <Text style={themed($beginsAt)}>
        begins at {formatPrayerTime(countdown.nextPrayer.begins)}
      </Text>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.sm,
  backgroundColor: colors.surface,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.tint,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  alignItems: "center",
})

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 2,
})

const $prayerName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 20,
  marginBottom: spacing.xs,
})

const $countdownText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tintLight,
  fontSize: 48,
  letterSpacing: 4,
  marginVertical: spacing.xxs,
  fontVariant: ["tabular-nums"],
})

const $beginsAt: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: spacing.xxs,
})
