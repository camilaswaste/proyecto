"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FotoPerfilUpload } from "@/components/foto-perfil-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth-client"
import { AlertCircle, CheckCircle2, Edit, X } from "lucide-react"
import { useEffect, useState } from "react"

export default function EntrenadorPerfilPage() {
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const userData = getUser()
    if (userData) {
      setUser(userData)
      if (userData.entrenadorID) {
        fetchProfileData(userData.entrenadorID)
      }
    }
  }, [])

  const fetchProfileData = async (entrenadorID: number) => {
    try {
      const response = await fetch(`/api/entrenador/profile?entrenadorID=${entrenadorID}`)
      if (!response.ok) throw new Error("Error al cargar perfil")

      const data = await response.json()
      setProfileData(data)
      setFormData({
        nombre: data.Nombre || "",
        apellido: data.Apellido || "",
        email: data.Email || "",
        telefono: data.Telefono || "",
      })
    } catch (err) {
      setError("No se pudo cargar tu perfil")
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/entrenador/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrenadorID: user.entrenadorID,
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al actualizar perfil")
      }

      setSuccess("Perfil actualizado exitosamente")
      setIsEditingProfile(false)
      fetchProfileData(user.entrenadorID)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="mx-auto w-full max-w-5xl px-1 sm:px-2">
        {/* Header */}
        <div className="mb-6 rounded-2xl border bg-background/70 p-5 sm:p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">Administra tu información personal y tu foto de perfil.</p>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3 mb-6">
          {success && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              <AlertDescription className="font-medium">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Foto */}
          <Card className="overflow-hidden border bg-background shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Foto de Perfil</CardTitle>
              <CardDescription className="text-sm">Actualiza tu foto para que te identifiquen fácilmente.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <FotoPerfilUpload
                  currentPhotoUrl={profileData?.FotoURL}
                  userInitials={`${profileData?.Nombre?.[0] || ""}${profileData?.Apellido?.[0] || ""}`}
                  entrenadorID={user?.entrenadorID}
                  userType="entrenador"
                  onUploadSuccess={(url) => {
                    setProfileData({ ...profileData, FotoURL: url })
                  }}
                />
              </div>

              {/* Mini resumen (solo visual, sin lógica nueva) */}
              <div className="mt-4 rounded-xl border bg-background p-4">
                <p className="text-sm font-semibold truncate">
                  {profileData?.Nombre ? `${profileData?.Nombre} ${profileData?.Apellido || ""}` : "Entrenador"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profileData?.Email || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="border bg-background shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base">Información Personal</CardTitle>
                  <CardDescription className="text-sm">
                    {isEditingProfile ? "Edita tu información y guarda los cambios." : "Visualiza tu información registrada."}
                  </CardDescription>
                </div>

                {!isEditingProfile && (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
                    className="shrink-0 rounded-xl"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-sm">
                        Nombre
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apellido" className="text-sm">
                        Apellido
                      </Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm">
                        Teléfono
                      </Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+56 9 1234 5678"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false)
                        setError("")
                      }}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>

                    <Button type="submit" disabled={loading} className="rounded-xl">
                      {loading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre</p>
                        <p className="text-sm font-medium truncate">{profileData?.Nombre || "-"}</p>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apellido</p>
                        <p className="text-sm font-medium truncate">{profileData?.Apellido || "-"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                        <p className="text-sm font-medium truncate">{profileData?.Email || "-"}</p>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teléfono</p>
                        <p className="text-sm font-medium truncate">{profileData?.Telefono || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tip visual (neutro, no rojo) */}
                  <div className="rounded-2xl border bg-background p-4">
                    <p className="text-sm font-semibold">Consejo</p>
                    <p className="text-sm text-muted-foreground">
                      Mantén tu email y teléfono actualizados para recibir avisos y coordinación con socios.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
