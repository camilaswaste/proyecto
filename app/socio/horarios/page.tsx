"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Horario {
  HorarioID: number
  DiaSemana: number
  HoraApertura: string
  HoraCierre: string
  Cerrado: boolean
  Observaciones: string | null
}

const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function SocioHorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [estadoActual, setEstadoActual] = useState<{ abierto: boolean; mensaje: string } | null>(null)

  useEffect(() => {
    fetchHorarios()
  }, [])

  const fetchHorarios = async () => {
    try {
      const response = await fetch("/api/horarios")
      if (response.ok) {
        const data = await response.json()
        setHorarios(data)
        calcularEstadoActual(data)
      }
    } catch (error) {
      console.error("Error al cargar horarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadoActual = (data: Horario[]) => {
    const ahora = new Date()
    const dia = ahora.getDay()
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes()

    const hoy = data.find((h) => h.DiaSemana === dia)

    const toMin = (hora: string) => {
      const h = hora.includes("T") ? hora.split("T")[1] : hora
      const [hh, mm] = h.split(":").map(Number)
      return hh * 60 + mm
    }

    if (!hoy || hoy.Cerrado) {
      setEstadoActual({ abierto: false, mensaje: "Cerrado hoy" })
      return
    }

    const inicio = toMin(hoy.HoraApertura)
    const cierre = toMin(hoy.HoraCierre)

    if (minutosActuales >= inicio && minutosActuales < cierre) {
      const restante = cierre - minutosActuales
      setEstadoActual({
        abierto: true,
        mensaje: `Cierra en ${Math.floor(restante / 60)}h ${restante % 60}m`,
      })
    } else if (minutosActuales < inicio) {
      setEstadoActual({
        abierto: false,
        mensaje: `Abre hoy a las ${formatearHora(hoy.HoraApertura)}`,
      })
    } else {
      setEstadoActual({
        abierto: false,
        mensaje: "Cerrado por hoy",
      })
    }
  }

  const formatearHora = (hora: string) => {
    const h = hora.includes("T") ? hora.split("T")[1] : hora
    return h.slice(0, 5)
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex justify-center py-24 text-muted-foreground">
          Cargando horarios...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-8">

        {/* HEADER */}
        <div className="rounded-2xl bg-gradient-to-r from-red-700 to-red-600 p-8 shadow text-white">
          <h1 className="text-3xl font-bold">Horarios del Gimnasio</h1>
          <p className="text-red-100 mt-1">
            Revisa los horarios de apertura y cierre
          </p>
        </div>

        {/* ESTADO ACTUAL */}
        {estadoActual && (
          <Card
            className={`border-l-8 ${
              estadoActual.abierto
                ? "border-red-600 bg-red-50 dark:bg-red-950/30"
                : "border-zinc-400 bg-zinc-50 dark:bg-zinc-900"
            }`}
          >
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6">
              {estadoActual.abierto ? (
                <CheckCircle className="h-10 w-10 text-red-600 shrink-0" />
              ) : (
                <XCircle className="h-10 w-10 text-zinc-500 shrink-0" />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {estadoActual.abierto ? "Gimnasio Abierto" : "Gimnasio Cerrado"}
                </h2>
                <p className="text-muted-foreground">{estadoActual.mensaje}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HORARIOS SEMANALES */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios Semanales</CardTitle>
            <CardDescription>
              Horarios oficiales del gimnasio por día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {horarios.map((h) => {
                const esHoy = h.DiaSemana === new Date().getDay()

                return (
                  <div
                    key={h.HorarioID}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 ${
                      esHoy
                        ? "border-red-600 bg-red-50 dark:bg-red-950/20"
                        : "bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className={`font-semibold ${esHoy ? "text-red-600" : ""}`}>
                        {diasSemana[h.DiaSemana]} {esHoy && "(Hoy)"}
                      </span>
                    </div>

                    {h.Cerrado ? (
                      <span className="text-sm font-medium text-zinc-500">
                        Cerrado
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatearHora(h.HoraApertura)} – {formatearHora(h.HoraCierre)}
                      </div>
                    )}

                    {h.Observaciones && (
                      <span className="text-xs text-muted-foreground italic sm:text-right">
                        {h.Observaciones}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}