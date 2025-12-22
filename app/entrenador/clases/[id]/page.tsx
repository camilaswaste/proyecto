"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ClaseID: number; NombreClase: string; Descripcion: string;
  EntrenadorID: number; NombreEntrenador: string; EmailEntrenador: string;
  DiaSemana: string; HoraInicio: string; HoraFin: string;
  CupoMaximo: number; CuposOcupados: number;
  FechaInicio: string; FechaFin: string; Activa: boolean;
}

interface Reserva {
  ReservaID: number; ClaseID: number; SocioID: number; FechaClase: string;
  Estado: "Reservada" | "Asistió" | "NoAsistió" | "Cancelada";
  Nombre: string; Apellido: string; Email: string; FotoURL?: string;
  EstadoSocio: string; NombrePlan?: string;
}

interface Socio {
  SocioID: number; RUT: string; Nombre: string; Apellido: string;
  Email: string; EstadoSocio: string; FotoURL?: string;
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

  // 👉 Activar notificaciones en tiempo real para el Entrenador
  useNotificationToast({
    tipoUsuario: "Entrenador",
    usuarioID: usuarioID ? Number(usuarioID) : undefined
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
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // --- Funciones de Formateo ---
  const formatearHora = (horaRaw: any): string => {
    if (!horaRaw) return "00:00";
    const horaStr = String(horaRaw);
    if (horaStr.includes("T")) {
      return horaStr.split("T")[1].substring(0, 5);
    }
    return horaStr.substring(0, 5);
  }

  const calcularDuracion = (inicio: string, fin: string): string => {
    if (!inicio || !fin) return "0 min";
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const dateInicio = new Date(`${hoy}T${formatearHora(inicio)}:00`);
      const dateFin = new Date(`${hoy}T${formatearHora(fin)}:00`);
      const diffMs = dateFin.getTime() - dateInicio.getTime();
      const diffMins = Math.round(diffMs / 60000);
      return diffMins > 0 ? `${diffMins} min` : "60 min";
    } catch {
      return "60 min";
    }
  }

  // --- Lógica de Acciones ---
  const agregarReserva = async () => {
    if (!selectedSocio || !usuarioID) return;
    const fechaClase = selectedDate.toLocaleDateString('en-CA');

    try {
      const res = await fetch(`/api/entrenador/clases/${claseId}/reservas?usuarioID=${usuarioID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioId: selectedSocio, fechaClase }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al inscribir");
      }

      toast({ title: "Éxito", description: "Inscripción realizada correctamente." });
      setShowAddDialog(false);
      setSelectedSocio(null);
      setSearchTerm("");
      cargarDatos(usuarioID);

      // Dentro de agregarReserva...
    } catch (error: any) {
      toast({
        title: "Inscripción Rechazada",
        description: error.message,
        variant: "destructive", // Esto ya debería poner el fondo rojo
        // Añadimos estas clases para forzar la legibilidad
        className: "bg-red-600 text-white border-none shadow-2xl",
      });
    }
  };

  const actualizarEstadoReserva = async (reservaId: number, estado: string) => {
    if (!usuarioID) return
    try {
      await fetch(`/api/entrenador/clases/${claseId}/reservas/${reservaId}?usuarioID=${usuarioID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      cargarDatos(usuarioID)
    } catch (error) { console.error(error) }
  }

  const cancelarReserva = async (reservaId: number) => {
    if (!confirm("¿Seguro que desea eliminar esta reserva?") || !usuarioID) return
    try {
      await fetch(`/api/entrenador/clases/${claseId}/reservas/${reservaId}?usuarioID=${usuarioID}`, {
        method: "DELETE",
      })
      cargarDatos(usuarioID)
    } catch (error) { console.error(error) }
  }

  const sociosFiltrados = useMemo(() => {
    if (searchTerm.length < 2) return []
    return socios.filter(s =>
      `${s.Nombre} ${s.Apellido} ${s.Email} ${s.RUT}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, socios])

  if (loading) return (
    <DashboardLayout role="Entrenador">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </DashboardLayout>
  )

  if (!clase) return <DashboardLayout role="Entrenador"><div>No encontrada</div></DashboardLayout>

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/entrenador/clases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{clase.NombreClase}</h1>
            <p className="text-muted-foreground uppercase">
              {clase.DiaSemana} • {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<Users className="text-red-600" />} label="Cupo Total" value={clase.CupoMaximo ?? 0} />
          <StatCard icon={<CheckCircle className="text-green-600" />} label="Inscritos" value={clase.CuposOcupados ?? 0} />
          <StatCard
            icon={<UserPlus className="text-blue-600" />}
            label="Disponibles"
            value={Math.max(0, (clase.CupoMaximo || 0) - (clase.CuposOcupados || 0))}
          />
          <StatCard
            icon={<Clock className="text-orange-600" />}
            label="Duración"
            value={calcularDuracion(clase.HoraInicio, clase.HoraFin)}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Entrenador</Label><p className="font-medium">{clase.NombreEntrenador}</p></div>
              <div>
                <Label>Horario</Label>
                <p className="font-medium">
                  {clase.DiaSemana} {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                </p>
              </div>
              <div>
                <Label>Vigencia</Label>
                <p className="font-medium text-sm">
                  {clase.FechaInicio ? new Date(clase.FechaInicio).toLocaleDateString() : 'N/A'} al {clase.FechaFin ? new Date(clase.FechaFin).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2"><Label>Descripción</Label><p className="text-sm text-muted-foreground">{clase.Descripcion || "Sin descripción"}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => setShowAddDialog(true)} disabled={(clase.CuposOcupados || 0) >= (clase.CupoMaximo || 0)}>
                <UserPlus className="mr-2 h-4 w-4" /> Inscribir Socio
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Listado de Reservas</CardTitle>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Reservada">Reservada</SelectItem>
                <SelectItem value="Asistió">Asistió</SelectItem>
                <SelectItem value="NoAsistió">No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No hay socios inscritos en esta clase todavía.</p>
            ) : (
              reservas.filter(r => filterEstado === "all" || r.Estado === filterEstado).map(reserva => (
                <div key={reserva.ReservaID} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={reserva.FotoURL} />
                      <AvatarFallback>{reserva.Nombre[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{reserva.Nombre} {reserva.Apellido}</p>
                      <Badge className={reserva.Estado === 'Asistió' ? 'bg-green-500' : reserva.Estado === 'NoAsistió' ? 'bg-red-500' : 'bg-blue-500'}>
                        {reserva.Estado}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {reserva.Estado === "Reservada" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => actualizarEstadoReserva(reserva.ReservaID, "Asistió")}><CheckCircle className="h-4 w-4 mr-1 text-green-600" />Asistió</Button>
                        <Button size="sm" variant="outline" onClick={() => actualizarEstadoReserva(reserva.ReservaID, "NoAsistió")}><XCircle className="h-4 w-4 mr-1 text-red-600" />Faltó</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelarReserva(reserva.ReservaID)}><AlertCircle className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogo Inscribir Socio */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Inscribir Nuevo Socio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha de la clase</Label>
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} className="border rounded-md mx-auto" />
            </div>
            <div className="space-y-2">
              <Label>Buscar Socio (RUT o Nombre)</Label>
              <Input placeholder="Escribe al menos 2 letras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {sociosFiltrados.length === 0 && searchTerm.length >= 2 && <p className="p-2 text-sm text-muted-foreground">No se encontraron socios.</p>}
                {sociosFiltrados.map(s => (
                  <div key={s.SocioID} onClick={() => setSelectedSocio(s.SocioID)}
                    className={`p-2 cursor-pointer hover:bg-muted text-sm ${selectedSocio === s.SocioID ? 'bg-red-50 border-l-4 border-red-600 font-bold' : ''}`}>
                    {s.Nombre} {s.Apellido} ({s.RUT})
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" disabled={!selectedSocio} onClick={agregarReserva}>Confirmar Inscripción</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="p-2 bg-muted rounded-full">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  )
}