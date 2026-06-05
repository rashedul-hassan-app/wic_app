/* eslint-disable import/first */
if (__DEV__) {
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider } from "./context/AuthContext"
import { usePrayerNotifications } from "./hooks/usePrayerNotifications"
import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

const prefix = Linking.createURL("/")
const config = {
  screens: {
    Main: {
      screens: {
        // 1. Map the outer Tabs navigator container matching your type definition
        Tabs: {
          screens: {
            Timetable: "", // Root tab path
            Mosque: "mosque",
            More: "more",
          },
        },
        // 2. Map the sibling Alerts screen if it should have its own deep link path
        Alerts: "alerts",
      },
    },
    AdminLogin: "admin/login",
  },
}

export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  usePrayerNotifications()

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  const linking = { prefixes: [prefix], config }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppNavigator
              linking={linking}
              initialState={initialNavigationState}
              onStateChange={onNavigationStateChange}
            />
          </ThemeProvider>
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
