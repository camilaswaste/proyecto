"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth-client"
import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
  Email: string
  Especialidad: string
  Certificaciones: string
  FotoURL?: string
  FotoDemo?: string // Added FotoDemo for stock photos
}

export default function SocioEntrenadoresPage() {
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null)
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [bookingTrainer, setBookingTrainer] = useState<Entrenador | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<{ sessionCount: number; message: string } | null>(null)
  const [formData, setFormData] = useState({
    fechaSesion: "",
    horaInicio: "",
    horaFin: "",
    notas: "",
  })

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/socio/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      } else {
        console.error("Failed to fetch entrenadores:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBooking = (entrenador: Entrenador) => {
    setBookingTrainer(entrenador)
    setFormData({
      fechaSesion: "",
      horaInicio: "",
      horaFin: "",
      notas: "",
    })
    setShowBookingDialog(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent, forceBooking = false) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = getUser()
      const socioID = user?.socioID || user?.usuarioID

      if (!socioID || !bookingTrainer) {
        alert("Error: No se pudo identificar al socio")
        setSubmitting(false)
        return
      }

      const response = await fetch("/api/socio/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          entrenadorID: bookingTrainer.EntrenadorID,
          ...formData,
          forceBooking, // Indicar si el usuario ya confirmó el conflicto
        }),
      })

      const data = await response.json()

      // Si hay una advertencia de conflicto, mostrar diálogo de confirmación
      if (data.warning && !forceBooking) {
        setConflictInfo({ sessionCount: data.sessionCount, message: data.message })
        setShowConflictDialog(true)
        setSubmitting(false)
        return
      }

      if (response.ok) {
        alert("Sesión agendada exitosamente")
        setShowBookingDialog(false)
        setShowConflictDialog(false)
        setConflictInfo(null)
        setFormData({
          fechaSesion: "",
          horaInicio: "",
          horaFin: "",
          notas: "",
        })
      } else {
        alert(data.error || "Error al agendar sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agendar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmBooking = async () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    await handleSubmitBooking(fakeEvent, true)
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando entrenadores...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm border-l-8 border-[#21B536]">
          <h1 className="text-3xl font-bold text-[#167322]">Entrenadores</h1>
          <p className="text-[#167322]">Conoce a nuestros entrenadores profesionales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entrenadores.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No hay entrenadores disponibles</p>
              </CardContent>
            </Card>
          ) : (
            entrenadores.map((entrenador) => (
              <Card key={entrenador.EntrenadorID} className="relative overflow-hidden border-l-4 border-l-[#21B536] hover:shadow-lg transition-shadow">
                <div className="relative h-48 rounded-t-xl overflow-hidden">
                  {entrenador.FotoDemo ? (
                    <img
                      src={entrenador.FotoDemo || "/placeholder.svg"}
                      alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {entrenador.Nombre[0]}
                          {entrenador.Apellido[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative px-6">
                  <div className="absolute -top-12 left-6">
                    {entrenador.FotoURL ? (
                      <img
                        src={entrenador.FotoURL || "/placeholder.svg"}
                        alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {entrenador.Nombre[0]}
                          {entrenador.Apellido[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <CardHeader className="pt-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>
                        {entrenador.Nombre} {entrenador.Apellido}
                      </CardTitle>
                      <CardDescription>{entrenador.Especialidad || "Entrenador Personal"}</CardDescription>
                      {entrenador.Certificaciones && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Certificaciones: {entrenador.Certificaciones}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={selectedTrainer === entrenador.EntrenadorID ? "default" : "outline"}
                      onClick={() =>
                        setSelectedTrainer(selectedTrainer === entrenador.EntrenadorID ? null : entrenador.EntrenadorID)
                      }
                    >
                      {selectedTrainer === entrenador.EntrenadorID ? "Ocultar Info" : "Ver Más"}
                    </Button>
                  </div>
                </CardHeader>

                {selectedTrainer === entrenador.EntrenadorID && (
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Información de Contacto</span>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {entrenador.Email}
                        </p>
                        {entrenador.Especialidad && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Especialidad:</span> {entrenador.Especialidad}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full md:w-auto" onClick={() => handleOpenBooking(entrenador)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Sesión con {entrenador.Nombre}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Agendar Sesión con {bookingTrainer?.Nombre} {bookingTrainer?.Apellido}
              </DialogTitle>
              <DialogClose onClose={() => setShowBookingDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <Label htmlFor="fechaSesion">Fecha de la Sesión *</Label>
                <Input
                  id="fechaSesion"
                  type="date"
                  value={formData.fechaSesion}
                  onChange={(e) => setFormData({ ...formData, fechaSesion: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horaInicio">Hora de Inicio *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="horaFin">Hora de Fin *</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas (opcional)</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  placeholder="Objetivos, áreas de enfoque, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingDialog(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Agendando..." : "Agendar Sesión"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conflicto de Horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{conflictInfo?.message}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
                  ¿Desea agendar la sesión de igual manera?
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConflictDialog(false)
                    setConflictInfo(null)
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleConfirmBooking} disabled={submitting}>
                  {submitting ? "Agendando..." : "Sí, Agendar de Todas Formas"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
