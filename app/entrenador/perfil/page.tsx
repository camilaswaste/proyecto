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
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Actualiza tu foto de perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <FotoPerfilUpload
              currentPhotoUrl={profileData?.FotoURL}
              userInitials={`${profileData?.Nombre?.[0] || ""}${profileData?.Apellido?.[0] || ""}`}
              entrenadorID={user?.entrenadorID}
              userType="entrenador"
              onUploadSuccess={(url) => {
                setProfileData({ ...profileData, FotoURL: url })
              }}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  {isEditingProfile ? "Edita tu información" : "Visualiza tu información"}
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false)
                      setError("")
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Nombre</Label>
                    <p className="font-medium">{profileData?.Nombre || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Apellido</Label>
                    <p className="font-medium">{profileData?.Apellido || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{profileData?.Email || "-"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Teléfono</Label>
                  <p className="font-medium">{profileData?.Telefono || "-"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
