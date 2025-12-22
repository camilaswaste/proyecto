"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, User, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  NombreEntrenador: string
  Especialidad: string
  ReservasActuales: number
}

interface Reservacion {
  ClaseID: number
  FechaClase: string
  Estado: string
}

const formatTime = (timeString: string) => {
  try {
    const date = new Date(timeString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, "0")
    return `${displayHours}:${displayMinutes} ${ampm}`
  } catch {
    return timeString
  }
}

const getDayColor = (dia: string) => {
  const colorMap: Record<string, string> = {
    Lunes: "#DB030D",
    Martes: "#FC2F38",
    Miércoles: "#DB030D",
    Jueves: "#FC2F38",
    Viernes: "#DB030D",
    Sábado: "#FC2F38",
    Domingo: "#DB030D",
  }
  return colorMap[dia] || "#F06173"
}

export default function SocioClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [fechaClase, setFechaClase] = useState("")

  useEffect(() => {
    fetchClases()
  }, [])

  const fetchClases = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID

      const response = await fetch(`/api/socio/clases?socioID=${socioID}`)
      if (response.ok) {
        const data = await response.json()
        setClases(data.clases)
        setReservaciones(data.reservaciones)
      }
    } catch (error) {
      console.error("Error al cargar clases:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = (clase: Clase) => {
    setSelectedClase(clase)
    // Set default date to next occurrence of the class day
    const today = new Date()
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const targetDay = daysOfWeek.indexOf(clase.DiaSemana)
    const currentDay = today.getDay()
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0) daysToAdd += 7
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysToAdd)
    setFechaClase(nextDate.toISOString().split("T")[0])
    setShowDialog(true)
  }

  const handleSubmitReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClase) return

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID

      const response = await fetch("/api/socio/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          claseID: selectedClase.ClaseID,
          fechaClase,
        }),
      })

      if (response.ok) {
        alert("Clase reservada exitosamente")
        setShowDialog(false)
        fetchClases()
      } else {
        const error = await response.json()
        alert(error.error || "Error al reservar clase")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al reservar clase")
    }
  }

  const isClaseReservada = (claseID: number, fecha: string) => {
    return reservaciones.some((r) => r.ClaseID === claseID && r.FechaClase === fecha && r.Estado === "Reservada")
  }

  const getCuposDisponibles = (clase: Clase) => {
    return clase.CupoMaximo - clase.ReservasActuales
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </DashboardLayout>
    )
  }

  const diasOrdenados = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const clasesPorDia = diasOrdenados.reduce(
    (acc, dia) => {
      acc[dia] = clases.filter((c) => c.DiaSemana === dia)
      return acc
    },
    {} as Record<string, Clase[]>,
  )

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-[#FC2F38] p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Clases Grupales</h1>
            </div>
            <p className="text-white/90 text-lg">Encuentra tu clase ideal y reserva tu lugar</p>
          </div>
        </div>

        <div className="space-y-8">
          {diasOrdenados.map((dia) => {
            const clasesDelDia = clasesPorDia[dia]
            if (clasesDelDia.length === 0) return null

            const dayColor = getDayColor(dia)

            return (
              <div key={dia}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: dayColor }}>
                    {dia}
                  </h2>
                  <Badge variant="secondary" className="text-sm">
                    {clasesDelDia.length} {clasesDelDia.length === 1 ? "clase" : "clases"}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clasesDelDia.map((clase) => {
                    const cuposDisponibles = getCuposDisponibles(clase)
                    const estaLlena = cuposDisponibles === 0
                    const pocosEspacios = cuposDisponibles <= 3 && cuposDisponibles > 0

                    return (
                      <Card
                        key={clase.ClaseID}
                        className="group hover:shadow-xl transition-all duration-300 border-2 overflow-hidden relative"
                        style={{ borderColor: dayColor }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: dayColor }} />

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                                {clase.NombreClase}
                              </CardTitle>
                              {clase.Descripcion && (
                                <CardDescription className="mt-2 text-sm line-clamp-2">
                                  {clase.Descripcion}
                                </CardDescription>
                              )}
                            </div>
                            {estaLlena && (
                              <Badge variant="destructive" className="shrink-0">
                                Llena
                              </Badge>
                            )}
                            {pocosEspacios && !estaLlena && (
                              <Badge className="shrink-0 bg-orange-500 hover:bg-orange-600">¡Últimos!</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5">
                            <Clock className="h-4 w-4 shrink-0" style={{ color: dayColor }} />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatTime(clase.HoraInicio)} - {formatTime(clase.HoraFin)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                            <User className="h-4 w-4 shrink-0" style={{ color: dayColor }} />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {clase.NombreEntrenador}
                              </span>
                              {clase.Especialidad && (
                                <span className="text-xs text-muted-foreground">{clase.Especialidad}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                            <Users className="h-4 w-4 text-green-600 shrink-0" />
                            <span
                              className={`font-medium ${
                                estaLlena ? "text-red-600" : pocosEspacios ? "text-orange-600" : "text-green-600"
                              }`}
                            >
                              {estaLlena
                                ? "No hay cupos disponibles"
                                : `${cuposDisponibles} de ${clase.CupoMaximo} cupos disponibles`}
                            </span>
                          </div>

                          <Button
                            onClick={() => handleReservar(clase)}
                            disabled={estaLlena}
                            className={`w-full font-semibold ${estaLlena ? "" : "text-white hover:opacity-90"}`}
                            style={!estaLlena ? { backgroundColor: dayColor } : {}}
                          >
                            {estaLlena ? "Clase Llena" : "Reservar Ahora"}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Reservar: {selectedClase?.NombreClase}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitReserva} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fechaClase" className="text-base font-semibold">
                  Selecciona la fecha
                </Label>
                <Input
                  id="fechaClase"
                  type="date"
                  value={fechaClase}
                  onChange={(e) => setFechaClase(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="text-base"
                />
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 Esta clase se imparte los <strong>{selectedClase?.DiaSemana}s</strong>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Confirmar Reserva
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
