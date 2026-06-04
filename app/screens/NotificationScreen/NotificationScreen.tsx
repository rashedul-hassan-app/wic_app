import { FC, useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { format, parseISO } from "date-fns"

import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppNotification, NotificationType } from "@/models/notification.types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { mockNotificationService } from "@/services/notifications/mockNotificationService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface NotificationScreenProps extends AppStackScreenProps<"Notifications"> {}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

const NOTIFICATION_ICONS: Record<NotificationType, IoniconName> = {
  announcement: "megaphone-outline",
  prayer: "time-outline",
  system: "information-circle-outline",
}

function formatNotificationDate(value: string) {
  return format(parseISO(value), "MMM d, h:mm a")
}

export const NotificationScreen: FC<NotificationScreenProps> = ({ navigation }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setLoading] = useState(true)
  const [isRefreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const result = await mockNotificationService.getNotifications()
      setNotifications(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const renderNotification: ListRenderItem<AppNotification> = ({ item }) => (
    <NotificationRow notification={item} />
  )

  return (
    <Screen
      preset="fixed"
      backgroundColor={colors.background}
      safeAreaEdges={["top", "bottom"]}
      systemBarStyle="light"
      contentContainerStyle={themed($container)}
    >
      <View style={themed($header)}>
        <PressableIcon
          icon="back"
          size={20}
          color={colors.textDim}
          onPress={() => navigation.goBack()}
        />
        <Text style={themed($headerTitle)} weight="bold">
          Notifications
        </Text>
        <View style={$headerSpacer} />
      </View>

      {isLoading ? (
        <View style={themed($loadingState)}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={themed($emptyState)}>
          <View style={themed($emptyIcon)}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.tint} />
          </View>
          <Text style={themed($emptyTitle)} weight="bold">
            Unable to load notifications
          </Text>
          <Text style={themed($emptyText)}>{error}</Text>
          <TouchableOpacity
            style={themed($retryButton)}
            activeOpacity={0.7}
            onPress={() => loadNotifications()}
          >
            <Text style={themed($retryText)} weight="medium">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={themed([
            $listContent,
            notifications.length === 0 && $emptyListContent,
          ])}
          ItemSeparatorComponent={() => <View style={themed($separator)} />}
          refreshing={isRefreshing}
          onRefresh={() => loadNotifications(true)}
          ListEmptyComponent={<NotificationEmptyState />}
        />
      )}
    </Screen>
  )
}

interface NotificationRowProps {
  notification: AppNotification
}

function NotificationRow({ notification }: NotificationRowProps) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <View style={themed($row)}>
      <View style={themed($rowIcon)}>
        <Ionicons name={NOTIFICATION_ICONS[notification.type]} size={20} color={colors.tint} />
      </View>
      <View style={$rowContent}>
        <View style={$rowHeader}>
          <Text style={themed($rowTitle)} weight="semiBold">
            {notification.title}
          </Text>
          <Text style={themed($rowDate)}>{formatNotificationDate(notification.createdAt)}</Text>
        </View>
        <Text style={themed($rowMessage)}>{notification.message}</Text>
      </View>
    </View>
  )
}

function NotificationEmptyState() {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <View style={themed($emptyState)}>
      <View style={themed($emptyIcon)}>
        <Ionicons name="notifications-outline" size={34} color={colors.tint} />
      </View>
      <Text style={themed($emptyTitle)} weight="bold">
        No notifications yet
      </Text>
      <Text style={themed($emptyText)}>Prayer reminders and mosque updates will appear here.</Text>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
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

const $headerSpacer: ViewStyle = {
  width: 20,
}

const $loadingState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.xxxl,
  alignItems: "center",
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.xxl,
})

const $emptyListContent: ViewStyle = {
  flexGrow: 1,
}

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.surface,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.md,
  gap: spacing.sm,
})

const $rowIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  backgroundColor: colors.tintSubtle,
  alignItems: "center",
  justifyContent: "center",
})

const $rowContent: ViewStyle = {
  flex: 1,
}

const $rowHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 8,
}

const $rowTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.text,
  fontSize: 15,
  lineHeight: 20,
})

const $rowDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  lineHeight: 16,
})

const $rowMessage: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 19,
  marginTop: spacing.xxs,
})

const $separator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: spacing.sm,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.xxxl,
})

const $emptyIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 72,
  height: 72,
  borderRadius: 18,
  backgroundColor: colors.tintSubtle,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 18,
  marginBottom: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
  lineHeight: 20,
  textAlign: "center",
})

const $retryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.md,
  backgroundColor: colors.tint,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $retryText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 14,
})
