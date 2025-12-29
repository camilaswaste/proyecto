"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Clock, UserPlus, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { getUser } from "@/lib/auth-client"
import { useNotificationToast } from "@/hooks/use-notification-toast"

// --- Interfaces ---
interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  EntrenadorID: number
  NombreEntrenador: string
  EmailEntrenador: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  CuposOcupados: number
  FechaInicio: string
  FechaFin: string
  Activa: boolean
}

interface Reserva {
  ReservaID: number
  ClaseID: number
  SocioID: number
  FechaClase: string
  FechaReserva: string
  Estado: "Reservada" | "Asistió" | "NoAsistió" | "Cancelada" | "Reprogramada"
  Nombre: string
  Apellido: string
  Email: string
  FotoURL?: string
  EstadoSocio: string
  NombrePlan?: string
}

interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  EstadoSocio: string
  FotoURL?: string
}

const estadoBadgeClass = (estado: Reserva["Estado"]) => {
  switch (estado) {
    case "Asistió":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50"
    case "NoAsistió":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/50"
    case "Cancelada":
      return "bg-muted text-muted-foreground border-border"
    case "Reprogramada":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50"
    default:
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-900/50"
  }
}

const actionBtnGreen =
  "bg-transparent border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-950/30"

const actionBtnRose =
  "bg-transparent border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/50 dark:text-rose-200 dark:hover:bg-rose-950/30"

const actionBtnAmber =
  "bg-transparent border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900 dark:border-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-950/30"

const actionBtnSky =
  "bg-transparent border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900/50 dark:text-sky-200 dark:hover:bg-sky-950/30"

// --- Helpers Toast UX ---
const toastWarn = (title: string, description: string) =>
  toast({
    title,
    description,
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  })

const toastDanger = (title: string, description: string) =>
  toast({
    title,
    description,
    variant: "destructive",
  })

const isDuplicateMsg = (msg: string) => {
  const m = (msg || "").toLowerCase()
  return (
    m.includes("ya") ||
    m.includes("existe") ||
    m.includes("duplic") ||
    m.includes("duplicate") ||
    m.includes("already") ||
    m.includes("inscrit") ||
    m.includes("reserv") ||
    m.includes("unique")
  )
}

