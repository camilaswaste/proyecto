"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth-client"
import { useTheme } from "@/lib/theme-provider"
import { AlertCircle, CheckCircle2, Info, Moon, Sun, Type } from "lucide-react"
import { useSearchParams } from "next/navigation"
import type React from "react"
import { useState } from "react"

export default function EntrenadorConfiguracionPage() {
  const searchParams = useSearchParams()
  const isFirstLogin = searchParams.get("cambiarPassword") === "true"

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const { theme, fontSize, toggleTheme, setFontSize } = useTheme()

  const fontSizeOptions = [
    { value: "small" as const, label: "Pequeño", size: "90%" },
    { value: "normal" as const, label: "Normal", size: "100%" },
    { value: "large" as const, label: "Grande", size: "110%" },
    { value: "xlarge" as const, label: "Muy Grande", size: "120%" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const user = getUser()
      console.log("Usuario actual al cambiar contraseña:", user)

      if (!user?.email) {
        setError("No se pudo obtener información del usuario")
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      console.log("Response status cambio contraseña:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("Respuesta del servidor:", responseData)

        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        userData.requiereCambioPassword = false
        localStorage.setItem("user", JSON.stringify(userData))
        console.log("LocalStorage actualizado:", userData)

        setSuccess(true)
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })

        if (isFirstLogin) {
          setTimeout(() => {
            window.location.href = "/entrenador/dashboard"
          }, 2000)
        } else {
          setTimeout(() => setSuccess(false), 3000)
        }
      } else {
        const errorData = await response.json()
        console.error("Error al cambiar contraseña:", errorData)
        setError(errorData.error || "Error al cambiar la contraseña")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Configuración</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la apariencia de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Modo de Color</Label>
                <div className="flex items-center gap-4">
                  <Button variant={theme === "light" ? "default" : "outline"} onClick={toggleTheme} className="flex-1">
                    <Sun className="w-4 h-4 mr-2" />
                    Modo Claro
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} onClick={toggleTheme} className="flex-1">
                    <Moon className="w-4 h-4 mr-2" />
                    Modo Oscuro
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Actualmente usando:{" "}
                  <span className="font-semibold">{theme === "light" ? "Modo Claro" : "Modo Oscuro"}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamaño de Fuente</CardTitle>
              <CardDescription>Ajusta el tamaño del texto en toda la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {fontSizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={fontSize === option.value ? "default" : "outline"}
                    onClick={() => setFontSize(option.value)}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Type className="w-5 h-5" />
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.size}</span>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Tamaño actual:{" "}
                <span className="font-semibold">{fontSizeOptions.find((o) => o.value === fontSize)?.label}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isFirstLogin && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Primer inicio de sesión:</strong> Por seguridad, debes cambiar tu contraseña temporal
                      antes de continuar.
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Contraseña actualizada exitosamente{isFirstLogin ? ". Redirigiendo al dashboard..." : ""}
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Cambiar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
