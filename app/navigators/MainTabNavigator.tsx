import { TextStyle, ViewStyle } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { MosqueScreen } from "@/screens/MosqueScreen/MosqueScreen"
import { MoreScreen } from "@/screens/MoreScreen/MoreScreen"
import { PrayerTimesScreen } from "@/screens/PrayerTimesScreen/PrayerTimesScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: IoniconName; inactive: IoniconName }
> = {
  Timetable: { active: "time",               inactive: "time-outline" },
  Mosque:    { active: "business",           inactive: "business-outline" },
  More:      { active: "ellipsis-horizontal", inactive: "ellipsis-horizontal-outline" },
}

export function MainTabNavigator() {
  const { bottom } = useSafeAreaInsets()
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 60 }]),
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tintInactive,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Timetable"
        component={PrayerTimesScreen}
        options={{
          tabBarLabel: "Timetable",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.Timetable.active : TAB_ICONS.Timetable.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mosque"
        component={MosqueScreen}
        options={{
          tabBarLabel: "Mosque",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.Mosque.active : TAB_ICONS.Mosque.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? TAB_ICONS.More.active : TAB_ICONS.More.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  borderTopWidth: 1,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.xs,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 11,
  fontFamily: typography.primary.medium,
  lineHeight: 14,
})