export default function DetalleClaseEntrenadorPage() {
  const params = useParams()
  const router = useRouter()
  const claseId = params?.id as string

  const [clase, setClase] = useState<Clase | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSocio, setSelectedSocio] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterEstado, setFilterEstado] = useState<string>("all")
  const [usuarioID, setUsuarioID] = useState<string | null>(null)
  const [savingAdd, setSavingAdd] = useState(false)

  useNotificationToast({
    tipoUsuario: "Entrenador",
    usuarioID: usuarioID ? Number(usuarioID) : undefined,
  })

  useEffect(() => {
    const user = getUser()
    if (user?.usuarioID) {
      const uID = user.usuarioID.toString()
      setUsuarioID(uID)
      cargarDatos(uID)
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claseId])

  const cargarDatos = async (uID: string) => {
    try {
      setLoading(true)

      const claseRes = await fetch(`/api/entrenador/clases/${claseId}?usuarioID=${uID}`)
      if (!claseRes.ok) throw new Error("No tienes permiso o la clase no existe.")
      const claseData = await claseRes.json()
      setClase(claseData)

      const resRes = await fetch(`/api/entrenador/clases/${claseId}/reservas?usuarioID=${uID}`)
      const resData = await resRes.json()
      setReservas(Array.isArray(resData) ? resData : [])

      const socRes = await fetch("/api/admin/socios")
      const socData = await socRes.json()
      setSocios(Array.isArray(socData) ? socData : [])
    } catch (error: any) {
      toastDanger("Error", error?.message || "Ocurrió un problema al cargar los datos.")
    } finally {
      setLoading(false)
    }
  }

  // --- Formato ---
  const formatearHora = (horaRaw: any): string => {
    if (!horaRaw) return "00:00"
    const horaStr = String(horaRaw)
    if (horaStr.includes("T")) return horaStr.split("T")[1].substring(0, 5)
    return horaStr.substring(0, 5)
  }

  const calcularDuracion = (inicio: string, fin: string): string => {
    if (!inicio || !fin) return "0 min"
    try {
      const hoy = new Date().toISOString().split("T")[0]
      const dateInicio = new Date(`${hoy}T${formatearHora(inicio)}:00`)
      const dateFin = new Date(`${hoy}T${formatearHora(fin)}:00`)
      const diffMins = Math.round((dateFin.getTime() - dateInicio.getTime()) / 60000)
      return diffMins > 0 ? `${diffMins} min` : "60 min"
    } catch {
      return "60 min"
    }
  }

  const fechaISO = useMemo(() => selectedDate.toLocaleDateString("en-CA"), [selectedDate])

  const socioYaInscrito = useMemo(() => {
    if (!selectedSocio) return false
    const targetFecha = fechaISO
    return reservas.some((r) => {
      if (r.SocioID !== selectedSocio) return false
      if (!r.FechaClase) return false
      const f = String(r.FechaClase).slice(0, 10)
      if (f !== targetFecha) return false
      return r.Estado !== "Cancelada"
    })
  }, [reservas, selectedSocio, fechaISO])

  // --- Acciones ---
  const agregarReserva = async () => {
    if (!selectedSocio || !usuarioID) return

    if (socioYaInscrito) {
      toastWarn(
        "Ya inscrito",
        "Este socio ya está inscrito para la fecha seleccionada. Elige otra fecha o socio.",
      )
      return
    }

    // También validamos cupo local (por si la UI se queda atrás)
    const cupoMax = clase?.CupoMaximo ?? 0
    const ocupados = clase?.CuposOcupados ?? 0
    if (cupoMax > 0 && ocupados >= cupoMax) {
      toastWarn("Clase llena", "No hay cupos disponibles para esta clase.")
      return
    }

    setSavingAdd(true)
    try {
      const res = await fetch(`/api/entrenador/clases/${claseId}/reservas?usuarioID=${usuarioID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioId: selectedSocio, fechaClase: fechaISO }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = data?.error || data?.message || "Error al inscribir"
        // Caso duplicado / ya inscrito
        if (isDuplicateMsg(msg)) {
          toastWarn("Inscripción duplicada", msg)
        } else {
          toastDanger("Inscripción rechazada", msg)
        }
        return
      }

      toast({
        title: "Éxito",
        description: "Inscripción realizada correctamente.",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
      })

      setShowAddDialog(false)
      setSelectedSocio(null)
      setSearchTerm("")
      await cargarDatos(usuarioID)
    } catch (error: any) {
      toastDanger("Error", error?.message || "Error de conexión.")
    } finally {
      setSavingAdd(false)
    }
  }

  const actualizarEstadoReserva = async (reservaId: number, estado: string, nombreSocio: string) => {
    if (!usuarioID) return
    try {
      const res = await fetch(`/api/entrenador/clases/${claseId}/reservas/${reservaId}?usuarioID=${usuarioID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = data?.error || data?.message || "No se pudo actualizar el estado"
        toastDanger("Error", msg)
        return
      }

      toast({
        title: "Estado actualizado",
        description: `${nombreSocio} marcado como "${estado}"`,
        className:
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
      })

      await cargarDatos(usuarioID)
    } catch {
      toastDanger("Error", "No se pudo actualizar el estado")
    }
  }

  const cancelarReserva = async (reservaId: number, nombreSocio: string) => {
    if (!confirm(`¿Seguro que desea eliminar la reserva de ${nombreSocio}?`) || !usuarioID) return
    try {
      const res = await fetch(`/api/entrenador/clases/${claseId}/reservas/${reservaId}?usuarioID=${usuarioID}`, {
        method: "DELETE",
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = data?.error || data?.message || "No se pudo eliminar la reserva"
        toastDanger("Error", msg)
        return
      }

      toast({
        title: "Reserva eliminada",
        description: `La reserva de ${nombreSocio} fue eliminada correctamente.`,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
      })

      await cargarDatos(usuarioID)
    } catch {
      toastDanger("Error", "No se pudo eliminar la reserva")
    }
  }

  const sociosFiltrados = useMemo(() => {
    if (searchTerm.length < 2) return []
    return socios.filter((s) =>
      `${s.Nombre} ${s.Apellido} ${s.Email} ${s.RUT}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, socios])

  const stats = useMemo(() => {
    const reservadas = reservas.filter((r) => r.Estado === "Reservada").length
    const asistio = reservas.filter((r) => r.Estado === "Asistió").length
    const noAsistio = reservas.filter((r) => r.Estado === "NoAsistió").length
    const canceladas = reservas.filter((r) => r.Estado === "Cancelada").length
    const reprog = reservas.filter((r) => r.Estado === "Reprogramada").length
    return { reservadas, asistio, noAsistio, canceladas, reprog }
  }, [reservas])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!clase) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="text-muted-foreground">Clase no encontrada.</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/entrenador/clases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate">{clase.NombreClase}</h1>
            <p className="text-muted-foreground uppercase text-sm">
              {clase.DiaSemana} • {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
            </p>
          </div>

          <div className="ml-auto hidden md:block">
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            >
              Gestión de asistencia
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-amber-700 dark:text-amber-200" />}
            label="Cupo total"
            value={clase.CupoMaximo ?? 0}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />}
            label="Inscritos"
            value={clase.CuposOcupados ?? 0}
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-sky-700 dark:text-sky-200" />}
            label="Disponibles"
            value={Math.max(0, (clase.CupoMaximo || 0) - (clase.CuposOcupados || 0))}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-700 dark:text-amber-200" />}
            label="Duración"
            value={calcularDuracion(clase.HoraInicio, clase.HoraFin)}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información general</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Entrenador</Label>
                <p className="font-medium">{clase.NombreEntrenador}</p>
              </div>
              <div>
                <Label>Horario</Label>
                <p className="font-medium">
                  {clase.DiaSemana} {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                </p>
              </div>
              <div>
                <Label>Vigencia</Label>
                <p className="font-medium text-sm">
                  {clase.FechaInicio ? new Date(clase.FechaInicio).toLocaleDateString() : "N/A"} al{" "}
                  {clase.FechaFin ? new Date(clase.FechaFin).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <p className="text-sm text-muted-foreground">{clase.Descripcion || "Sin descripción"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                onClick={() => setShowAddDialog(true)}
                disabled={(clase.CuposOcupados || 0) >= (clase.CupoMaximo || 0)}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Inscribir socio
              </Button>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Tip: marca <span className="font-semibold text-foreground">Asistió</span> o{" "}
                <span className="font-semibold text-foreground">Faltó</span> desde el listado.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="truncate">Listado de reservas ({reservas.length})</CardTitle>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Reservada">Reservada</SelectItem>
                <SelectItem value="Asistió">Asistió</SelectItem>
                <SelectItem value="NoAsistió">No Asistió</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="Reprogramada">Reprogramada</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className="space-y-4">
            {reservas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay socios inscritos en esta clase todavía.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <ResumenItem label="Reservadas" value={stats.reservadas} tone="sky" />
                    <ResumenItem label="Asistieron" value={stats.asistio} tone="green" />
                    <ResumenItem label="No asistieron" value={stats.noAsistio} tone="rose" />
                    <ResumenItem label="Canceladas" value={stats.canceladas} tone="muted" />
                    <ResumenItem label="Reprogramadas" value={stats.reprog} tone="amber" />
                  </div>
                </div>

                {reservas
                  .filter((r) => filterEstado === "all" || r.Estado === (filterEstado as any))
                  .map((reserva) => (
                    <div
                      key={reserva.ReservaID}
                      className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={reserva.FotoURL || "/placeholder.svg"} />
                          <AvatarFallback className="bg-amber-100 text-amber-900 font-bold dark:bg-amber-950/40 dark:text-amber-100">
                            {reserva.Nombre?.[0]}
                            {reserva.Apellido?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="font-semibold text-base truncate">
                            {reserva.Nombre} {reserva.Apellido}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{reserva.Email}</p>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${estadoBadgeClass(reserva.Estado)}`}>
                              {reserva.Estado === "Asistió" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {reserva.Estado === "NoAsistió" && <XCircle className="h-3 w-3 mr-1" />}
                              {reserva.Estado === "Cancelada" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {reserva.Estado === "Reprogramada" && <Clock className="h-3 w-3 mr-1" />}
                              {reserva.Estado}
                            </Badge>

                            <span className="text-xs text-muted-foreground">
                              Clase: {new Date(reserva.FechaClase).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {reserva.Estado === "Reservada" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className={actionBtnGreen}
                              onClick={() =>
                                actualizarEstadoReserva(
                                  reserva.ReservaID,
                                  "Asistió",
                                  `${reserva.Nombre} ${reserva.Apellido}`,
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Asistió
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className={actionBtnRose}
                              onClick={() =>
                                actualizarEstadoReserva(
                                  reserva.ReservaID,
                                  "NoAsistió",
                                  `${reserva.Nombre} ${reserva.Apellido}`,
                                )
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Faltó
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className={actionBtnAmber}
                              onClick={() =>
                                actualizarEstadoReserva(
                                  reserva.ReservaID,
                                  "Reprogramada",
                                  `${reserva.Nombre} ${reserva.Apellido}`,
                                )
                              }
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reprogramar
                            </Button>
                          </>
                        )}

                        {(reserva.Estado === "Asistió" ||
                          reserva.Estado === "NoAsistió" ||
                          reserva.Estado === "Reprogramada") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={actionBtnSky}
                            onClick={() =>
                              actualizarEstadoReserva(reserva.ReservaID, "Reservada", `${reserva.Nombre} ${reserva.Apellido}`)
                            }
                          >
                            Revertir
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => cancelarReserva(reserva.ReservaID, `${reserva.Nombre} ${reserva.Apellido}`)}
                          title="Eliminar reserva"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogo Inscribir Socio */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) {
            setSelectedSocio(null)
            setSearchTerm("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inscribir nuevo socio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha de la clase</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="border border-border rounded-md mx-auto bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Buscar socio (RUT o nombre)</Label>
              <Input
                placeholder="Escribe al menos 2 letras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="max-h-40 overflow-y-auto border border-border rounded-md bg-background">
                {sociosFiltrados.length === 0 && searchTerm.length >= 2 && (
                  <p className="p-2 text-sm text-muted-foreground">No se encontraron socios.</p>
                )}

                {sociosFiltrados.map((s) => (
                  <div
                    key={s.SocioID}
                    onClick={() => setSelectedSocio(s.SocioID)}
                    className={[
                      "p-2 cursor-pointer text-sm border-b last:border-b-0",
                      "hover:bg-muted/40",
                      selectedSocio === s.SocioID
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-amber-500 font-semibold"
                        : "",
                    ].join(" ")}
                  >
                    {s.Nombre} {s.Apellido} ({s.RUT})
                  </div>
                ))}
              </div>

              {selectedSocio && socioYaInscrito && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Este socio ya está inscrito para <strong>{fechaISO}</strong>.
                </div>
              )}
            </div>

            <Button
              className="w-full bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              disabled={!selectedSocio || socioYaInscrito || savingAdd}
              onClick={agregarReserva}
            >
              {savingAdd ? "Inscribiendo..." : "Confirmar inscripción"}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="p-2 rounded-full bg-muted/60 border border-border">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  )
}

function ResumenItem({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "sky" | "green" | "rose" | "amber" | "muted"
}) {
  const toneClass =
    tone === "sky"
      ? "text-sky-700 dark:text-sky-200"
      : tone === "green"
        ? "text-emerald-700 dark:text-emerald-200"
        : tone === "rose"
          ? "text-rose-700 dark:text-rose-200"
          : tone === "amber"
            ? "text-amber-800 dark:text-amber-200"
            : "text-muted-foreground"

  return (
    <div className="text-center rounded-md border bg-background/40 px-2 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}