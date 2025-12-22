"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Calendar, CheckCircle, Clock, X, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Sesion {
  SesionID: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: string
  Notas: string
  NombreEntrenador: string
  Especialidad: string
  FotoURL?: string
}

export default function SocioSesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSesiones()
  }, [])

  const fetchSesiones = async () => {
    try {
      const user = getUser()
      const socioID = user?.socioID || user?.usuarioID

      if (!socioID) {
        console.error("No se pudo obtener el SocioID")
        return
      }

      const response = await fetch(`/api/socio/sesiones?socioID=${socioID}`)
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
      const response = await fetch(`/api/socio/sesiones?sesionID=${sesionID}`, {
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
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Completada":
        return "bg-green-50 text-green-700 border-green-200"
      case "Cancelada":
        return "bg-gray-50 text-gray-600 border-gray-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Agendada":
        return <Clock className="h-4 w-4" />
      case "Completada":
        return <CheckCircle className="h-4 w-4" />
      case "Cancelada":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando sesiones...</p>
        </div>
      </DashboardLayout>
    )
  }

  const sesionesActivas = sesiones.filter((s) => s.Estado !== "Cancelada" && s.Estado !== "Completada")
  const sesionesHistoricas = sesiones.filter((s) => s.Estado === "Cancelada" || s.Estado === "Completada")

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-rose-600 to-red-700 rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-2">Mis Sesiones Personales</h1>
          <p className="text-rose-100 text-lg">Gestiona tus entrenamientos personalizados</p>
        </div>

        {/* Sesiones Activas */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Sesiones Próximas</h2>
          {sesionesActivas.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-gray-600 text-lg">No tienes sesiones próximas agendadas</p>
                  <Button
                    onClick={() => (window.location.href = "/socio/entrenadores")}
                    className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800"
                  >
                    Agendar Nueva Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sesionesActivas.map((sesion) => (
                <Card
                  key={sesion.SesionID}
                  className="overflow-hidden border-l-4 border-l-rose-600 hover:shadow-lg transition-all"
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-rose-300">
                          <AvatarImage src={sesion.FotoURL || "/placeholder.svg"} alt={sesion.NombreEntrenador} />
                          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold">
                            {sesion.NombreEntrenador.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl text-gray-900">{sesion.NombreEntrenador}</CardTitle>
                          <p className="text-sm text-gray-600 font-medium">{sesion.Especialidad}</p>
                        </div>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-2 ${getEstadoColor(sesion.Estado)}`}
                      >
                        {getEstadoIcon(sesion.Estado)}
                        {sesion.Estado}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                          <div className="bg-rose-600 rounded-lg p-2">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Fecha</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(sesion.FechaSesion)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-rose-50 rounded-lg p-3">
                          <div className="bg-red-600 rounded-lg p-2">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Horario</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {sesion.HoraInicio} - {sesion.HoraFin}
                            </p>
                          </div>
                        </div>
                      </div>
                      {sesion.Notas && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-100">
                          <p className="text-sm font-semibold mb-2 text-gray-900">Notas de la sesión:</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{sesion.Notas}</p>
                        </div>
                      )}
                      {sesion.Estado === "Agendada" && (
                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelSesion(sesion.SesionID)}
                            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                          >
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Historial</h2>
            <div className="grid gap-3">
              {sesionesHistoricas.map((sesion) => (
                <Card key={sesion.SesionID} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-200">
                          <AvatarImage src={sesion.FotoURL || "/placeholder.svg"} alt={sesion.NombreEntrenador} />
                          <AvatarFallback className="bg-gray-300 text-gray-700 font-bold">
                            {sesion.NombreEntrenador.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{sesion.NombreEntrenador}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(sesion.FechaSesion)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {sesion.HoraInicio} - {sesion.HoraFin}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${getEstadoColor(sesion.Estado)}`}
                      >
                        {getEstadoIcon(sesion.Estado)}
                        {sesion.Estado}
                      </div>
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
