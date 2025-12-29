// app/entrenador/socios/perfil/[socioID]/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { ElementType } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  CalendarCheck,
  Clock,
  CheckCircle,
  DollarSign,
  Package,
  Phone,
  Mail,
  Home,
  ArrowLeft,
} from "lucide-react"

// --- Interfaces de Datos ---
interface Membresia {
  MembresíaID: number
  FechaInicio: string
  FechaVencimiento: string
  Estado: string
  MontoPagado: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
  Beneficios: string
}

interface Pago {
  MontoPago: number
  FechaPago: string
  MedioPago: string
  Concepto: string
  UsuarioRegistro: string
}

interface Reserva {
  FechaClase: string
  Estado: string
  FechaReserva: string
  NombreClase: string
  NombreEntrenador: string
}

interface SocioPerfil {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  FechaNacimiento: string | null
  Email: string
  Telefono: string
  Direccion: string | null
  EstadoSocio: string
  FechaRegistro: string
  FotoURL: string | null
  ContactoEmergencia: string | null
  TelefonoEmergencia: string | null
  CodigoQR: string
  membresiaVigente: Membresia | null
  historialPagos: Pago[]
  historialReservas: Reserva[]
}

// --- Utilidades ---
const calculateAge = (dateString: string | null): number | string => {
  if (!dateString) return "N/A"
  const birthDate = new Date(dateString)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const formatRUT = (rut: string | null) => {
  if (!rut) return "N/A"
  const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "")
  const dv = cleanRUT.slice(-1)
  const body = cleanRUT.slice(0, -1)
  return `${body.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")}-${dv}`
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "GMT",
    })
  } catch {
    return dateString.split("T")[0]
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getMembresiaBadgeClass = (estado: string | null) => {
  switch (estado) {
    case "Vigente":
      return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    case "Vencida":
      return "border border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300"
    case "Suspendida":
      return "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
    default:
      return "border border-muted-foreground/20 bg-muted/30 text-foreground/80"
  }
}

const getEstadoReservaBadgeClass = (estado: string) => {
  if (estado === "Asistió") {
    return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  }
  return "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
}

// --- Componente principal ---
export default function SocioPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const socioID = Array.isArray(params.socioID) ? params.socioID[0] : params.socioID

  const [socio, setSocio] = useState<SocioPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (socioID) fetchSocioPerfil(socioID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioID])

  const fetchSocioPerfil = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/entrenador/socios/perfil/${id}`)
      if (!response.ok) throw new Error("Socio no encontrado o error en la API.")
      const data: SocioPerfil = await response.json()
      setSocio(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al cargar el perfil.")
      setSocio(null)
    } finally {
      setLoading(false)
    }
  }

  const edad = useMemo(() => calculateAge(socio?.FechaNacimiento || null), [socio?.FechaNacimiento])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-3">Cargando perfil del socio...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !socio) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-xl font-semibold text-foreground">Error al cargar el perfil</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <Button onClick={() => router.back()} variant="ghost" className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Socios
        </Button>

        {/* Header / Perfil */}
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-2 ring-primary/20">
                    <AvatarImage src={socio.FotoURL || undefined} alt={`${socio.Nombre} ${socio.Apellido}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {socio.Nombre?.[0]}
                      {socio.Apellido?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight truncate">
                      {socio.Nombre} {socio.Apellido}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={`${getMembresiaBadgeClass(socio.membresiaVigente?.Estado || null)} w-fit`}>
                        {socio.membresiaVigente?.NombrePlan || "Sin Membresía Vigente"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      >
                        RUT: {formatRUT(socio.RUT)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="md:ml-auto w-full md:w-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Registro:</span>
                      <span className="font-semibold">{formatDate(socio.FechaRegistro)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Edad:</span>
                      <span className="font-semibold">{edad}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{socio.Email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
                    <Phone className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-sm font-medium truncate">{socio.Telefono || "N/A"}</p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border bg-background p-3">
                    <Home className="h-4 w-4 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="text-sm font-medium break-words">
                        {socio.Direccion || "Dirección no registrada"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-amber-500/10 dark:bg-amber-500/10 p-4">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Contacto de Emergencia</p>
                  <p className="mt-2 text-sm font-medium">
                    {socio.ContactoEmergencia || "N/A"}
                    <span className="text-muted-foreground"> · </span>
                    {socio.TelefonoEmergencia || "N/A"}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Mantén esta información actualizada para una mejor atención ante incidentes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6 md:p-8">
            <Tabs defaultValue="membresia" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/40">
                <TabsTrigger value="membresia">Membresía</TabsTrigger>
                <TabsTrigger value="reservas">Reservas ({socio.historialReservas.length})</TabsTrigger>
                <TabsTrigger value="pagos">Pagos ({socio.historialPagos.length})</TabsTrigger>
              </TabsList>

              {/* TAB 1 */}
              <TabsContent value="membresia" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado Actual de la Membresía</CardTitle>
                    <CardDescription>Información del plan más reciente o vigente.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {socio.membresiaVigente ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem icon={Package} label="Plan" value={socio.membresiaVigente.NombrePlan} />
                        <InfoItem
                          icon={CheckCircle}
                          label="Estado"
                          value={socio.membresiaVigente.Estado}
                          isStatus
                          status={socio.membresiaVigente.Estado}
                        />
                        <InfoItem icon={CalendarCheck} label="Inicio" value={formatDate(socio.membresiaVigente.FechaInicio)} />
                        <InfoItem icon={Clock} label="Vencimiento" value={formatDate(socio.membresiaVigente.FechaVencimiento)} />
                        <InfoItem icon={DollarSign} label="Monto Pagado" value={formatCurrency(socio.membresiaVigente.MontoPagado)} />
                        <InfoItem icon={Clock} label="Duración (Días)" value={socio.membresiaVigente.DuracionDias.toString()} />

                        <div className="md:col-span-2 border-t pt-4">
                          <p className="text-sm font-semibold mb-1">Beneficios incluidos</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {socio.membresiaVigente.Beneficios || "No se especificaron beneficios para este plan."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">
                        Este socio no tiene una membresía registrada.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2 */}
              <TabsContent value="reservas" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Reservas</CardTitle>
                    <CardDescription>Últimas 10 reservas realizadas por el socio.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[320px] pr-4">
                      <div className="space-y-4">
                        {socio.historialReservas.length > 0 ? (
                          socio.historialReservas.map((reserva, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                            >
                              <div className="flex-shrink-0 rounded-lg border bg-amber-500/10 p-2">
                                <CalendarCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{reserva.NombreClase}</p>
                                <p className="text-xs text-muted-foreground">
                                  Reservada: {formatDate(reserva.FechaReserva)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Entrenador: {reserva.NombreEntrenador}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm">{formatDate(reserva.FechaClase)}</p>
                                <Badge className={`${getEstadoReservaBadgeClass(reserva.Estado)} text-xs`}>
                                  {reserva.Estado}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-6">No hay historial de reservas.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3 */}
              <TabsContent value="pagos" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Pagos</CardTitle>
                    <CardDescription>Últimos 10 pagos registrados por el socio.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[320px] pr-4">
                      <div className="space-y-4">
                        {socio.historialPagos.length > 0 ? (
                          socio.historialPagos.map((pago, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                            >
                              <div className="flex-shrink-0 rounded-lg border bg-muted/30 p-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{pago.Concepto || "Pago"}</p>
                                <p className="text-xs text-muted-foreground">Medio: {pago.MedioPago}</p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(pago.MontoPago)}
                                </p>
                                <p className="text-xs text-muted-foreground">{formatDate(pago.FechaPago)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-6">No hay historial de pagos.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

// --- Item auxiliar ---
interface InfoItemProps {
  icon: ElementType
  label: string
  value: string
  isStatus?: boolean
  status?: string
}

const InfoItem = ({ icon: Icon, label, value, isStatus, status }: InfoItemProps) => {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>

      {isStatus ? (
        <Badge className={`${getMembresiaBadgeClass(status || null)} w-fit`}>{value}</Badge>
      ) : (
        <p className="text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  )
}
