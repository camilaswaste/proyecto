import { ThemeProvider } from "@/lib/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mundo Fitness - Sistema de Gestión",
  description: "Sistema de gestión para gimnasio Mundo Fitness",
  generator: "Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MundoFitness Socio",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.jpg", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.jpg", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-152x152.jpg", sizes: "152x152", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="MundoFitness Socio" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MundoFitness Socio" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ef4444" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
