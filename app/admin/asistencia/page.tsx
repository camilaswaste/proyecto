"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Users, TrendingUp, Clock, CalendarIcon, Search, LogIn, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { es } from "date-fns/locale"

interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  FotoURL: string | null
  EstadoSocio: string
  TipoMembresia?: string
  HoraIngreso?: string
  EnGimnasio: boolean
}

interface Asistencia {
  AsistenciaID: number
  SocioID: number
  FechaHoraIngreso: string
  FechaHoraSalida: string | null
}

interface Stats {
  sociosActivosAhora: number
  totalDelDia: number
  promedioPermanencia: string
  comparacionAyer: number
}

export default function AsistenciaPage() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [stats, setStats] = useState<Stats>({
    sociosActivosAhora: 0,
    totalDelDia: 0,
    promedioPermanencia: "0h",
    comparacionAyer: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [historialData, setHistorialData] = useState<Asistencia[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [sociosRes, statsRes] = await Promise.all([
        fetch("/api/admin/asistencia/socios"),
        fetch("/api/admin/asistencia/stats"),
      ])

      if (sociosRes.ok) {
        const sociosData = await sociosRes.json()
        setSocios(sociosData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarEntrada = async (socioID: number) => {
    try {
      const response = await fetch("/api/admin/asistencia/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioID, tipo: "entrada" }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error marcando entrada:", error)
    }
  }

  const handleMarcarSalida = async (socioID: number) => {
    try {
      const response = await fetch("/api/admin/asistencia/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socioID, tipo: "salida" }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error marcando salida:", error)
    }
  }

  const handleVerCalendario = async (socio: Socio) => {
    setSelectedSocio(socio)
    setShowCalendar(true)

    try {
      const response = await fetch(`/api/admin/asistencia/historial/${socio.SocioID}`)
      if (response.ok) {
        const data = await response.json()
        setHistorialData(data)
      }
    } catch (error) {
      console.error("Error fetching historial:", error)
    }
  }

  const filteredSocios = socios.filter(
    (socio) =>
      `${socio.Nombre} ${socio.Apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.RUT.includes(searchTerm),
  )

  const totalPages = Math.ceil(filteredSocios.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSocios = filteredSocios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  const getDiasConAsistencia = () => {
    return historialData
      .map((a) => {
        const fecha = new Date(a.FechaHoraIngreso)
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
      })
      .filter((fecha) => {
        return fecha.getMonth() === selectedMonth.getMonth() && fecha.getFullYear() === selectedMonth.getFullYear()
      })
  }

  const tieneDiaAsistencia = (date: Date) => {
    const diasConAsistencia = getDiasConAsistencia()
    return diasConAsistencia.some(
      (d) =>
        d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear(),
    )
  }

  const calcularEstadisticasMes = () => {
    const diasConAsistencia = getDiasConAsistencia()
    const diasEnMes = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
    const porcentaje = Math.round((diasConAsistencia.length / diasEnMes) * 100)

    return {
      totalDias: diasConAsistencia.length,
      porcentaje: porcentaje,
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Control de Asistencia</h1>
          <p className="text-muted-foreground">Gestiona la entrada y salida de socios en tiempo real</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Socios Activos Ahora</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.sociosActivosAhora}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total del Día</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDelDia}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio de Permanencia</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.promedioPermanencia}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">vs. Ayer</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.comparacionAyer > 0 ? "+" : ""}
                {stats.comparacionAyer}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Socio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Socios List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {paginatedSocios.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No se encontraron socios</div>
              ) : (
                paginatedSocios.map((socio) => (
                  <div
                    key={socio.SocioID}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={socio.FotoURL || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(socio.Nombre, socio.Apellido)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {socio.Nombre} {socio.Apellido}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{socio.TipoMembresia || "Estándar"}</span>
                          {socio.EnGimnasio && socio.HoraIngreso && <span>• Ingreso: {socio.HoraIngreso}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {socio.EnGimnasio ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarcarSalida(socio.SocioID)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Marcar Salida
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarcarEntrada(socio.SocioID)}
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Marcar Entrada
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleVerCalendario(socio)}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Calendario
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>

          {totalPages > 1 && (
            <CardContent className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSocios.length)} de {filteredSocios.length}{" "}
                socios
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Historial de Asistencia - {selectedSocio?.Nombre} {selectedSocio?.Apellido}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-base">Estadísticas del Mes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total de días</p>
                      <p className="text-4xl font-bold text-primary">{calcularEstadisticasMes().totalDias}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Asistencia</p>
                      <p className="text-4xl font-bold text-green-500">{calcularEstadisticasMes().porcentaje}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Calendario de Asistencia</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      month={selectedMonth}
                      onMonthChange={setSelectedMonth}
                      locale={es}
                      className="rounded-md border-0"
                      modifiers={{
                        asistido: (date) => tieneDiaAsistencia(date),
                      }}
                      modifiersClassNames={{
                        asistido: "bg-red-500 text-white hover:bg-red-600 font-bold",
                      }}
                      classNames={{
                        months: "space-y-4",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_today: "bg-accent text-accent-foreground font-bold",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
