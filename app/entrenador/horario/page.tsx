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
          mensaje: `Cerrado - Abre ${diasSemana[proximoDiaAbierto.DiaSemana]} a las ${formatearHora(proximoDiaAbierto.HoraApertura)}`,
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
        mensaje: `Abierto ahora - Cierra ${horasRestantes > 0 ? `en ${horasRestantes}h ${mins}m` : `en ${mins} minutos`}`,
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

        {estadoActual && (
          <Card className={estadoActual.abierto ? "border-green-500 bg-green-50/50" : "border-red-500 bg-red-50/50"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {estadoActual.abierto ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${estadoActual.abierto ? "text-green-700" : "text-red-700"}`}>
                    {estadoActual.abierto ? "Gimnasio Abierto" : "Gimnasio Cerrado"}
                  </h2>
                  <p className="text-muted-foreground">{estadoActual.mensaje}</p>
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
                    className={`border rounded-lg p-4 flex items-center justify-between ${
                      esHoy ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className={`font-semibold ${esHoy ? "text-primary" : ""}`}>
                          {diasSemana[horario.DiaSemana]}
                          {esHoy && " (Hoy)"}
                        </span>
                      </div>
                      {horario.Cerrado ? (
                        <span className="text-sm text-red-600 font-medium">Cerrado</span>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatearHora(horario.HoraApertura)} - {formatearHora(horario.HoraCierre)}
                          </span>
                        </div>
                      )}
                    </div>
                    {horario.Observaciones && (
                      <span className="text-xs text-muted-foreground italic">{horario.Observaciones}</span>
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
