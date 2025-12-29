"use client"

import { useEffect } from "react"

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[v0] Service Worker registrado:", registration)
        })
        .catch((error) => {
          console.error("[v0] Error registrando Service Worker:", error)
        })
    }
  }, [])

  return null
}
