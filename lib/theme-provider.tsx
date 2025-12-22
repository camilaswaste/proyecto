"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type FontSize = "small" | "normal" | "large" | "xlarge"

interface ThemeContextType {
  theme: Theme
  fontSize: FontSize
  toggleTheme: () => void
  setFontSize: (size: FontSize) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | null
      console.log("[v0] THEME INIT - localStorage value:", savedTheme)
      console.log("[v0] THEME INIT - returning:", savedTheme || "light")
      return savedTheme || "light"
    }
    console.log("[v0] THEME INIT - SSR, returning light")
    return "light"
  })

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const savedFontSize = localStorage.getItem("font-size") as FontSize | null
      return savedFontSize || "normal"
    }
    return "normal"
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log("[v0] THEME MOUNT - Setting mounted to true")
    setMounted(true)
    const root = document.documentElement
    console.log("[v0] THEME MOUNT - Current classes:", root.classList.toString())
    console.log("[v0] THEME MOUNT - Applying theme:", theme)
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    console.log("[v0] THEME MOUNT - New classes:", root.classList.toString())
  }, [theme])

  useEffect(() => {
    if (!mounted) {
      console.log("[v0] THEME SAVE - Not mounted yet, skipping")
      return
    }
    console.log("[v0] THEME SAVE - Saving theme to localStorage:", theme)
    localStorage.setItem("theme", theme)
    const root = document.documentElement
    console.log("[v0] THEME SAVE - Current classes:", root.classList.toString())
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    console.log("[v0] THEME SAVE - New classes:", root.classList.toString())
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    const fontSizes = {
      small: "90%",
      normal: "100%",
      large: "110%",
      xlarge: "120%",
    }
    root.style.fontSize = fontSizes[fontSize]
    localStorage.setItem("font-size", fontSize)
  }, [fontSize, mounted])

  const toggleTheme = () => {
    console.log("[v0] THEME TOGGLE - Current theme:", theme)
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light"
      console.log("[v0] THEME TOGGLE - New theme:", newTheme)
      return newTheme
    })
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
  }

  return <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
