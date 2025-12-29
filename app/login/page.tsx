"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // ✅ Detecta modo oscuro SIN instalar nada (leyendo .dark en <html>)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const el = document.documentElement

    const update = () => setIsDark(el.classList.contains("dark"))
    update()

    // Observa cambios de clase (cuando tu dashboard-layout prende/apaga dark)
    const obs = new MutationObserver(() => update())
    obs.observe(el, { attributes: true, attributeFilter: ["class"] })

    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  const logoSrc = useMemo(() => {
    return isDark ? "/images/logoMundoBlanco.png" : "/images/logoMundo.png"
  }, [isDark])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error al iniciar sesión")

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.user.requiereCambioPassword) {
        if (data.user.rol === "Administrador") router.push("/admin/configuracion?cambiarPassword=true")
        else if (data.user.rol === "Entrenador") router.push("/entrenador/configuracion?cambiarPassword=true")
        else router.push("/socio/configuracion?cambiarPassword=true")
        return
      }

      if (data.user.rol === "Administrador") router.push("/admin/dashboard")
      else if (data.user.rol === "Entrenador") router.push("/entrenador/dashboard")
      else router.push("/socio/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-black px-4 py-10 flex items-center justify-center">
      {/* decor (sin amarillos/verde) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl border border-zinc-200/70 dark:border-white/10 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.35)] bg-white/85 dark:bg-zinc-950/60 backdrop-blur-xl">
          <CardHeader className="text-center space-y-3 pt-8">
            <div className="flex justify-center">
              {/* ✅ Logo real por estado (no depende de dark: para src) */}
              <motion.div
                key={logoSrc}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="select-none"
              >
                <Image src={logoSrc} alt="Mundo Fitness" width={180} height={56} priority />
              </motion.div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                Iniciar sesión
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Accede al sistema de gestión <span className="font-medium text-foreground">Mundo Fitness</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                        ¡Registro exitoso! Ahora puedes iniciar sesión.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 h-11 rounded-xl"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-10 h-11 rounded-xl"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.985 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-[#B1121A] to-[#7A0B10] hover:from-[#C3131C] hover:to-[#8E0E14] text-white shadow-md shadow-red-500/15"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </motion.div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground pt-1">
                <Link href="/recuperar-password" className="hover:text-foreground transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Volver al inicio
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-200/70 dark:border-white/10">
             
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}