"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key } from "lucide-react"

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword,
          adminOverride: true, // Admin can reset without token
        }),
      })

      if (response.ok) {
        alert("Contraseña restablecida exitosamente")
        setEmail("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const error = await response.json()
        alert(error.error || "Error al restablecer contraseña")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al restablecer contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restablecer Contraseña</h1>
          <p className="text-muted-foreground">Restablece la contraseña de cualquier usuario o socio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restablecer Contraseña de Usuario</CardTitle>
            <CardDescription>Ingresa el email del usuario y la nueva contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email del Usuario *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                {loading ? "Restableciendo..." : "Restablecer Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-medium text-yellow-900">Importante</p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Esta función es solo para administradores</li>
                <li>La contraseña debe tener al menos 6 caracteres</li>
                <li>El usuario recibirá la nueva contraseña y deberá cambiarla en su primer inicio de sesión</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
