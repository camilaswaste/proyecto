"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera, CheckCircle2, Loader2, Upload } from "lucide-react"
import { useState } from "react"

interface FotoPerfilUploadProps {
  currentPhotoUrl?: string
  userInitials: string
  socioID?: number
  entrenadorID?: number
  usuarioID?: number
  userType: "admin" | "socio" | "entrenador"
  onUploadSuccess?: (url: string) => void
}

export function FotoPerfilUpload({
  currentPhotoUrl,
  userInitials,
  socioID,
  entrenadorID,
  usuarioID,
  userType,
  onUploadSuccess,
}: FotoPerfilUploadProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP")
      return
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 5MB")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json()
        throw new Error(data.error || "Error al subir la foto")
      }

      const uploadData = await uploadResponse.json()
      const imageUrl = uploadData.url

      let updateEndpoint = ""
      let updateBody: any = {}

      if (userType === "socio" && socioID) {
        updateEndpoint = "/api/socio/perfil/foto"
        updateBody = { socioID, fotoURL: imageUrl }
      } else if (userType === "entrenador" && entrenadorID) {
        updateEndpoint = "/api/entrenador/profile/foto"
        updateBody = { entrenadorID, fotoURL: imageUrl }
      } else if (userType === "admin" && usuarioID) {
        updateEndpoint = "/api/admin/perfil/foto"
        updateBody = { usuarioID, fotoURL: imageUrl }
      } else {
        throw new Error("Información de usuario incompleta")
      }

      const updateResponse = await fetch(updateEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      })

      if (!updateResponse.ok) {
        const data = await updateResponse.json()
        throw new Error(data.error || "Error al actualizar la foto")
      }

      setPhotoUrl(imageUrl)
      setSuccess("Foto de perfil actualizada exitosamente")
      if (onUploadSuccess) onUploadSuccess(imageUrl)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error("[v0] Error uploading photo:", err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={photoUrl || "/placeholder.svg"} alt="Foto de perfil" />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-4 w-4" />
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-1">Foto de Perfil</h3>
          <p className="text-sm text-muted-foreground mb-3">JPG, PNG o WEBP. Máximo 5MB.</p>
          <label htmlFor="photo-upload-btn">
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Nueva Foto
                  </>
                )}
              </span>
            </Button>
            <input
              id="photo-upload-btn"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
