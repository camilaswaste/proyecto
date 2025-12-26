"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// Importar iconos necesarios
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUser } from "@/lib/auth-client"
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  QrCodeIcon,
  Search,
  Users,
  XCircle,
} from "lucide-react"

// Interfaz de Socio
interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  FechaNacimiento?: string
  Direccion?: string
  EstadoSocio: string
  CodigoQR: string
  NombrePlan: string | null
  EstadoMembresia: string | null
  FechaInicio: string | null
  FechaFin: string | null
  TotalSesiones?: number
}

// Nueva Interfaz para los KPIs del Entrenador
interface EntrenadorKPIs {
  totalSociosAsignados: number
  sociosConMembresiaVigente: number
  sociosSinPlan: number
  totalReservasClases: number
}

export default function EntrenadorSociosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstadoMembresia, setFilterEstadoMembresia] = useState<string>("todos")
  // Nuevo estado para los KPIs
  const [kpis, setKpis] = useState<EntrenadorKPIs | null>(null)

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()

  // Estado para el modal de QR
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrSocio, setQrSocio] = useState<Socio | null>(null)

  useEffect(() => {
    fetchSocios()
  }, [])

  const fetchSocios = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) {
        console.error("No user found")
        setLoading(false)
        return
      }

      // 1. Obtener EntrenadorID
      const profileResponse = await fetch(`/api/entrenador/profile?usuarioID=${user.usuarioID}`)
      if (!profileResponse.ok) {
        console.error("Failed to fetch entrenador profile")
        setLoading(false)
        return
      }
      const profileData = await profileResponse.json()
      const entrenadorID = profileData.EntrenadorID

      if (!entrenadorID) {
        console.error("No EntrenadorID found in profile")
        setLoading(false)
        return
      }

      // 2. Obtener Socios del Entrenador
      const response = await fetch(`/api/entrenador/socios?entrenadorID=${entrenadorID}`)
      if (response.ok) {
        const data = await response.json()

        // 1. Validar y extraer los arrays y KPIs del objeto de respuesta
        const todosSocios = Array.isArray(data.todosSocios) ? data.todosSocios : []
        const sociosConSesiones = Array.isArray(data.sociosConSesiones) ? data.sociosConSesiones : []
        setKpis(data.kpis as EntrenadorKPIs) // Establecer los KPIs

        // 2. Combinar los arrays en una única lista, deduplicando por SocioID
        const combinedSociosMap = new Map<number, Socio>()

        // Procesamos primero 'todosSocios' (datos base + membresía)
        todosSocios.forEach((socio: Socio) => {
          combinedSociosMap.set(socio.SocioID, socio)
        })

        // Luego procesamos 'sociosConSesiones' y fusionamos la data
        sociosConSesiones.forEach((socio: { SocioID: number; TotalSesiones: number }) => {
          const existing = combinedSociosMap.get(socio.SocioID)
          if (existing) {
            // Fusiona la data de sesiones (ej. TotalSesiones)
            combinedSociosMap.set(socio.SocioID, { ...existing, TotalSesiones: socio.TotalSesiones })
          } else {
            // Si está en sesiones pero no en la lista general, lo añadimos de todas formas (aunque debería estar)
            combinedSociosMap.set(socio.SocioID, socio as unknown as Socio)
          }
        })

        setSocios(Array.from(combinedSociosMap.values()))
      } else {
        console.error("Failed to fetch socios:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar socios:", error)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  // ... (Funciones handleOpenQrDialog, handleViewProfile, Lógica de Filtrado y Paginación, Funciones de Formato)
  const handleOpenQrDialog = (socio: Socio) => {
    setQrSocio(socio)
    setShowQrDialog(true)
  }

  const handleViewProfile = (socioID: number) => {
    router.push(`/entrenador/socios/perfil/${socioID}`)
  }

  // Lógica de Filtrado: Uso de una referencia defensiva
  const sociosToFilter = Array.isArray(socios) ? socios : []

  const filteredSocios = sociosToFilter.filter((socio) => {
    const matchesSearch =
      socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado =
      filterEstadoMembresia === "todos" ||
      socio.EstadoMembresia === filterEstadoMembresia ||
      (filterEstadoMembresia === "sin-plan" && (!socio.EstadoMembresia || socio.EstadoMembresia !== "Vigente")) // Modificado para incluir socios con plan no vigente en "sin-plan"

    return matchesSearch && matchesEstado
  })

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredSocios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSocios = filteredSocios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterEstadoMembresia])

  // Funciones de Formato
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      // Formato DD/MM/AAAA
      const date = new Date(dateString)
      return date.toLocaleDateString("es-CL", { timeZone: "UTC" })
    } catch {
      return "Error"
    }
  }

  const formatRUT = (rut: string) => {
    if (!rut) return "N/A"
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "")
    const dv = cleanRUT.slice(-1)
    const body = cleanRUT.slice(0, -1)

    let formattedBody = ""
    let counter = 0
    for (let i = body.length - 1; i >= 0; i--) {
      formattedBody = body[i] + formattedBody
      counter++
      if (counter === 3 && i !== 0) {
        formattedBody = "." + formattedBody
        counter = 0
      }
    }
    return `${formattedBody}-${dv}`
  }

  const formatTelefono = (telefono: string) => {
    if (!telefono) return "N/A"
    const cleanPhone = telefono.replace(/\D/g, "")
    // Asumiendo formato chileno (9 dígitos después del +569)
    if (cleanPhone.length >= 8) {
      const number = cleanPhone.slice(-8) // Tomar los últimos 8
      return `+56 9 ${number.slice(0, 4)} ${number.slice(4)}`
    }
    return telefono
  }

  const getEstadoMembresiaColor = (estado: string | null) => {
    switch (estado) {
      case "Vigente":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pausada":
        return "bg-gray-400 text-gray-800 border-gray-300"
      case "Vencida":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      case "Suspendida":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }
  // Fin de Funciones de Formato

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando socios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Socios Asignados</h1>
            <p className="text-muted-foreground">Lista de socios que tienen reservas en tus clases.</p>
          </div>
        </div>

        {/* Sección de KPIs */}
        {kpis && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Total Socios Asignados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Socios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalSociosAsignados}</div>
                <p className="text-xs text-muted-foreground">Socios vinculados a tus clases</p>
              </CardContent>
            </Card>

            {/* KPI 2: Total Reservas Clases */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalReservasClases}</div>
                <p className="text-xs text-muted-foreground">Reservas históricas en tus clases</p>
              </CardContent>
            </Card>

            {/* KPI 3: Socios con Membresía Vigente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membresía Vigente</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.sociosConMembresiaVigente}</div>
                <p className="text-xs text-muted-foreground">Socios con un plan activo</p>
              </CardContent>
            </Card>

            {/* KPI 4: Socios sin Plan Vigente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oportunidades de Venta</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.sociosSinPlan}</div>
                <p className="text-xs text-muted-foreground">Socios sin plan vigente o vencido</p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Fin Sección de KPIs */}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Socios</CardTitle>
            <CardDescription>Total de socios asignados: {socios.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-64">
                  <Select value={filterEstadoMembresia} onValueChange={setFilterEstadoMembresia}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="Vigente">Vigente</SelectItem>
                      <SelectItem value="Pausada">Pausada</SelectItem>
                      <SelectItem value="Vencida">Vencida</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                      <SelectItem value="Suspendida">Suspendida</SelectItem>
                      <SelectItem value="sin-plan">Sin plan vigente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">RUT</th>
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Plan/Estado</th>
                        <th className="text-left p-3 font-medium">Fin Plan</th>
                        <th className="text-left p-3 font-medium">Teléfono</th>
                        <th className="text-left p-3 font-medium">Estado Socio</th>
                        <th className="text-left p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSocios.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            No se encontraron socios
                          </td>
                        </tr>
                      ) : (
                        paginatedSocios.map((socio) => (
                          <tr key={socio.SocioID} className="border-t hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-mono text-sm">{formatRUT(socio.RUT)}</td>
                            <td className="p-3">
                              {socio.Nombre} {socio.Apellido}
                            </td>
                            <td className="p-3 text-sm">{socio.Email}</td>
                            <td className="p-3">
                              <p className="font-medium text-sm">{socio.NombrePlan || "Sin Plan"}</p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium border ${getEstadoMembresiaColor(
                                  socio.EstadoMembresia,
                                )}`}
                              >
                                {socio.EstadoMembresia || "N/A"}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="text-sm">{formatDate(socio.FechaFin)}</p>
                            </td>
                            <td className="p-3 text-sm font-mono">{formatTelefono(socio.Telefono)}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  socio.EstadoSocio === "Activo"
                                    ? "bg-green-100 text-green-800"
                                    : socio.EstadoSocio === "Moroso"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {socio.EstadoSocio}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {/* Acción: Ver Perfil */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewProfile(socio.SocioID)}
                                  className="hover:bg-blue-50 transition-colors"
                                  title="Ver Perfil del Socio"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>

                                {/* Acción: Código QR */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenQrDialog(socio)}
                                  disabled={!socio.CodigoQR}
                                  title="Ver Código QR de Acceso"
                                >
                                  <QrCodeIcon
                                    className={`h-4 w-4 ${socio.CodigoQR ? "text-primary" : "text-muted-foreground"}`}
                                  />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSocios.length)} de {filteredSocios.length}{" "}
                    socios
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 py-1 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Código QR */}
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Código QR de Acceso</DialogTitle>
              <DialogClose onClose={() => setShowQrDialog(false)} />
            </DialogHeader>
            {qrSocio && (
              <div className="flex flex-col items-center space-y-4 p-4">
                <p className="text-center text-lg font-semibold">
                  {qrSocio.Nombre} {qrSocio.Apellido} ({qrSocio.RUT})
                </p>
                {qrSocio.CodigoQR ? (
                  <>
                    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-xl">
                      <QrCodeQuickChart value={qrSocio.CodigoQR} size={256} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Este código se usa para el control de acceso.
                    </p>
                  </>
                ) : (
                  <p className="text-red-500">Este socio no tiene un Código QR asignado.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
