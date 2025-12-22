"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { useEffect, useState } from "react"

interface Evento {
  id: string
  tipo: "clase" | "sesion"
  titulo: string
  horaInicio: string
  horaFin: string
  dia: string
  cupo?: string
  socio?: string
}

const diasSemanaEspanol = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const diasSemanaIngles = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const mapDiaToSpanish = (diaIngles: string): string => {
  const index = diasSemanaIngles.indexOf(diaIngles)
  return index !== -1 ? diasSemanaEspanol[index] : diaIngles
}

export default function EntrenadorCronogramaPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventos()
  }, [])

  const fetchEventos = async () => {
    try {
      const user = getUser()
      console.log("Usuario obtenido:", user)
      if (!user?.usuarioID) return

      const profileResponse = await fetch(`/api/entrenador/profile?usuarioID=${user.usuarioID}`)
      if (!profileResponse.ok) return

      const profileData = await profileResponse.json()
      console.log("Profile data:", profileData)
      if (!profileData.EntrenadorID) return

      const clasesResponse = await fetch(`/api/entrenador/clases?usuarioID=${user.usuarioID}`)
      const clases = clasesResponse.ok ? await clasesResponse.json() : []
      console.log("Clases recibidas:", clases)

      const sesionesResponse = await fetch(`/api/entrenador/sesiones?entrenadorID=${profileData.EntrenadorID}`)
      const sesiones = sesionesResponse.ok ? await sesionesResponse.json() : []
      console.log("Sesiones recibidas:", sesiones)

      const eventosClases: Evento[] = clases.flatMap((clase: any) => {
        const diasArray = Array.isArray(clase.DiaSemana) ? clase.DiaSemana : [clase.DiaSemana]
        console.log("Procesando clase:", clase.NombreClase, "Días:", diasArray)
        return diasArray.map((dia: string) => ({
          id: `clase-${clase.ClaseID}-${dia}`,
          tipo: "clase" as const,
          titulo: clase.NombreClase,
          horaInicio: clase.HoraInicio?.substring(0, 5) || clase.HoraInicio,
          horaFin: clase.HoraFin?.substring(0, 5) || clase.HoraFin,
          dia: dia, // Already in Spanish
          cupo: `${clase.Inscritos || 0}/${clase.CupoMaximo}`,
        }))
      })
      console.log("Eventos de clases procesados:", eventosClases)

      const eventosSesiones: Evento[] = sesiones.map((sesion: any) => {
        const fecha = new Date(sesion.FechaSesion)
        const diaSemana = diasSemanaEspanol[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]

        return {
          id: `sesion-${sesion.SesionID}`,
          tipo: "sesion" as const,
          titulo: "Sesión Personal",
          horaInicio: sesion.HoraInicio?.substring(0, 5) || sesion.HoraInicio,
          horaFin: sesion.HoraFin?.substring(0, 5) || sesion.HoraFin,
          dia: diaSemana,
          socio: `${sesion.NombreSocio || ""} ${sesion.ApellidoSocio || ""}`.trim(),
        }
      })

      setEventos([...eventosClases, ...eventosSesiones])
      console.log("Eventos totales configurados:", [...eventosClases, ...eventosSesiones])
    } catch (error) {
      console.error("Error al cargar cronograma:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventosDelDia = (dia: string) => {
    return eventos.filter((e) => e.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  const getDiaActual = () => {
    const hoy = new Date().getDay()
    return diasSemanaEspanol[hoy === 0 ? 6 : hoy - 1]
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando cronograma...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Cronograma</h1>
          <p className="text-muted-foreground">Tus clases y sesiones personales de la semana</p>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {diasSemanaEspanol.map((dia) => {
            const eventosDelDia = getEventosDelDia(dia)
            const esHoy = dia === getDiaActual()

            return (
              <Card key={dia} className={esHoy ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {dia}
                    {esHoy && <span className="ml-2 text-xs text-primary">(Hoy)</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eventosDelDia.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin eventos</p>
                  ) : (
                    eventosDelDia.map((evento) => (
                      <div
                        key={evento.id}
                        className={`p-2 rounded-md text-xs ${
                          evento.tipo === "clase"
                            ? "bg-blue-100 border border-blue-200"
                            : "bg-green-100 border border-green-200"
                        }`}
                      >
                        <div className="font-medium">{evento.titulo}</div>
                        <div className="text-muted-foreground mt-1">
                          {evento.horaInicio} - {evento.horaFin}
                        </div>
                        {evento.tipo === "clase" && evento.cupo && (
                          <div className="text-muted-foreground mt-1">Cupo: {evento.cupo}</div>
                        )}
                        {evento.tipo === "sesion" && evento.socio && (
                          <div className="text-muted-foreground mt-1">{evento.socio}</div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
            <span>Clases Grupales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
            <span>Sesiones Personales</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
