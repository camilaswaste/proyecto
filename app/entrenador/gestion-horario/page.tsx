"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getUser } from "@/lib/auth-client"
import { ArrowRightLeft, Check, Clock, Send, X } from "lucide-react"
import { useEffect, useState } from "react"

interface Horario {
  HorarioRecepcionID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  EntrenadorID?: number
  NombreEntrenador?: string
}

interface Solicitud {
  IntercambioID: number
  HorarioOrigenID: number
  HorarioDestinoID: number
  FechaSolicitud: string
  Estado: string
  NombreSolicitante?: string
  NombreDestinatario?: string
  DiaOrigen: string
  HoraInicioOrigen: string
  HoraFinOrigen: string
  DiaDestino: string
  HoraInicioDestino: string
  HoraFinDestino: string
}

export default function GestionHorarioPage() {
  const [misHorarios, setMisHorarios] = useState<Horario[]>([])
  const [otrosHorarios, setOtrosHorarios] = useState<Horario[]>([])
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<Solicitud[]>([])
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedMiHorario, setSelectedMiHorario] = useState<number | null>(null)
  const [selectedOtroHorario, setSelectedOtroHorario] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const user = getUser()
      if (!user?.entrenadorID) return

      const response = await fetch(`/api/entrenador/intercambios?entrenadorId=${user.entrenadorID}`)
      if (response.ok) {
        const data = await response.json()
        setMisHorarios(data.misHorarios || [])
        setOtrosHorarios(data.otrosHorarios || [])
        setSolicitudesRecibidas(data.solicitudesRecibidas || [])
        setSolicitudesEnviadas(data.solicitudesEnviadas || [])
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitarIntercambio = async () => {
    if (!selectedMiHorario || !selectedOtroHorario) {
      toast({
        title: "Error",
        description: "Debes seleccionar ambos horarios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/entrenador/intercambios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horarioOrigenId: selectedMiHorario,
          horarioDestinoId: selectedOtroHorario,
        }),
      })

      if (response.ok) {
        toast({
          title: "Solicitud enviada",
          description: "El entrenador recibirá tu solicitud de intercambio",
        })
        setShowDialog(false)
        setSelectedMiHorario(null)
        setSelectedOtroHorario(null)
        fetchData()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive",
      })
    }
  }

  const handleResponderSolicitud = async (intercambioId: number, accion: "aceptar" | "rechazar") => {
    try {
      const response = await fetch("/api/entrenador/intercambios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambioId, accion }),
      })

      if (response.ok) {
        toast({
          title: accion === "aceptar" ? "Intercambio aceptado" : "Intercambio rechazado",
          description: accion === "aceptar" ? "Los horarios han sido intercambiados" : "La solicitud ha sido rechazada",
        })
        fetchData()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Horario</h1>
          <p className="text-muted-foreground">Administra tus turnos de recepción e intercambios</p>
        </div>

        {/* Mis Horarios */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Mis Turnos de Recepción</CardTitle>
            <CardDescription>Tus horarios asignados en recepción</CardDescription>
          </CardHeader>
          <CardContent>
            {misHorarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes turnos asignados</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {misHorarios.map((horario) => (
                  <div
                    key={horario.HorarioRecepcionID}
                    className="
                      rounded-lg border border-border p-4
                      bg-primary/10 dark:bg-primary/15
                      hover:bg-primary/15 dark:hover:bg-primary/20
                      transition-colors
                    "
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{horario.DiaSemana}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {horario.HoraInicio} - {horario.HoraFin}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setShowDialog(true)} className="mt-4" disabled={misHorarios.length === 0}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Solicitar Intercambio
            </Button>
          </CardContent>
        </Card>

        {/* Solicitudes Recibidas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Solicitudes Recibidas</CardTitle>
            <CardDescription>Revisa las solicitudes de intercambio que te han enviado</CardDescription>
          </CardHeader>
          <CardContent>
            {solicitudesRecibidas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes solicitudes pendientes</p>
            ) : (
              <div className="space-y-4">
                {solicitudesRecibidas.map((solicitud) => (
                  <div
                    key={solicitud.IntercambioID}
                    className="rounded-lg border border-border p-4 bg-card"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground">{solicitud.NombreSolicitante}</span>
                      <Badge variant="secondary" className="border border-border">
                        Pendiente
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground mb-1">Te ofrece:</p>
                        <div className="rounded-md border border-border p-2 bg-muted/40 dark:bg-muted/20">
                          <p className="font-medium text-foreground">{solicitud.DiaOrigen}</p>
                          <p className="text-xs text-muted-foreground">
                            {solicitud.HoraInicioOrigen} - {solicitud.HoraFinOrigen}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Por tu turno:</p>
                        <div className="rounded-md border border-border p-2 bg-primary/10 dark:bg-primary/15">
                          <p className="font-medium text-foreground">{solicitud.DiaDestino}</p>
                          <p className="text-xs text-muted-foreground">
                            {solicitud.HoraInicioDestino} - {solicitud.HoraFinDestino}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResponderSolicitud(solicitud.IntercambioID, "aceptar")}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aceptar
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleResponderSolicitud(solicitud.IntercambioID, "rechazar")}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solicitudes Enviadas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Solicitudes Enviadas</CardTitle>
            <CardDescription>Solicitudes de intercambio que has enviado</CardDescription>
          </CardHeader>
          <CardContent>
            {solicitudesEnviadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No has enviado solicitudes</p>
            ) : (
              <div className="space-y-4">
                {solicitudesEnviadas.map((solicitud) => (
                  <div
                    key={solicitud.IntercambioID}
                    className="rounded-lg border border-border p-4 bg-muted/30 dark:bg-muted/15"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground">A: {solicitud.NombreDestinatario}</span>
                      <Badge variant="outline" className="border-border">
                        <Send className="h-3 w-3 mr-1" />
                        Enviada
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Tu turno:</p>
                        <div className="rounded-md border border-border p-2 bg-primary/10 dark:bg-primary/15">
                          <p className="font-medium text-foreground">{solicitud.DiaOrigen}</p>
                          <p className="text-xs text-muted-foreground">
                            {solicitud.HoraInicioOrigen} - {solicitud.HoraFinOrigen}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Por:</p>
                        <div className="rounded-md border border-border p-2 bg-muted/40 dark:bg-muted/20">
                          <p className="font-medium text-foreground">{solicitud.DiaDestino}</p>
                          <p className="text-xs text-muted-foreground">
                            {solicitud.HoraInicioDestino} - {solicitud.HoraFinDestino}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para solicitar intercambio */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="border-border bg-background text-foreground">
            <DialogHeader>
              <DialogTitle>Solicitar Intercambio de Turno</DialogTitle>
              <DialogDescription>Selecciona tu turno y el turno que deseas intercambiar</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Tu turno:</label>
                <Select value={selectedMiHorario?.toString()} onValueChange={(v) => setSelectedMiHorario(Number(v))}>
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue placeholder="Selecciona tu turno" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {misHorarios.map((h) => (
                      <SelectItem key={h.HorarioRecepcionID} value={h.HorarioRecepcionID.toString()}>
                        {h.DiaSemana} - {h.HoraInicio} a {h.HoraFin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Intercambiar por:</label>
                <Select
                  value={selectedOtroHorario?.toString()}
                  onValueChange={(v) => setSelectedOtroHorario(Number(v))}
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue placeholder="Selecciona turno deseado" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {otrosHorarios.map((h) => (
                      <SelectItem key={h.HorarioRecepcionID} value={h.HorarioRecepcionID.toString()}>
                        {h.NombreEntrenador} - {h.DiaSemana} {h.HoraInicio} a {h.HoraFin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSolicitarIntercambio}>Enviar Solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
