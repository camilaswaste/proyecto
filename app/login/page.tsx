"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

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

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.user.requiereCambioPassword) {
        if (data.user.rol === "Administrador") {
          router.push("/admin/configuracion?cambiarPassword=true")
        } else if (data.user.rol === "Entrenador") {
          router.push("/entrenador/configuracion?cambiarPassword=true")
        } else {
          router.push("/socio/configuracion?cambiarPassword=true")
        }
        return
      }

      if (data.user.rol === "Administrador") {
        router.push("/admin/dashboard")
      } else if (data.user.rol === "Entrenador") {
        router.push("/entrenador/dashboard")
      } else {
        router.push("/socio/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border">
        {/* HEADER */}
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <Image
              src="/images/logoMundo.png"
              alt="Mundo Fitness"
              width={160}
              height={50}
              priority
            />
          </div>

          <CardTitle className="text-2xl font-bold">
            Iniciar sesión
          </CardTitle>
          <CardDescription>
            Accede al sistema de gestión Mundo Fitness
          </CardDescription>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {showSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Registro exitoso! Ahora puedes iniciar sesión.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

            <div className="flex justify-between text-sm text-muted-foreground">
              <Link
                href="/recuperar-password"
                className="hover:text-primary"
              >
                ¿Olvidaste tu contraseña?
              </Link>

              <Link
                href="/"
                className="hover:text-primary"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
