import { Platform } from "react-native"

function playNotificationSound(): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextCtor) return

    const ctx = new AudioContextCtor()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = 880
    gain.gain.value = 0.2

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    oscillator.start(now)
    oscillator.stop(now + 0.18)

    oscillator.addEventListener("ended", () => {
      void ctx.close()
    })
  } catch {
    // Browsers may block audio until a user gesture has occurred.
  }
}

export function playPrayerNotificationSound(): void {
  playNotificationSound()
}
