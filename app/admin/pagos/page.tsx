"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Banknote,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Pago {
  PagoID: number
  Monto: number
  FechaPago: string
  MetodoPago: string
  NombreSocio: string
  NombrePlan: string
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [metodoFilter, setMetodoFilter] = useState<string>("todos")
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchPagos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, metodoFilter, periodoFilter])

  const fetchPagos = async () => {
    try {
      const response = await fetch("/api/pagos")
      if (response.ok) {
        const data = await response.json()
        setPagos(data)
      }
    } catch (error) {
      console.error("Error al cargar pagos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPagos = pagos.filter((pago) => {
    const matchesSearch =
      pago.NombreSocio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.NombrePlan?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMetodo = metodoFilter === "todos" || pago.MetodoPago?.toLowerCase() === metodoFilter.toLowerCase()

    let matchesPeriodo = true
    if (periodoFilter !== "todos") {
      const fechaPago = new Date(pago.FechaPago)
      const hoy = new Date()
      const diasAtras =
        periodoFilter === "7dias" ? 7 : periodoFilter === "30dias" ? 30 : periodoFilter === "90dias" ? 90 : 0

      if (diasAtras > 0) {
        const fechaLimite = new Date(hoy)
        fechaLimite.setDate(hoy.getDate() - diasAtras)
        matchesPeriodo = fechaPago >= fechaLimite
      }
    }

    return matchesSearch && matchesMetodo && matchesPeriodo
  })

  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPagos = filteredPagos.slice(startIndex, endIndex)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount)
  }

  const getMetodoDisplay = (metodo: string) => {
    const metodoLower = metodo?.toLowerCase()

    if (metodoLower === "efectivo") {
      return {
        icon: Banknote,
        label: "Efectivo",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
      }
    }
    if (metodoLower === "tarjeta") {
      return {
        icon: CreditCard,
        label: "Tarjeta",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
      }
    }
    if (metodoLower === "transferencia") {
      return {
        icon: Building2,
        label: "Transferencia",
        className:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
      }
    }
    return {
      icon: Wallet,
      label: metodo,
      className:
        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
    }
  }

  const totalPagos = pagos.reduce((sum, pago) => sum + pago.Monto, 0)
  const promedioPago = pagos.length > 0 ? totalPagos / pagos.length : 0

  const pagosPorMetodo = pagos.reduce(
    (acc, pago) => {
      const metodo = pago.MetodoPago?.toLowerCase() || "otro"
      acc[metodo] = (acc[metodo] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const metodoMasUsado = Object.entries(pagosPorMetodo).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Cargando pagos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Gestión de Pagos</h1>
          <p className="text-muted-foreground text-pretty max-w-2xl">
            Visualiza y gestiona todos los pagos procesados en el sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">Ingresos Totales</CardDescription>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{formatCurrency(totalPagos)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">Pagos Registrados</CardDescription>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pagos.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de transacciones</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">Promedio por Pago</CardDescription>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(promedioPago)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Valor medio</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">Método Más Usado</CardDescription>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 capitalize">{metodoMasUsado}</div>
              <p className="text-xs text-muted-foreground mt-1">{pagosPorMetodo[metodoMasUsado] || 0} pagos</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/40 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold">Historial de Pagos</CardTitle>
                <CardDescription>Historial completo de transacciones realizadas</CardDescription>
              </div>
              <Link href="/admin/pagos/ingresar">
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4" />
                  Ingresar Pago
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre de socio o plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus-visible:bg-background"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filtrar:</span>
                  </div>

                  <Select value={metodoFilter} onValueChange={setMetodoFilter}>
                    <SelectTrigger className="w-[180px] h-11 bg-muted/30 border-muted-foreground/20">
                      <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      <SelectItem value="todos">Todos los métodos</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger className="w-[180px] h-11 bg-muted/30 border-muted-foreground/20">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      <SelectItem value="todos">Todos los períodos</SelectItem>
                      <SelectItem value="7dias">Últimos 7 días</SelectItem>
                      <SelectItem value="30dias">Últimos 30 días</SelectItem>
                      <SelectItem value="90dias">Últimos 90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border/50">
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            ID Pago
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            Socio
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Plan
                        </th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5" />
                            Monto
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Método
                        </th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Fecha
                          </div>
                        </th>
                        <th className="text-right p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPagos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-muted/20">
                                <Search className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">No se encontraron pagos</p>
                                <p className="text-sm text-muted-foreground">
                                  {searchTerm
                                    ? "Intenta con otros términos de búsqueda"
                                    : "Aún no hay pagos registrados"}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentPagos.map((pago) => {
                          const metodoInfo = getMetodoDisplay(pago.MetodoPago)
                          const MetodoIcon = metodoInfo.icon

                          return (
                            <tr
                              key={pago.PagoID}
                              className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors group"
                            >
                              <td className="p-4">
                                <span className="font-mono text-sm font-bold text-primary">
                                  #{String(pago.PagoID).padStart(4, "0")}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-semibold text-sm text-foreground">{pago.NombreSocio}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground font-medium">{pago.NombrePlan}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-sm text-foreground">{formatCurrency(pago.Monto)}</span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${metodoInfo.className}`}
                                >
                                  <MetodoIcon className="h-3.5 w-3.5" />
                                  {metodoInfo.label}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground font-medium">
                                  {new Date(pago.FechaPago).toLocaleDateString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <Link href={`/admin/pagos/${pago.PagoID}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all group-hover:shadow-sm"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Ver Detalles
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredPagos.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPagos.length)} de {filteredPagos.length}{" "}
                    pagos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-9 h-9 p-0"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
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
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="gap-2"
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
      </div>
    </DashboardLayout>
  )
}
