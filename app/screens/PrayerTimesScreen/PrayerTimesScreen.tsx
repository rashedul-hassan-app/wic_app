import { FC, useState } from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { addDays, format, parseISO, subDays } from "date-fns"
import { Ionicons } from "@expo/vector-icons"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCurrentPrayer } from "@/hooks/useCurrentPrayer"
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications"
import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AnnouncementBanner } from "./components/AnnouncementBanner"
import { DateNavigator } from "./components/DateNavigator"
import { JumuahTable } from "./components/JumuahTable"
import { NotificationDropdown } from "./components/NotificationDropdown"
import { PrayerInfoCards } from "./components/PrayerInfoCards"
import { PrayerTable } from "./components/PrayerTable"

function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

export const PrayerTimesScreen: FC = () => {
  const { themed, theme: { colors } } = useAppTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState(todayISO)
  const isToday = selectedDate === todayISO()

  const { data, isLoading } = usePrayerTimes(selectedDate)
  const { data: todayData } = usePrayerTimes(todayISO())
  const currentPrayer = useCurrentPrayer(todayData?.prayers ?? [])

  const {
    permission,
    isEnabled: notificationsEnabled,
    unreadCount,
    notifications,
    requestPermission,
    markAllAsRead,
    fireTestNotification,
  } = usePrayerNotifications({
    prayers: todayData?.prayers ?? [],
    date: todayISO(),
    enabled: true,
  })

  const handleNotificationPress = () => {
    setDropdownOpen((open) => !open)
  }

  const handleEnableNotifications = async () => {
    await requestPermission()
  }

  const handleTestNotification = async () => {
    await fireTestNotification(true)
  }

  const handlePrev = () =>
    setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))

  const handleNext = () =>
    setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))

  return (
    <>
      <Screen
        preset="scroll"
        backgroundColor={colors.background}
        safeAreaEdges={["top"]}
        systemBarStyle="light"
        contentContainerStyle={themed($content)}
      >
        <AppHeader
          notificationsEnabled={notificationsEnabled}
          unreadCount={unreadCount}
          onNotificationPress={handleNotificationPress}
        />

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

      <NotificationDropdown
        notifications={notifications}
        visible={dropdownOpen}
        permission={permission}
        onMarkAllRead={markAllAsRead}
        onEnableNotifications={handleEnableNotifications}
        onTestNotification={handleTestNotification}
        onClose={() => setDropdownOpen(false)}
      />
    </>
  )
}

interface AppHeaderProps {
  notificationsEnabled: boolean
  unreadCount: number
  onNotificationPress: () => void
}

function AppHeader({ notificationsEnabled, unreadCount, onNotificationPress }: AppHeaderProps) {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <View style={themed($header)}>
      <TouchableOpacity hitSlop={12} onPress={onNotificationPress} style={$bellButton}>
        <Ionicons
          name={notificationsEnabled ? "notifications" : "notifications-outline"}
          size={22}
          color={colors.tint}
        />
        {unreadCount > 0 && (
          <View style={themed($badge)}>
            <Text style={themed($badgeText)} weight="bold">
              {unreadCount > 99 ? "99+" : String(unreadCount)}
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

const $bellButton: ViewStyle = {
  width: 30,
  height: 30,
  alignItems: "center",
  justifyContent: "center",
}

const $badge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: -4,
  right: -6,
  minWidth: 17,
  height: 17,
  borderRadius: 9,
  backgroundColor: colors.error,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
  borderWidth: 1.5,
  borderColor: colors.background,
})

const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.slate100,
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
