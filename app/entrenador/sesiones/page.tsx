"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Calendar, Clock, Mail, Phone, User, X } from "lucide-react"
import { useEffect, useState } from "react"

interface Sesion {
  SesionID: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: string
  Notas: string
  NombreSocio: string
  EmailSocio: string
  TelefonoSocio: string
}

export default function EntrenadorSesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSesiones()
  }, [])

  const fetchSesiones = async () => {
    try {
      const user = getUser()
      const entrenadorID = user?.entrenadorID

      if (!entrenadorID) {
        console.error("No se pudo obtener el EntrenadorID")
        return
      }

      const response = await fetch(`/api/entrenador/sesiones?entrenadorID=${entrenadorID}`)
      if (response.ok) {
        const data = await response.json()
        setSesiones(data)
      } else {
        console.error("Error al cargar sesiones:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar sesiones:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSesion = async (sesionID: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta sesión?")) {
      return
    }

    try {
      const response = await fetch(`/api/entrenador/sesiones?sesionID=${sesionID}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Sesión cancelada exitosamente")
        fetchSesiones()
      } else {
        const error = await response.json()
        alert(error.error || "Error al cancelar sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cancelar sesión")
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Agendada":
        return "bg-blue-100 text-blue-800"
      case "Completada":
        return "bg-green-100 text-green-800"
      case "Cancelada":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando sesiones...</p>
        </div>
      </DashboardLayout>
    )
  }

  const sesionesActivas = sesiones.filter((s) => s.Estado !== "Cancelada" && s.Estado !== "Completada")
  const sesionesHistoricas = sesiones.filter((s) => s.Estado === "Cancelada" || s.Estado === "Completada")

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Sesiones Personales</h1>
          <p className="text-muted-foreground">Gestiona tus entrenamientos personalizados con socios</p>
        </div>

        {/* Sesiones Activas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Sesiones Próximas</h2>
          {sesionesActivas.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No tienes sesiones próximas agendadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sesionesActivas.map((sesion) => (
                <Card key={sesion.SesionID}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {sesion.NombreSocio}
                        </CardTitle>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {sesion.EmailSocio}
                          </div>
                          {sesion.TelefonoSocio && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {sesion.TelefonoSocio}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(sesion.Estado)}`}>
                        {sesion.Estado}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(sesion.FechaSesion)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {sesion.HoraInicio} - {sesion.HoraFin}
                        </span>
                      </div>
                      {sesion.Notas && (
                        <div className="bg-muted/50 rounded-lg p-3 mt-3">
                          <p className="text-sm font-medium mb-1">Notas del socio:</p>
                          <p className="text-sm text-muted-foreground">{sesion.Notas}</p>
                        </div>
                      )}
                      {sesion.Estado === "Agendada" && (
                        <div className="pt-3 border-t">
                          <Button variant="destructive" size="sm" onClick={() => handleCancelSesion(sesion.SesionID)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar Sesión
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        {sesionesHistoricas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Historial</h2>
            <div className="grid gap-4">
              {sesionesHistoricas.map((sesion) => (
                <Card key={sesion.SesionID} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{sesion.NombreSocio}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDate(sesion.FechaSesion)}</span>
                          <span>
                            {sesion.HoraInicio} - {sesion.HoraFin}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(sesion.Estado)}`}>
                        {sesion.Estado}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
