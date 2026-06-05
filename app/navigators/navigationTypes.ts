import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Main bottom-tab navigator
export type MainTabParamList = {
  Timetable: undefined
  Mosque: undefined
  More: undefined
}

// Main stack (wraps the bottom-tabs and other main-stack screens)
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined
  Alerts: { highlightEventId?: string } | undefined
}

// Root stack navigator
export type AppStackParamList = {
  Main: NavigatorScreenParams<MainStackParamList>
  AdminLogin: undefined
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}
