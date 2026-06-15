import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { format } from "date-fns"

import { Text } from "@/components/Text"
import type { NotificationPermissionStatus } from "@/services/notifications/IBrowserNotificationService"
import type { InboxNotification } from "@/services/notifications/notificationInbox"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface NotificationDropdownProps {
  notifications: InboxNotification[]
  visible: boolean
  permission: NotificationPermissionStatus
  onMarkAllRead: () => void
  onEnableNotifications: () => void
  onTestNotification: () => void
  onClose: () => void
}

export function NotificationDropdown({
  notifications,
  visible,
  permission,
  onMarkAllRead,
  onEnableNotifications,
  onTestNotification,
  onClose,
}: NotificationDropdownProps) {
  const { themed } = useAppTheme()

  const permissionHint =
    permission === "denied"
      ? "Notifications are blocked. Open your browser site settings for localhost and allow notifications."
      : permission === "granted"
        ? "Browser notifications are enabled."
        : "Enable browser notifications to receive prayer time alerts."

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={themed($overlay)}>
        <Pressable style={$backdrop} onPress={onClose} accessibilityRole="button" />

        <View style={themed($dropdown)} pointerEvents="box-none">
          <View style={themed($panel)}>
            <View style={themed($dropdownHeader)}>
              <Text style={themed($dropdownTitle)} weight="semiBold">
                Notifications
              </Text>
              {notifications.some((item) => !item.read) && (
                <TouchableOpacity onPress={onMarkAllRead} hitSlop={8}>
                  <Text style={themed($markAllText)} weight="medium">
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={themed($permissionBanner)}>
              <Text style={themed($permissionText)}>{permissionHint}</Text>
              {permission !== "granted" && permission !== "denied" && (
                <TouchableOpacity onPress={onEnableNotifications} style={themed($enableButton)}>
                  <Text style={themed($enableButtonText)} weight="semiBold">
                    Enable notifications
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={$list} bounces={false}>
              {notifications.length === 0 ? (
                <View style={themed($emptyState)}>
                  <Text style={themed($emptyText)}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      themed($item),
                      !item.read && themed($itemUnread),
                      index < notifications.length - 1 && themed($itemBorder),
                    ]}
                  >
                    <Text style={themed($itemBody)} weight={item.read ? "normal" : "semiBold"}>
                      {item.body}
                    </Text>
                    <Text style={themed($itemTime)}>{format(item.createdAt, "h:mm a")}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={onTestNotification} style={themed($testRow)}>
              <Text style={themed($testText)} weight="medium">
                Send test notification
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={themed($closeRow)}>
              <Text style={themed($closeText)}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $overlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $backdrop: ViewStyle = {
  ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as ViewStyle),
  backgroundColor: "rgba(0, 0, 0, 0.45)",
}

const $dropdown: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: 52,
  left: spacing.md,
  width: 300,
  maxWidth: "92%",
})

const $panel: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.elevated,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden",
  maxHeight: 420,
})

const $dropdownHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $dropdownTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
})

const $markAllText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 12,
})

const $permissionBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.surface,
  gap: spacing.xs,
})

const $permissionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  lineHeight: 17,
})

const $enableButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignSelf: "flex-start",
  backgroundColor: colors.tint,
  borderRadius: 6,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
})

const $enableButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 12,
})

const $list: ViewStyle = {
  maxHeight: 220,
}

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
  textAlign: "center",
})

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
})

const $itemUnread: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintSubtle,
})

const $itemBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $itemBody: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 13,
  lineHeight: 18,
})

const $itemTime: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  marginTop: 4,
})

const $closeRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  paddingVertical: spacing.xs,
  alignItems: "center",
})

const $testRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  paddingVertical: spacing.sm,
  alignItems: "center",
  backgroundColor: colors.surface,
})

const $testText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 13,
})

const $closeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})
