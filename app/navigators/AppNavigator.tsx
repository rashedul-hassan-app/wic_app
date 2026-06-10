import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { AdminLoginScreen } from "@/screens/AdminLoginScreen/AdminLoginScreen"
import { useAppTheme } from "@/theme/context"

import { MainStackNavigator } from "./MainStackNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { handleNavigationContainerReady } from "@/services/notifications/notificationService"

import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

function AppStack() {
  const { theme: { colors } } = useAppTheme()

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainStackNavigator} />
      <Stack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  )
}

export function AppNavigator(props: NavigationProps) {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        void handleNavigationContainerReady()
      }}
      {...props}
    >
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
