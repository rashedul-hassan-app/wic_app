import { FC, useState } from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { addDays, format, parseISO, subDays } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useNotifications } from "@/context/NotificationContext"
import { useCurrentPrayer } from "@/hooks/useCurrentPrayer"
import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AnnouncementBanner } from "./components/AnnouncementBanner"
import { DateNavigator } from "./components/DateNavigator"
import { JumuahTable } from "./components/JumuahTable"
import { PrayerInfoCards } from "./components/PrayerInfoCards"
import { PrayerTable } from "./components/PrayerTable"

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

export const PrayerTimesScreen: FC = () => {
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

  return (
    <Screen
      preset="scroll"
      backgroundColor={colors.background}
      safeAreaEdges={["top"]}
      systemBarStyle="light"
      contentContainerStyle={themed($content)}
    >
      <AppHeader />

      {data?.announcement && <AnnouncementBanner text={data.announcement} />}

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

function AppHeader() {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const navigation = useNavigation<NavigationProp<AppStackParamList>>()
  const { unreadCount } = useNotifications()
  // Keep the header compact for large unread counts, matching common badge UX.
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount)

  return (
    <View style={themed($header)}>
      <TouchableOpacity
        hitSlop={8}
        style={$notificationButton}
        onPress={() => navigation.navigate("Notifications")}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.tint} />
        {/* The badge is driven by persisted read state from NotificationProvider. */}
        {unreadCount > 0 && (
          <View style={themed($notificationBadge)}>
            <Text style={themed($notificationBadgeText)} weight="bold">
              {badgeLabel}
            </Text>
          </View>
        )}
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

const $notificationButton: ViewStyle = {
  minWidth: 28,
  minHeight: 28,
  justifyContent: "center",
}

const $notificationBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: -5,
  right: 0,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  paddingHorizontal: 4,
  backgroundColor: colors.error,
  alignItems: "center",
  justifyContent: "center",
})

const $notificationBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 9,
  lineHeight: 11,
})

const $menuButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.xxs,
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
