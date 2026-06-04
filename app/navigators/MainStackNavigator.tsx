import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AlertsScreen } from "@/screens/AlertsScreen/AlertsScreen"
import { useAppTheme } from "@/theme/context"

import { MainTabNavigator } from "./MainTabNavigator"
import type { MainStackParamList } from "./navigationTypes"

const Stack = createNativeStackNavigator<MainStackParamList>()

export function MainStackNavigator() {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}
