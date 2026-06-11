import { useEffect, useMemo, useState } from "react"

import type { PrayerTime } from "@/models/prayer.types"
import { CircularLinkedList } from "@/utils/linkedList"

export interface CountdownInfo {
  currentPrayer: PrayerTime
  nextPrayer: PrayerTime
  hours: number
  minutes: number
  seconds: number
  formatted: string
}

function toMinutes(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 60 + m
}

function toSeconds(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  return h * 3600 + m * 60
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function compute(list: CircularLinkedList<PrayerTime>, now: Date): CountdownInfo {
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const currentNode = list.findCurrent(nowMin, (p) => toMinutes(p.begins))

  let currentPrayer: PrayerTime
  let nextPrayer: PrayerTime
  let diffSec: number

  if (currentNode) {
    currentPrayer = currentNode.value
    const nextNode = currentNode.next!
    nextPrayer = nextNode.value
    const nextBeginsSec = toSeconds(nextPrayer.begins)

    diffSec = nextBeginsSec >= nowSec ? nextBeginsSec - nowSec : 86_400 - nowSec + nextBeginsSec
  } else {
    const tail = list.head!.prev!
    const fajr = list.head!
    currentPrayer = tail.value
    nextPrayer = fajr.value
    diffSec = toSeconds(nextPrayer.begins) - nowSec
  }

  if (diffSec < 0) diffSec = 0

  return {
    currentPrayer,
    nextPrayer,
    hours: Math.floor(diffSec / 3600),
    minutes: Math.floor((diffSec % 3600) / 60),
    seconds: diffSec % 60,
    formatted: formatCountdown(diffSec),
  }
}

export function useCountdown(prayers: PrayerTime[]): CountdownInfo | null {
  const list = useMemo(() => {
    if (!prayers.length) return null
    const ll = new CircularLinkedList<PrayerTime>()
    for (const p of prayers) ll.insert(p)
    return ll
  }, [prayers])

  const [info, setInfo] = useState<CountdownInfo | null>(() =>
    list ? compute(list, new Date()) : null,
  )

  useEffect(() => {
    if (!list) return

    const update = () => setInfo(compute(list, new Date()))
    update()

    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [list])

  return info
}
