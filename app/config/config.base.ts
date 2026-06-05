export interface ConfigBaseProps {
  persistNavigation: "always" | "dev" | "prod" | "never"
  catchErrors: "always" | "dev" | "prod" | "never"
  exitRoutes: string[]
  /** Dev-only: relative prayer times (Maghrib +1 min) for alert testing. */
  USE_DEV_PRAYER_MOCK: boolean
}

export type PersistNavigationConfig = ConfigBaseProps["persistNavigation"]

const BaseConfig: ConfigBaseProps = {
  persistNavigation: "dev",
  catchErrors: "always",
  // Exit the app when pressing back on the Timetable (home) tab
  exitRoutes: ["Timetable"],
  USE_DEV_PRAYER_MOCK: false,
}

export default BaseConfig
