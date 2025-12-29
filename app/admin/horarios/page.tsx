"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock, Loader2, Save, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface Horario {
  HorarioID: number
  DiaSemana: number
  HoraApertura: string
  HoraCierre: string
  Cerrado: boolean
  Observaciones: string | null
}

const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function AdminHorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHorarios()
  }, [])

  const fetchHorarios = async () => {
    try {
      const response = await fetch("/api/horarios")
      if (response.ok) {
        const data = await response.json()
        setHorarios(data)
      }
    } catch (error) {
      console.error("Error al cargar horarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = (horarioID: number, field: string, value: any) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.HorarioID === horarioID
          ? {
              ...h,
              [field]: value,
            }
          : h,
      ),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const horariosToSave = horarios.map((h) => ({
        horarioID: h.HorarioID,
        diaSemana: h.DiaSemana,
        horaApertura: h.HoraApertura,
        horaCierre: h.HoraCierre,
        cerrado: h.Cerrado,
        observaciones: h.Observaciones,
      }))

      const response = await fetch("/api/horarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horariosToSave),
      })

      if (response.ok) {
        alert("Horarios actualizados exitosamente")
        fetchHorarios()
      } else {
        const error = await response.json()
        alert(error.error || "Error al actualizar horarios")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar horarios")
    } finally {
      setSaving(false)
    }
  }

  const dayAccent = useMemo(
    () => [
      { ring: "ring-red-500/15", border: "border-red-500/25", badge: "text-red-600 bg-red-500/10 border-red-500/20" }, // Dom
      { ring: "ring-orange-500/15", border: "border-orange-500/25", badge: "text-orange-600 bg-orange-500/10 border-orange-500/20" }, // Lun
      { ring: "ring-amber-500/15", border: "border-amber-500/25", badge: "text-amber-700 bg-amber-500/10 border-amber-500/20" }, // Mar
      { ring: "ring-emerald-500/15", border: "border-emerald-500/25", badge: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20" }, // Mié
      { ring: "ring-sky-500/15", border: "border-sky-500/25", badge: "text-sky-700 bg-sky-500/10 border-sky-500/20" }, // Jue
      { ring: "ring-indigo-500/15", border: "border-indigo-500/25", badge: "text-indigo-700 bg-indigo-500/10 border-indigo-500/20" }, // Vie
      { ring: "ring-purple-500/15", border: "border-purple-500/25", badge: "text-purple-700 bg-purple-500/10 border-purple-500/20" }, // Sáb
    ],
    [],
  )

  const stats = useMemo(() => {
    const abiertos = horarios.filter((h) => !h.Cerrado).length
    const cerrados = horarios.filter((h) => h.Cerrado).length
    const conObs = horarios.filter((h) => (h.Observaciones || "").trim().length > 0).length
    return { abiertos, cerrados, conObs }
  }, [horarios])

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Cargando horarios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-red-500/10 p-6">
          <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]">
            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,0,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
                <Sparkles className="h-4 w-4 text-red-500" />
                Configuración operativa semanal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Horarios del Gimnasio</h1>
              <p className="text-muted-foreground">Apertura, cierre y observaciones por día — con vista clara y moderna.</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border bg-gradient-to-b from-background to-emerald-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Días Abiertos</p>
                  <p className="text-3xl font-bold text-emerald-700">{stats.abiertos}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Días con horario configurado para atención.</p>
            </CardContent>
          </Card>

          <Card className="border bg-gradient-to-b from-background to-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Días Cerrados</p>
                  <p className="text-3xl font-bold text-red-700">{stats.cerrados}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-red-700" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Días marcados como no operativos.</p>
            </CardContent>
          </Card>

          <Card className="border bg-gradient-to-b from-background to-sky-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Con Observaciones</p>
                  <p className="text-3xl font-bold text-sky-700">{stats.conObs}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-sky-700" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Días con notas (mantención, eventos, etc.).</p>
            </CardContent>
          </Card>
        </div>

        {/* LISTA */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Configuración Semanal</CardTitle>
            <CardDescription>Define horarios y estado por día. Cambios se guardan con el botón superior.</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {horarios.map((horario) => {
                const accent = dayAccent[horario.DiaSemana] || dayAccent[0]
                const abierto = !horario.Cerrado

                return (
                  <div
                    key={horario.HorarioID}
                    className={[
                      "group rounded-2xl border bg-card p-4 transition-all",
                      "hover:shadow-md hover:-translate-y-[1px]",
                      "ring-1",
                      accent.ring,
                      accent.border,
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "mt-0.5 h-11 w-11 rounded-xl flex items-center justify-center",
                            "bg-muted/60 ring-1 ring-border group-hover:bg-background transition-colors",
                          ].join(" ")}
                        >
                          <Clock className="h-5 w-5 text-foreground" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{diasSemana[horario.DiaSemana]}</h3>
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                abierto
                                  ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/20"
                                  : "text-red-700 bg-red-500/10 border-red-500/20",
                              ].join(" ")}
                            >
                              {abierto ? "Abierto" : "Cerrado"}
                            </span>

                            {!!(horario.Observaciones || "").trim() && (
                              <span
                                className={[
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                  accent.badge,
                                ].join(" ")}
                              >
                                Observación
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {abierto ? "Configura la franja horaria y agrega notas si corresponde." : "Este día no estará operativo."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={abierto}
                            onCheckedChange={(checked) => handleUpdate(horario.HorarioID, "Cerrado", !checked)}
                          />
                          <Label className="text-sm text-muted-foreground">{abierto ? "Operativo" : "No operativo"}</Label>
                        </div>
                      </div>
                    </div>

                    {/* CONTENIDO */}
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        {!horario.Cerrado ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`apertura-${horario.HorarioID}`} className="text-sm">
                                Hora de Apertura
                              </Label>
                              <Input
                                id={`apertura-${horario.HorarioID}`}
                                type="time"
                                value={horario.HoraApertura}
                                onChange={(e) => handleUpdate(horario.HorarioID, "HoraApertura", e.target.value)}
                                className="h-11 bg-background/60 focus-visible:ring-red-500/30"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`cierre-${horario.HorarioID}`} className="text-sm">
                                Hora de Cierre
                              </Label>
                              <Input
                                id={`cierre-${horario.HorarioID}`}
                                type="time"
                                value={horario.HoraCierre}
                                onChange={(e) => handleUpdate(horario.HorarioID, "HoraCierre", e.target.value)}
                                className="h-11 bg-background/60 focus-visible:ring-red-500/30"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                            Día cerrado. Activa el switch para configurar apertura/cierre.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`obs-${horario.HorarioID}`} className="text-sm">
                          Observaciones
                        </Label>
                        <Input
                          id={`obs-${horario.HorarioID}`}
                          value={horario.Observaciones || ""}
                          onChange={(e) => handleUpdate(horario.HorarioID, "Observaciones", e.target.value)}
                          placeholder="Ej: Mantención, horario especial..."
                          className="h-11 bg-background/60 focus-visible:ring-red-500/30"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FOOTER MINI */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">
                Tip: usa <span className="font-medium text-foreground">Observaciones</span> para feriados, eventos o mantenciones.
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="gap-2 hover:bg-red-500/10 hover:text-red-700 hover:border-red-500/30"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}