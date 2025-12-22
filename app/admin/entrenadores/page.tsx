"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPhone, validatePhone } from "@/lib/validations"
import { Edit, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface Entrenador {
  EntrenadorID: number
  UsuarioID: number
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  Especialidad: string
  Activo: boolean
  FotoDemo?: string // Changed from FotoURL to FotoDemo for demo photos
  FotoURL?: string // Added FotoURL for profile photos
}

export default function AdminEntrenadoresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEntrenador, setEditingEntrenador] = useState<Entrenador | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "",
    certificaciones: "",
    biografia: "",
  })
  const [phoneError, setPhoneError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/admin/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (entrenador?: Entrenador) => {
    setPhoneError("")
    setImageFile(null)
    setImagePreview("")

    if (entrenador) {
      setEditingEntrenador(entrenador)
      setImagePreview(entrenador.FotoDemo || "")
      setFormData({
        nombre: entrenador.Nombre,
        apellido: entrenador.Apellido,
        email: entrenador.Email,
        telefono: entrenador.Telefono || "",
        especialidad: entrenador.Especialidad || "",
        certificaciones: "",
        biografia: "",
      })
    } else {
      setEditingEntrenador(null)
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        especialidad: "",
        certificaciones: "",
        biografia: "",
      })
    }
    setShowDialog(true)
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, telefono: formatted })

    if (formatted.length > 0 && formatted.length >= 17) {
      if (!validatePhone(formatted)) {
        setPhoneError("Teléfono inválido. Formato: (+56) 9 xxxx xxxx")
      } else {
        setPhoneError("")
      }
    } else {
      setPhoneError("")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar 5MB")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.telefono && !validatePhone(formData.telefono)) {
      alert("Por favor ingresa un teléfono válido en formato (+56) 9 xxxx xxxx")
      return
    }

    if (!editingEntrenador) {
      try {
        const validationResponse = await fetch("/api/auth/validate-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            userType: "Usuario",
          }),
        })

        const validationResult = await validationResponse.json()
        if (!validationResult.valid) {
          alert(validationResult.errors.join("\n"))
          return
        }
      } catch (error) {
        console.error("Error validating account:", error)
        alert("Error al validar la cuenta")
        return
      }
    }

    try {
      let fotoDemo = editingEntrenador?.FotoDemo || ""
      const fotoURL = editingEntrenador?.FotoURL || ""

      if (imageFile) {
        const formDataImg = new FormData()
        formDataImg.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataImg,
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          fotoDemo = url
        } else {
          const errorData = await uploadResponse.json()
          alert("Error al subir la imagen: " + (errorData.error || "Error desconocido"))
          return
        }
      }

      const body = editingEntrenador
        ? {
            ...formData,
            entrenadorID: editingEntrenador.EntrenadorID,
            estado: editingEntrenador.Activo,
            fotoDemo,
            fotoURL,
          }
        : { ...formData, fotoDemo, fotoURL }

      const url = "/api/admin/entrenadores"
      const method = editingEntrenador ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()

        if (!editingEntrenador && result.tempPassword) {
          alert(
            `Entrenador creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.email}\nContraseña temporal: ${result.tempPassword}\n\nIMPORTANTE: El entrenador debe cambiar su contraseña al iniciar sesión por primera vez.\nPor favor, comparte estas credenciales de forma segura.`,
          )
        } else if (editingEntrenador) {
          alert("Entrenador actualizado exitosamente")
        }
        setShowDialog(false)

        await fetchEntrenadores()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar entrenador")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar entrenador")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este entrenador?")) return

    try {
      const response = await fetch(`/api/admin/entrenadores?entrenadorID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchEntrenadores()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredEntrenadores = entrenadores.filter(
    (entrenador) =>
      entrenador.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrenador.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrenador.Email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const skeletonCount = filteredEntrenadores.length > 0 ? (4 - (filteredEntrenadores.length % 4)) % 4 : 0

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando entrenadores...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Entrenadores</h1>
            <p className="text-muted-foreground">Administra el equipo de entrenadores</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Entrenador
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredEntrenadores.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-muted-foreground">
                No se encontraron entrenadores
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredEntrenadores.map((entrenador) => (
                <Card key={entrenador.EntrenadorID} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-red-500 to-red-700">
                    {entrenador.FotoDemo ? (
                      <img
                        src={entrenador.FotoDemo || "/placeholder.svg"}
                        alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {entrenador.Nombre[0]}
                            {entrenador.Apellido[0]}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          entrenador.Activo ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"
                        }`}
                      >
                        {entrenador.Activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <div className="relative px-6 pt-2">
                    <div className="absolute -top-12 left-6">
                      {entrenador.FotoURL ? (
                        <img
                          src={entrenador.FotoURL || "/placeholder.svg"}
                          alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {entrenador.Nombre[0]}
                            {entrenador.Apellido[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-14 pb-6">
                    <h3 className="text-xl font-bold mb-2">
                      {entrenador.Nombre} {entrenador.Apellido}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">Especialidad:</span>
                        <span>{entrenador.Especialidad || "N/A"}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{entrenador.Email}</p>
                      {entrenador.Telefono && <p className="text-sm text-muted-foreground">{entrenador.Telefono}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleOpenDialog(entrenador)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(entrenador.EntrenadorID)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {Array.from({ length: skeletonCount }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="overflow-hidden opacity-50 animate-pulse">
                  <div className="relative h-48 bg-gradient-to-br from-gray-300 to-gray-400" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-4 w-3/4" />
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-200 rounded flex-1" />
                      <div className="h-10 w-10 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntrenador ? "Editar Entrenador" : "Nuevo Entrenador"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Foto de Demostración</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                        {formData.nombre[0] || "?"}
                        {formData.apellido[0] || ""}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG o GIF. Máximo 5MB.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingEntrenador}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(+56) 9 xxxx xxxx"
                  maxLength={17}
                />
                {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
                <p className="text-xs text-muted-foreground mt-1">Formato: (+56) 9 xxxx xxxx</p>
              </div>
              <div>
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="certificaciones">Certificaciones</Label>
                <Input
                  id="certificaciones"
                  value={formData.certificaciones}
                  onChange={(e) => setFormData({ ...formData, certificaciones: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="biografia">Biografía</Label>
                <textarea
                  id="biografia"
                  value={formData.biografia}
                  onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingEntrenador ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
