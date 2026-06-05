import { FC, useState } from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { addDays, format, parseISO, subDays } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAlertBadge } from "@/hooks/useAlertBadge"
import { useCurrentPrayer } from "@/hooks/useCurrentPrayer"
import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { getAnnouncementBannerText } from "@/utils/announcementBanner"

import { AnnouncementBanner } from "./components/AnnouncementBanner"
import { DateNavigator } from "./components/DateNavigator"
import { JumuahTable } from "./components/JumuahTable"
import { PrayerInfoCards } from "./components/PrayerInfoCards"
import { PrayerTable } from "./components/PrayerTable"

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

export const PrayerTimesScreen: FC<MainTabScreenProps<"Timetable">> = ({ navigation }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const [selectedDate, setSelectedDate] = useState(todayISO)
  const isToday = selectedDate === todayISO()

  // Prayer data for the browsed date
  const { data, isLoading } = usePrayerTimes(selectedDate)

  // Today's prayer data drives the live info cards (always real-time)
  const { data: todayData } = usePrayerTimes(todayISO())
  const currentPrayer = useCurrentPrayer(todayData?.prayers ?? [])

  const handlePrev = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))

  const handleNext = () => setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))

  const bannerText = getAnnouncementBannerText({
    isToday,
    currentPrayer,
    jumuah: data?.jumuah ?? todayData?.jumuah ?? [],
    staticAnnouncement: data?.announcement ?? null,
  })

  return (
    <Screen
      preset="scroll"
      backgroundColor={colors.background}
      safeAreaEdges={["top"]}
      systemBarStyle="light"
      contentContainerStyle={themed($content)}
    >
      <AppHeader navigation={navigation} />

      {bannerText && <AnnouncementBanner text={bannerText} />}

      <PrayerInfoCards
        currentPrayer={currentPrayer}
        suhoorEnds={todayData?.prayers[0]?.begins ?? "03:47"}
      />

      <DateNavigator
        date={selectedDate}
        isToday={isToday}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {isLoading && !data ? (
        <View style={themed($loadingContainer)}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : data ? (
        <>
          <PrayerTable
            prayers={data.prayers}
            currentPrayerName={isToday ? (currentPrayer?.prayer.name ?? null) : null}
            countdownLabel={isToday ? currentPrayer?.countdownLabel : undefined}
          />
          {data.jumuah.length > 0 && <JumuahTable jumuah={data.jumuah} />}
        </>
      ) : null}

      <Text style={themed($footer)}>Powered by La Rayba™</Text>
    </Screen>
  )
}

function AppHeader({ navigation }: { navigation: MainTabScreenProps<"Timetable">["navigation"] }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const { count } = useAlertBadge()

  return (
    <View style={themed($header)}>
      <TouchableOpacity
        hitSlop={8}
        onPress={() => navigation.navigate("Main", { screen: "Alerts" })}
      >
        <View style={themed($iconWrapper)}>
          <Ionicons name="notifications-outline" size={22} color={colors.tint} />

          {count > 0 && (
            <View style={themed($badge)}>
              <Text style={themed($badgeText)}>{count > 9 ? "9+" : count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Text style={themed($headerTitle)} weight="bold">
        WIC Prayer App
      </Text>
      <View style={$headerRight}>
        <TouchableOpacity hitSlop={8}>
          <Ionicons name="partly-sunny-outline" size={22} color={colors.textDim} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={8} style={themed($menuButton)}>
          <Ionicons name="menu-outline" size={24} color={colors.textDim} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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

const $headerRight: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
}

const $menuButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.xxs,
})

const $iconWrapper: ThemedStyle<ViewStyle> = () => ({
  position: "relative",
  width: 26,
  height: 26,
  justifyContent: "center",
  alignItems: "center",
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xl,
  alignItems: "center",
})

const $footer: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  fontSize: 12,
  marginTop: spacing.lg,
  marginBottom: spacing.md,
})

const $badge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.xs,
})

const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 10,
  lineHeight: 14,
})
