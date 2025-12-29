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


interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  EntrenadorID: number
  NombreEntrenador: string
  EmailEntrenador: string
  FotoEntrenador?: string
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
  Estado: "Reservada" | "Asistió" | "NoAsistió" | "Cancelada"
  FechaReserva: string
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  FotoURL?: string
  EstadoSocio: string
  MembresiaInicio?: string
  MembresiaVencimiento?: string
  NombrePlan?: string
}

interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  FotoURL?: string
  EstadoSocio: string
}

export default function DetalleClasePage() {
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

  useEffect(() => {
    if (claseId) {
      cargarDatos()
    }
  }, [claseId])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar detalle de clase
      const claseRes = await fetch(`/api/admin/clases/${claseId}`)
      const claseData = await claseRes.json()
      setClase(claseData)

      // Cargar reservas
      const reservasRes = await fetch(`/api/admin/clases/${claseId}/reservas`)
      const reservasData = await reservasRes.json()
      setReservas(Array.isArray(reservasData) ? reservasData : [])

      const sociosRes = await fetch("/api/admin/socios")
      const sociosData = await sociosRes.json()

      console.log("=== DEBUG SOCIOS ===")
      console.log("Respuesta completa:", sociosData)
      console.log("Es array?:", Array.isArray(sociosData))
      console.log("Total socios:", sociosData?.length || 0)
      console.log("Primer socio:", sociosData?.[0])

      // La API devuelve el array directamente, no envuelto en { socios: [...] }
      setSocios(Array.isArray(sociosData) ? sociosData : [])
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos de la clase",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const agregarReserva = async () => {
    if (!selectedSocio) return

    const fechaClase = selectedDate.toISOString().split("T")[0]

    try {
      const res = await fetch(`/api/admin/clases/${claseId}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioId: selectedSocio, fechaClase }),
      })

      const contentType = res.headers.get("content-type") ?? ""
      const isJson = contentType.includes("application/json")

      if (!isJson) {
        const text = await res.text().catch(() => "")
        console.error("[agregarReserva] Respuesta no JSON:", res.status, text)
        toast({
          title: "Error",
          description: "Respuesta inesperada del servidor",
          variant: "destructive",
        })
        return
      }

      const data = await res.json().catch(() => ({} as any))

      if (res.ok) {
        // dispara refresh inmediato de notifs + refresca UI de clase
        window.dispatchEvent(new Event("notificacion:nueva"))

        toast({
          title: "Éxito",
          description: "Socio inscrito correctamente en la clase",
        })

        await cargarDatos()
        setShowAddDialog(false)
        setSelectedSocio(null)
        setSearchTerm("")
        return
      }

      // Tu backend hoy NO manda code, así que usamos mensaje
      const errorMessage = (data?.error || "Error al inscribir socio").toString()
      const msg = errorMessage.toLowerCase()

      const isMembresiaInactiva =
        msg.includes("membres") || msg.includes("vencid") || msg.includes("inactiv")

      toast({
        title: isMembresiaInactiva ? "Membresía inactiva" : "Error",
        description: errorMessage,
        variant: "destructive",
        duration: isMembresiaInactiva ? 6000 : 3500,
      })

      // (opcional) también disparar evento para que salga toast de BD si tu backend creó notificación
      window.dispatchEvent(new Event("notificacion:nueva"))
    } catch (error) {
      console.error("[agregarReserva] Error:", error)
      toast({
        title: " Error",
        description: error instanceof Error ? error.message : "Error al inscribir socio",
        variant: "destructive",
      })
    }
  }


  const actualizarEstadoReserva = async (reservaId: number, estado: string) => {
    try {
      const res = await fetch(`/api/admin/clases/${claseId}/reservas/${reservaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })

      if (res.ok) {

        window.dispatchEvent(new Event("notificacion:nueva"))
        await cargarDatos()
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error)
    }
  }

  const cancelarReserva = async (reservaId: number) => {
    if (!confirm("¿Estás seguro de cancelar esta reserva?")) return

    try {
      const res = await fetch(`/api/admin/clases/${claseId}/reservas/${reservaId}`, {
        method: "DELETE",
      })

      if (res.ok) {

        window.dispatchEvent(new Event("notificacion:nueva"))
        await cargarDatos()
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("=== BÚSQUEDA ===")
    console.log("Término de búsqueda:", value)
    console.log("Socios disponibles:", socios.length)
    setSearchTerm(value)
  }

  const sociosFiltrados = useMemo(() => {
    console.log("=== FILTRANDO SOCIOS ===")
    console.log("searchTerm:", searchTerm)
    console.log("searchTerm.length:", searchTerm.length)
    console.log("Total socios en estado:", socios.length)

    if (searchTerm.length < 2) {
      console.log("Búsqueda muy corta, devolviendo array vacío")
      return []
    }

    const filtrados = socios.filter((socio) => {
      const match =
        socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.RUT.toLowerCase().includes(searchTerm.toLowerCase())

      if (match) {
        console.log("✓ Coincide:", socio.Nombre, socio.Apellido)
      }
      return match
    })

    console.log("Total filtrados:", filtrados.length)
    return filtrados
  }, [searchTerm, socios])

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Reservada":
        return "bg-blue-500"
      case "Asistió":
        return "bg-green-500"
      case "NoAsistió":
        return "bg-red-500"
      case "Cancelada":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatearHora = (hora: any): string => {
    if (!hora) return "00:00"

    // Si es un objeto Date
    if (hora instanceof Date) {
      return hora.toTimeString().substring(0, 5)
    }

    // Si es string
    if (typeof hora === "string") {
      // Si viene en formato HH:MM directamente
      if (/^\d{2}:\d{2}$/.test(hora)) {
        return hora
      }

      // Si viene con timestamp completo (1970-01-01T08:00:00)
      if (hora.includes("T")) {
        return hora.split("T")[1].substring(0, 5)
      }

      // Si viene en formato HH:MM:SS
      if (hora.includes(":")) {
        return hora.substring(0, 5)
      }
    }

    // Si es un número (timestamp)
    if (typeof hora === "number") {
      const date = new Date(hora)
      return date.toTimeString().substring(0, 5)
    }

    // Fallback: intentar convertir a string y extraer
    const horaStr = String(hora)
    if (horaStr.includes(":")) {
      return horaStr.substring(0, 5)
    }

    return "00:00"
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando clase...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!clase) {
    return (
      <DashboardLayout role="Administrador">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Clase no encontrada</p>
          <Button onClick={() => router.push("/admin/clases")} className="mt-4">
            Volver a Clases
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const cuposDisponibles = clase.CupoMaximo - clase.CuposOcupados

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/clases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{clase.NombreClase}</h1>
            <p className="text-muted-foreground">
              {clase.DiaSemana} • {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cupo Total</p>
                <p className="text-2xl font-bold">{clase.CupoMaximo}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inscritos</p>
                <p className="text-2xl font-bold">{clase.CuposOcupados}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{cuposDisponibles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="text-2xl font-bold">60 min</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Información de la clase */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 md:col-span-2">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
              <CardDescription>{clase.Descripcion || "Sin descripción disponible"}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="entrenador">Entrenador</Label>
                <p className="font-medium mt-1">{clase.NombreEntrenador}</p>
                <p className="text-sm text-muted-foreground mt-1">{clase.EmailEntrenador}</p>
              </div>

              <div>
                <Label htmlFor="horario">Horario</Label>
                <p className="font-medium mt-1">
                  {clase.DiaSemana} • {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                </p>
              </div>

              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <p className="font-medium mt-1">{new Date(clase.FechaInicio).toLocaleDateString()}</p>
              </div>

              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <p className="font-medium mt-1">{new Date(clase.FechaFin).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => setShowAddDialog(true)} disabled={cuposDisponibles <= 0}>
                <UserPlus className="mr-2 h-4 w-4" />
                Inscribir Socio
              </Button>

              {cuposDisponibles <= 0 && <p className="text-sm text-red-600 text-center">No hay cupos disponibles</p>}
            </CardContent>
          </Card>
        </div>

        {/* Lista de inscritos */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Socios Inscritos ({reservas.length})</CardTitle>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Reservada">Reservada</SelectItem>
                <SelectItem value="Asistió">Asistió</SelectItem>
                <SelectItem value="NoAsistió">No Asistió</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay reservas para mostrar</p>
            ) : (
              reservas.map((reserva) => (
                <div
                  key={reserva.ReservaID}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {reserva.FotoURL ? (
                        <AvatarImage
                          src={reserva.FotoURL || "/placeholder.svg"}
                          alt={`${reserva.Nombre} ${reserva.Apellido}`}
                        />
                      ) : (
                        <AvatarFallback>
                          {reserva.Nombre[0]}
                          {reserva.Apellido[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div>
                      <p className="font-medium">
                        {reserva.Nombre} {reserva.Apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">{reserva.Email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {reserva.EstadoSocio}
                        </Badge>
                        {reserva.NombrePlan && (
                          <Badge variant="outline" className="text-xs">
                            {reserva.NombrePlan}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getEstadoBadgeColor(reserva.Estado)}`}>{reserva.Estado}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {reserva.Estado === "Reservada" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actualizarEstadoReserva(reserva.ReservaID, "Asistió")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Asistió
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actualizarEstadoReserva(reserva.ReservaID, "NoAsistió")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          No Asistió
                        </Button>
                      </>
                    )}

                    {reserva.Estado !== "Cancelada" && (
                      <Button size="sm" variant="destructive" onClick={() => cancelarReserva(reserva.ReservaID)}>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para agregar socio */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inscribir Socio a la Clase</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fechaClase">Fecha de la Clase</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>

            <div>
              <Label htmlFor="buscarSocio">Buscar Socio</Label>
              <div className="relative">
                <Input
                  id="buscarSocio"
                  placeholder="Buscar por nombre, apellido, email o RUT..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 border-gray-300"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchTerm.length < 2 ? (
                <p className="text-center text-muted-foreground py-4">Escribe al menos 2 caracteres para buscar</p>
              ) : sociosFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No se encontraron socios</p>
              ) : (
                sociosFiltrados.map((socio) => (
                  <div
                    key={socio.SocioID}
                    onClick={() => setSelectedSocio(socio.SocioID)}
                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${selectedSocio === socio.SocioID ? "bg-red-50 border-red-600" : "hover:bg-muted/50"
                      }`}
                  >
                    <Avatar>
                      {socio.FotoURL ? (
                        <AvatarImage
                          src={socio.FotoURL || "/placeholder.svg"}
                          alt={`${socio.Nombre} ${socio.Apellido}`}
                        />
                      ) : (
                        <AvatarFallback>
                          {socio.Nombre[0]}
                          {socio.Apellido[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">
                        {socio.Nombre} {socio.Apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">{socio.Email}</p>
                    </div>

                    <Badge variant="outline">{socio.EstadoSocio}</Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={agregarReserva} disabled={!selectedSocio}>
                Inscribir Socio
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setSelectedSocio(null)
                  setSearchTerm("")
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
