import { execSync } from "node:child_process"
import { platform } from "node:os"

const port = process.env.EXPO_WEB_PORT ?? process.env.PORT ?? "8081"
const url = `http://localhost:${port}/?testNotification=1`

console.log("WIC Prayer App — test notification")
console.log("----------------------------------")
console.log(`Target: ${url}`)
console.log("Ensure the web app is running first: npm run web")
console.log("")
console.log("After the page opens:")
console.log("  1. Tap the bell icon → Allow notifications in the browser prompt")
console.log("  2. Or open the dropdown → click 'Send test notification'")
console.log("")

function openBrowser(targetUrl: string): void {
  const cmd =
    platform() === "win32"
      ? `start "" "${targetUrl}"`
      : platform() === "darwin"
        ? `open "${targetUrl}"`
        : `xdg-open "${targetUrl}"`

  execSync(cmd, { stdio: "ignore" })
}

try {
  openBrowser(url)
  console.log("Opened browser tab.")
} catch {
  console.log("Could not open the browser automatically. Visit the URL above manually.")
}
