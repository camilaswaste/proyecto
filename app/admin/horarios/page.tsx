"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock, Save } from "lucide-react"
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

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando horarios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Horarios del Gimnasio</h1>
            <p className="text-muted-foreground">Configura los horarios de apertura y cierre</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Semanal</CardTitle>
            <CardDescription>Define los horarios para cada día de la semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {horarios.map((horario) => (
                <div key={horario.HorarioID} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {diasSemana[horario.DiaSemana]}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!horario.Cerrado}
                        onCheckedChange={(checked) => handleUpdate(horario.HorarioID, "Cerrado", !checked)}
                      />
                      <Label>{horario.Cerrado ? "Cerrado" : "Abierto"}</Label>
                    </div>
                  </div>

                  {!horario.Cerrado && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`apertura-${horario.HorarioID}`}>Hora de Apertura</Label>
                        <Input
                          id={`apertura-${horario.HorarioID}`}
                          type="time"
                          value={horario.HoraApertura}
                          onChange={(e) => handleUpdate(horario.HorarioID, "HoraApertura", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cierre-${horario.HorarioID}`}>Hora de Cierre</Label>
                        <Input
                          id={`cierre-${horario.HorarioID}`}
                          type="time"
                          value={horario.HoraCierre}
                          onChange={(e) => handleUpdate(horario.HorarioID, "HoraCierre", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`obs-${horario.HorarioID}`}>Observaciones (opcional)</Label>
                    <Input
                      id={`obs-${horario.HorarioID}`}
                      value={horario.Observaciones || ""}
                      onChange={(e) => handleUpdate(horario.HorarioID, "Observaciones", e.target.value)}
                      placeholder="Ej: Horario especial, mantenimiento, etc."
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
