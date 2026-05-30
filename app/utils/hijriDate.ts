/**
 * Returns a formatted Hijri (Islamic) date string using the device's Intl API.
 * Falls back to an empty string on unsupported runtimes.
 */
export function formatHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return ""
  }
}
