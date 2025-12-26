"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Formulario enviado, email:", email)
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Llamando a /api/auth/forgot-password...")
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      console.log("[v0] Respuesta recibida, status:", res.status)
      const data = await res.json()
      console.log("[v0] Data:", data)

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar solicitud")
      }

      console.log("[v0] Email enviado exitosamente")
      setSuccess(true)
    } catch (err: any) {
      console.error("[v0] Error:", err)
      setError(err.message || "Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Link
        href="/login"
        className="fixed top-6 left-6 p-2 rounded-lg bg-card dark:bg-card hover:bg-accent transition-colors border shadow-sm"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Email Enviado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.
                </p>
                <p className="text-sm text-muted-foreground">Revisa tu bandeja de entrada y spam.</p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Instrucciones"
                )}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
