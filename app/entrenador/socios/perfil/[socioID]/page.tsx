// app/entrenador/socios/perfil/[socioID]/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, CalendarCheck, Clock, CheckCircle, DollarSign, Package, Phone, Mail, Home, ArrowLeft } from "lucide-react"

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

// --- Funciones de Utilidad y Formato ---

const calculateAge = (dateString: string | null): number | string => {
  if (!dateString) return "N/A"
  const birthDate = new Date(dateString)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
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
    const date = new Date(dateString);
    // Usamos 'GMT' para asegurar que la fecha se muestre como fue guardada (día exacto)
    return date.toLocaleDateString("es-CL", { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'GMT' });
  } catch {
    return dateString.split('T')[0] // Fallback
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getMembresiaBadgeColor = (estado: string | null) => {
  switch (estado) {
    case "Vigente": return "bg-green-500 hover:bg-green-600 text-white";
    case "Vencida": return "bg-red-500 hover:bg-red-600 text-white";
    case "Suspendida": return "bg-yellow-500 hover:bg-yellow-600 text-white";
    default: return "bg-gray-400 hover:bg-gray-500 text-white";
  }
}


// --- Componente Principal ---

export default function SocioPerfilPage() {
  const params = useParams()
  const router = useRouter()
  // Aseguramos que socioID sea un string, ya que params puede ser string o array de strings
  const socioID = Array.isArray(params.socioID) ? params.socioID[0] : params.socioID
  
  const [socio, setSocio] = useState<SocioPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (socioID) {
      fetchSocioPerfil(socioID)
    }
  }, [socioID])

  const fetchSocioPerfil = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/entrenador/socios/perfil/${id}`)
      if (!response.ok) {
        throw new Error("Socio no encontrado o error en la API.")
      }
      const data: SocioPerfil = await response.json()
      setSocio(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al cargar el perfil.")
      setSocio(null)
    } finally {
      setLoading(false)
    }
  }

  // Memo para calcular la edad solo cuando cambie FechaNacimiento
  const edad = useMemo(() => calculateAge(socio?.FechaNacimiento || null), [socio?.FechaNacimiento])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex flex-col items-center justify-center h-full min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-3">Cargando perfil del socio...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !socio) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex flex-col items-center justify-center h-full min-h-64 text-red-600">
          <p className="text-xl font-semibold">Error al cargar el perfil</p>
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
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Socios
        </Button>

        {/* --- Sección Superior: Biografía/Tarjeta Principal (Estilo Red Social) --- */}
        <Card className="shadow-lg">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
            
            {/* Foto y Nombre */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={socio.FotoURL || undefined} alt={socio.Nombre} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {socio.Nombre[0]}{socio.Apellido[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-center">
                {socio.Nombre} {socio.Apellido}
              </h2>
              <Badge className={getMembresiaBadgeColor(socio.membresiaVigente?.Estado || null)}>
                {socio.membresiaVigente?.NombrePlan || "Sin Membresía Vigente"}
              </Badge>
            </div>

            {/* Separador vertical en pantallas grandes */}
            <Separator orientation="vertical" className="hidden md:block h-32" />
            <Separator orientation="horizontal" className="block md:hidden" />

            {/* Información Personal y Contacto */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                
                {/* Fila 1 */}
                <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">{socio.Email}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">{socio.Telefono || "N/A"}</p>
                </div>

                {/* Fila 2 */}
                <div className="flex items-center space-x-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm">Registro: {formatDate(socio.FechaRegistro)}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="text-sm">Edad: {edad}</p>
                </div>

                {/* Fila 3 */}
                <div className="flex items-start space-x-2 col-span-1 sm:col-span-2">
                    <Home className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <p className="text-sm break-all">{socio.Direccion || "Dirección no registrada"}</p>
                </div>

                {/* Fila 4: Emergencia */}
                <div className="col-span-1 sm:col-span-2 mt-2 border-t pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Contacto de Emergencia</p>
                    <p className="text-sm">{socio.ContactoEmergencia || 'N/A'}: {socio.TelefonoEmergencia || 'N/A'}</p>
                </div>
            </div>
            
          </CardContent>
        </Card>

        {/* --- Sección de Datos Detallados (Tabs) --- */}
        <Tabs defaultValue="membresia" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="membresia">Membresía</TabsTrigger>
            <TabsTrigger value="reservas">Reservas ({socio.historialReservas.length})</TabsTrigger>
            <TabsTrigger value="pagos">Pagos ({socio.historialPagos.length})</TabsTrigger>
          </TabsList>

          {/* TAB 1: Membresía */}
          <TabsContent value="membresia">
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual de la Membresía</CardTitle>
                <CardDescription>Información del plan más reciente o vigente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socio.membresiaVigente ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={Package} label="Plan" value={socio.membresiaVigente.NombrePlan} />
                    <InfoItem icon={CheckCircle} label="Estado" value={socio.membresiaVigente.Estado} isStatus={true} status={socio.membresiaVigente.Estado} />
                    <InfoItem icon={CalendarCheck} label="Inicio" value={formatDate(socio.membresiaVigente.FechaInicio)} />
                    <InfoItem icon={Clock} label="Vencimiento" value={formatDate(socio.membresiaVigente.FechaVencimiento)} />
                    <InfoItem icon={DollarSign} label="Monto Pagado" value={formatCurrency(socio.membresiaVigente.MontoPagado)} />
                    <InfoItem icon={Clock} label="Duración (Días)" value={socio.membresiaVigente.DuracionDias.toString()} />
                    
                    <div className="md:col-span-2 border-t pt-4">
                        <p className="text-sm font-semibold mb-1">Beneficios Incluidos</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {socio.membresiaVigente.Beneficios || "No se especificaron beneficios para este plan."}
                        </p>
                    </div>

                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Este socio no tiene una membresía registrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Historial de Reservas */}
          <TabsContent value="reservas">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Reservas de Clases</CardTitle>
                <CardDescription>Últimas 10 reservas realizadas por el socio.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {socio.historialReservas.length > 0 ? (
                      socio.historialReservas.map((reserva, index) => (
                        <div key={index} className="flex items-center space-x-4 border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex-shrink-0">
                            <CalendarCheck className="h-6 w-6 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{reserva.NombreClase}</p>
                            <p className="text-xs text-muted-foreground">Reservada: {formatDate(reserva.FechaReserva)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{formatDate(reserva.FechaClase)}</p>
                            <Badge variant="secondary" className={`text-xs ${reserva.Estado === 'Asistió' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {reserva.Estado}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No hay historial de reservas de clases.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Historial de Pagos */}
          <TabsContent value="pagos">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Últimos 10 pagos registrados por el socio.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {socio.historialPagos.length > 0 ? (
                      socio.historialPagos.map((pago, index) => (
                        <div key={index} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex-shrink-0">
                            <DollarSign className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pago.Concepto || "Pago de Membresía"}</p>
                            <p className="text-xs text-muted-foreground">Medio: {pago.MedioPago}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">{formatCurrency(pago.MontoPago)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(pago.FechaPago)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No hay historial de pagos.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// --- Componente de Ayuda para la sección Membresía ---
interface InfoItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    isStatus?: boolean;
    status?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, isStatus, status }) => (
    <div className="flex flex-col space-y-1 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600">{label}</p>
        </div>
        {isStatus ? (
            <Badge className={getMembresiaBadgeColor(status || null) + " w-fit"}>
                {value}
            </Badge>
        ) : (
            <p className="text-sm font-medium text-gray-900">{value}</p>
        )}
    </div>
);