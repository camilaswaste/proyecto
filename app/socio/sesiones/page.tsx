"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Calendar, CheckCircle, Clock, X, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

type EstadoSesion = "Agendada" | "Completada" | "Cancelada"
interface Sesion {
  SesionID: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: EstadoSesion
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
      if (!socioID) return

      const response = await fetch(`/api/socio/sesiones?socioID=${socioID}`)
      if (response.ok) {
        setSesiones(await response.json())
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSesion = async (sesionID: number) => {
    if (!confirm("¿Cancelar esta sesión?")) return

    const response = await fetch(`/api/socio/sesiones?sesionID=${sesionID}`, {
      method: "DELETE",
    })

    if (response.ok) fetchSesiones()
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const estadoStyle = {
    Agendada: "bg-blue-50 text-blue-700 border-blue-200",
    Completada: "bg-green-50 text-green-700 border-green-200",
    Cancelada: "bg-gray-50 text-gray-600 border-gray-200",
  }

  const sesionesActivas = sesiones.filter(s => s.Estado === "Agendada")
  const sesionesHistoricas = sesiones.filter(s => s.Estado !== "Agendada")

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex justify-center py-20 text-muted-foreground">
          Cargando sesiones...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-8">

        {/* Header sobrio */}
        <div className="rounded-xl bg-white p-8 shadow-sm border-l-8 border-[#123AB1]">
          <h1 className="text-3xl font-bold text-[#001E8A]">Sesiones Personales</h1>
          <p className="text-[#001E8A] mt-1">
            Revisa y gestiona tus entrenamientos personalizados
          </p>
        </div>

        {/* Sesiones activas */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Próximas sesiones</h2>

          {sesionesActivas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <Calendar className="mx-auto h-10 w-10 text-slate-400" />
                <p className="text-slate-600">No tienes sesiones agendadas</p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => (window.location.href = "/socio/entrenadores")}
                >
                  Agendar sesión
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sesionesActivas.map(sesion => (
                <Card key={sesion.SesionID} className="overflow-hidden border-l-4 border-[#123AB1] hover:shadow-lg transition-all">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 rounded-full object-cover border-4 border-white shadow-lg">
                        <AvatarImage src={sesion.FotoURL} />
                        <AvatarFallback className="bg-slate-300 text-slate-700 font-bold">
                          {sesion.NombreEntrenador.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{sesion.NombreEntrenador}</CardTitle>
                        <p className="text-sm text-muted-foreground">{sesion.Especialidad}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full border text-sm ${estadoStyle[sesion.Estado]}`}>
                      <Clock className="inline h-4 w-4 mr-1" />
                      Agendada
                    </span>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                        <Calendar className="text-slate-500" />
                        <span>{formatDate(sesion.FechaSesion)}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                        <Clock className="text-slate-500" />
                        <span>{sesion.HoraInicio} - {sesion.HoraFin}</span>
                      </div>
                    </div>

                    {sesion.Notas && (
                      <div className="bg-slate-50 border rounded-lg p-4 text-sm">
                        {sesion.Notas}
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelSesion(sesion.SesionID)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar sesión
                      </Button>
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
            <h2 className="text-2xl font-semibold mb-4">Historial</h2>
            <div className="grid gap-3">
              {sesionesHistoricas.map(sesion => (
                <Card key={sesion.SesionID}>
                  <CardContent className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{sesion.NombreEntrenador}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(sesion.FechaSesion)} · {sesion.HoraInicio}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full border text-xs ${estadoStyle[sesion.Estado]}`}>
                      {sesion.Estado === "Completada" ? <CheckCircle className="inline h-4 w-4 mr-1" /> : <XCircle className="inline h-4 w-4 mr-1" />}
                      {sesion.Estado}
                    </span>
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
