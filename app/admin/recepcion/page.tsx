"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Clock, Trash2, UserCircle, CalendarDays, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface Horario {
  HorarioRecepcionID: number
  EntrenadorID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  Nombre: string
  Apellido: string
  Especialidad: string
}

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
  Especialidad: string
  Email: string
}

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export default function RecepcionPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [selectedEntrenador, setSelectedEntrenador] = useState<number | null>(null)
  const [selectedDia, setSelectedDia] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/recepcion")
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }
      const data = await response.json()
      setHorarios(data.horarios || [])
      setEntrenadores(data.entrenadores || [])
    } catch (error) {
      console.error("[recepcion] fetch error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }

  const handleAsignar = async () => {
    if (!selectedEntrenador || !selectedDia || !horaInicio || !horaFin) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    if (horaFin <= horaInicio) {
      toast({
        title: "Horario inválido",
        description: "La hora de fin debe ser posterior a la hora de inicio",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/recepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrenadorID: selectedEntrenador,
          diaSemana: selectedDia,
          horaInicio,
          horaFin,
        })
        ,
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: "Horario de recepción asignado correctamente",
      })

      setSelectedEntrenador(null)
      setSelectedDia("")
      setHoraInicio("")
      setHoraFin("")
      fetchData()
    } catch (error) {
      console.error("Error asignando horario:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar el horario",
        variant: "destructive",
      })
    }
  }

  const handleEliminar = async (horarioID: number) => {
    if (!confirm("¿Está seguro de eliminar este horario de recepción?")) return

    try {
      const response = await fetch(`/api/admin/recepcion?id=${horarioID}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: "Horario eliminado correctamente",
      })

      fetchData()
    } catch (error) {
      console.error("Error eliminando horario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      })
    }
  }

  // ✅ Agrupar + ordenar turnos por día (por HoraInicio)
  const horariosPorDia = useMemo(() => {
    const map: Record<string, Horario[]> = {}
    for (const dia of diasSemana) map[dia] = []
    for (const h of horarios) {
      if (!map[h.DiaSemana]) map[h.DiaSemana] = []
      map[h.DiaSemana].push(h)
    }
    for (const dia of Object.keys(map)) {
      map[dia].sort((a, b) => timeToMinutes(a.HoraInicio) - timeToMinutes(b.HoraInicio))
    }
    return map
  }, [horarios])

  const totalTurnos = horarios.length

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Recepción</h1>
            <p className="text-muted-foreground">
              Asigna turnos de recepción por día y tramo horario (Horario atención: 06:00–13:00, 13:00–23:00).
            </p>
          </div>

          <div className="flex gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{diasSemana.length} días</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{totalTurnos} turnos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Asignar turno</CardTitle>
              <CardDescription>Selecciona un entrenador, día y tramo horario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entrenador</Label>
                <Select
                  value={selectedEntrenador?.toString()}
                  onValueChange={(val) => setSelectedEntrenador(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrenadores.map((e) => (
                      <SelectItem key={e.EntrenadorID} value={e.EntrenadorID.toString()}>
                        {e.Nombre} {e.Apellido} — {e.Especialidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Día</Label>
                <Select value={selectedDia} onValueChange={setSelectedDia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleAsignar} className="w-full">
                Asignar turno
              </Button>

            </CardContent>
          </Card>

          {/* Cronograma: Timeline por día */}
          {/* Cronograma semanal - TIMELINE */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Horarios de Recepción Semanales</CardTitle>
              <CardDescription>Vista por día en formato agenda (bloques por tramo horario)</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {diasSemana.map((dia) => {
                  const items = [...(horariosPorDia[dia] || [])].sort((a, b) => a.HoraInicio.localeCompare(b.HoraInicio))

                  return (
                    <div key={dia} className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-primary">{dia}</h3>
                        <span className="text-xs text-muted-foreground">{items.length} turno(s)</span>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic py-6 text-center">
                          Sin turnos asignados
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-3">
                          {/* línea vertical */}
                          <div className="absolute left-[11px] top-1 bottom-1 w-px bg-muted" />

                          {items.map((horario) => (
                            <div key={horario.HorarioRecepcionID} className="relative">
                              {/* punto */}
                              <div className="absolute left-[6px] top-4 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" />

                              <div className="rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      <p className="font-semibold text-sm">
                                        {horario.HoraInicio} – {horario.HoraFin}
                                      </p>
                                    </div>

                                    <div className="mt-2 flex items-start gap-2 min-w-0">
                                      <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {horario.Nombre} {horario.Apellido}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{horario.Especialidad}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminar(horario.HorarioRecepcionID)}
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 flex-shrink-0"
                                    title="Eliminar turno"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
