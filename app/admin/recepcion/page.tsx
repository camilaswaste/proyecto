"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Clock, Trash2, UserCircle, CalendarDays, Users, Plus } from "lucide-react"
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
        }),
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
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Gestión de Recepción</h1>
            <p className="text-muted-foreground text-lg">Asigna turnos de recepción por día y tramo horario</p>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg bg-primary/10 p-2">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{diasSemana.length}</p>
                <p className="text-xs text-muted-foreground">Días</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTurnos}</p>
                <p className="text-xs text-muted-foreground">Turnos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-2 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl">Asignar turno</CardTitle>
              </div>
              <CardDescription className="text-base">Selecciona un entrenador, día y tramo horario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Entrenador</Label>
                <Select
                  value={selectedEntrenador?.toString()}
                  onValueChange={(val) => setSelectedEntrenador(Number(val))}
                >
                  <SelectTrigger className="h-11 border-2">
                    <SelectValue placeholder="Seleccionar entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrenadores.map((e) => (
                      <SelectItem key={e.EntrenadorID} value={e.EntrenadorID.toString()}>
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {e.Nombre} {e.Apellido}
                          </span>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-xs text-muted-foreground">{e.Especialidad}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Día de la semana</Label>
                <Select value={selectedDia} onValueChange={setSelectedDia}>
                  <SelectTrigger className="h-11 border-2">
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>{dia}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Hora inicio</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="h-11 border-2 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Hora fin</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="h-11 border-2 pl-10"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAsignar}
                className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Asignar turno
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-2 shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl">Cronograma Semanal</CardTitle>
              </div>
              <CardDescription className="text-base">
                Vista por día con turnos asignados en formato agenda
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {diasSemana.map((dia) => {
                  const items = [...(horariosPorDia[dia] || [])].sort((a, b) =>
                    a.HoraInicio.localeCompare(b.HoraInicio),
                  )

                  return (
                    <div
                      key={dia}
                      className="rounded-xl border-2 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border">
                        <h3 className="font-bold text-base text-primary flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {dia}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary">
                          {items.length} turno{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic py-8 text-center rounded-lg bg-muted/20 border-2 border-dashed border-border">
                          Sin turnos asignados
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-3">
                          <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-border" />

                          {items.map((horario) => (
                            <div key={horario.HorarioRecepcionID} className="relative">
                              <div className="absolute left-[6px] top-4 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20 border-2 border-background" />

                              <div className="rounded-lg border-2 bg-card p-3 hover:bg-accent/5 hover:border-primary/50 transition-all group">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                                      <p className="font-bold text-sm">
                                        {horario.HoraInicio} – {horario.HoraFin}
                                      </p>
                                    </div>

                                    <div className="flex items-start gap-2 min-w-0">
                                      <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                          {horario.Nombre} {horario.Apellido}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{horario.Especialidad}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminar(horario.HorarioRecepcionID)}
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
