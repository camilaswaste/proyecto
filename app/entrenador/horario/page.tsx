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

export default function EntrenadorHorariosPage() {
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

  const calcularEstadoActual = (horariosData: Horario[]) => {
    const ahora = new Date()
    const diaActual = ahora.getDay()
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes()

    const horarioHoy = horariosData.find((h) => h.DiaSemana === diaActual)

    if (!horarioHoy || horarioHoy.Cerrado) {
      const proximoDiaAbierto =
        horariosData.find((h) => h.DiaSemana > diaActual && !h.Cerrado) || horariosData.find((h) => !h.Cerrado)

      if (proximoDiaAbierto) {
        setEstadoActual({
          abierto: false,
          mensaje: `Cerrado - Abre ${diasSemana[proximoDiaAbierto.DiaSemana]} a las ${formatearHora(
            proximoDiaAbierto.HoraApertura,
          )}`,
        })
      } else {
        setEstadoActual({ abierto: false, mensaje: "Cerrado hoy" })
      }
      return
    }

    const extraerMinutos = (horaString: string) => {
      let hora = horaString
      if (horaString.includes("T")) {
        hora = horaString.split("T")[1]
      }
      const [h, m] = hora.split(":").map(Number)
      return h * 60 + m
    }

    const minutosApertura = extraerMinutos(horarioHoy.HoraApertura)
    const minutosCierre = extraerMinutos(horarioHoy.HoraCierre)

    if (horaActual >= minutosApertura && horaActual < minutosCierre) {
      const minutosRestantes = minutosCierre - horaActual
      const horasRestantes = Math.floor(minutosRestantes / 60)
      const mins = minutosRestantes % 60
      setEstadoActual({
        abierto: true,
        mensaje: `Abierto ahora - Cierra ${
          horasRestantes > 0 ? `en ${horasRestantes}h ${mins}m` : `en ${mins} minutos`
        }`,
      })
    } else if (horaActual < minutosApertura) {
      setEstadoActual({
        abierto: false,
        mensaje: `Cerrado - Abre a las ${formatearHora(horarioHoy.HoraApertura)}`,
      })
    } else {
      const mañana = (diaActual + 1) % 7
      const horarioMañana = horariosData.find((h) => h.DiaSemana === mañana)
      if (horarioMañana && !horarioMañana.Cerrado) {
        setEstadoActual({
          abierto: false,
          mensaje: `Cerrado - Abre mañana a las ${formatearHora(horarioMañana.HoraApertura)}`,
        })
      } else {
        setEstadoActual({
          abierto: false,
          mensaje: `Cerrado - Abre mañana`,
        })
      }
    }
  }

  const formatearHora = (hora: string) => {
    let horaLimpia = hora
    if (hora.includes("T")) {
      horaLimpia = hora.split("T")[1]
    }
    const [h, m] = horaLimpia.split(":")
    return `${h}:${m}`
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando horarios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Horarios del Gimnasio</h1>
          <p className="text-muted-foreground">Consulta los horarios de apertura y cierre</p>
        </div>

        {/* Estado actual (dark-friendly, sin rojo fuerte) */}
        {estadoActual && (
          <Card
            className={
              estadoActual.abierto
                ? "border-emerald-300/60 bg-emerald-50/60 dark:border-emerald-400/25 dark:bg-emerald-950/25"
                : "border-amber-300/70 bg-amber-50/70 dark:border-amber-400/25 dark:bg-amber-950/25"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {estadoActual.abierto ? (
                  <div className="h-12 w-12 rounded-xl grid place-items-center bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-xl grid place-items-center bg-amber-100 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800/40">
                    <XCircle className="h-7 w-7 text-amber-700 dark:text-amber-300" />
                  </div>
                )}

                <div className="min-w-0">
                  <h2
                    className={
                      estadoActual.abierto
                        ? "text-2xl font-bold text-emerald-800 dark:text-emerald-200"
                        : "text-2xl font-bold text-amber-800 dark:text-amber-200"
                    }
                  >
                    {estadoActual.abierto ? "Gimnasio Abierto" : "Gimnasio Cerrado"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{estadoActual.mensaje}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Horarios Semanales</CardTitle>
            <CardDescription>Revisa los horarios para cada día de la semana</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {horarios.map((horario) => {
                const esHoy = horario.DiaSemana === new Date().getDay()

                return (
                  <div
                    key={horario.HorarioID}
                    className={[
                      "rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                      "bg-card",
                      "transition-colors",
                      esHoy
                        ? "border-amber-300/70 bg-amber-50/60 dark:border-amber-400/25 dark:bg-amber-950/20"
                        : "border-border",
                    ].join(" ")}
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="h-10 w-10 rounded-xl grid place-items-center border bg-muted/40">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${esHoy ? "text-amber-700 dark:text-amber-300" : ""}`}>
                            {diasSemana[horario.DiaSemana]}
                            {esHoy && " (Hoy)"}
                          </span>

                          {horario.Cerrado ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800/40">
                              Cerrado
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800/40">
                              Abierto
                            </span>
                          )}
                        </div>

                        {horario.Cerrado ? (
                          <p className="text-sm text-muted-foreground">Sin atención</p>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatearHora(horario.HoraApertura)} - {formatearHora(horario.HoraCierre)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {horario.Observaciones && (
                      <div className="text-xs text-muted-foreground italic sm:text-right">{horario.Observaciones}</div>
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
