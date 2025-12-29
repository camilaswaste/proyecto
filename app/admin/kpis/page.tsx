"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import {
  AlertCircle,
  CreditCard,
  DollarSign,
  Download,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

export default function AdminKPIsPage() {
  const [periodo, setPeriodo] = useState("mensual")
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState<any>(null)
  const [tendencias, setTendencias] = useState<any>(null)

  const fetchKPIs = async () => {
    setLoading(true)
    try {
      console.log("[v0] Iniciando fetch de KPIs con período:", periodo)

      const [kpisRes, tendenciasRes] = await Promise.all([
        fetch(`/api/admin/kpis?periodo=${periodo}`),
        fetch(`/api/admin/kpis/tendencias?tipo=ingresos&meses=6`),
      ])

      console.log("[v0] Status KPIs:", kpisRes.status)
      console.log("[v0] Status tendencias:", tendenciasRes.status)

      const kpisText = await kpisRes.text()
      console.log("[v0] Respuesta KPIs (primeros 200 chars):", kpisText.substring(0, 200))

      let kpisData
      try {
        kpisData = JSON.parse(kpisText)
      } catch (parseError) {
        console.error("[v0] Error al parsear JSON de KPIs:", parseError)
        console.error("[v0] Respuesta completa:", kpisText)
        alert("Error: La respuesta del servidor no es JSON válido. Ver consola para más detalles.")
        setLoading(false)
        return
      }

      const tendenciasText = await tendenciasRes.text()
      let tendenciasData
      try {
        tendenciasData = JSON.parse(tendenciasText)
      } catch (parseError) {
        console.error("[v0] Error al parsear JSON de tendencias:", parseError)
        tendenciasData = { datos: [] }
      }

      console.log("[v0] Datos cargados exitosamente")
      setDatos(kpisData)
      setTendencias(tendenciasData)
    } catch (error) {
      console.error("[v0] Error al cargar KPIs:", error)
      alert("Error al cargar KPIs. Ver consola para más detalles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPIs()
  }, [periodo])

  const handleExportPDF = async () => {
    if (!datos) {
      alert("No hay datos disponibles para exportar")
      return
    }

    try {
      const response = await fetch(`/api/admin/kpis/pdf?periodo=${periodo}`)

      if (!response.ok) {
        throw new Error("Error al generar PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `KPIs_Dashboard_${periodo}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Error al generar PDF:", error)
      alert("Error al generar el PDF. Por favor intenta nuevamente.")
    }
  }

  if (loading || !datos) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-2xl border bg-background/60 shadow-sm flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Cargando indicadores...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const sociosActivos = datos.socios.find((s: any) => s.EstadoSocio === "Activo")?.total || 0
  const sociosInactivos = datos.socios.find((s: any) => s.EstadoSocio === "Inactivo")?.total || 0
  const sociosMorosos = datos.socios.find((s: any) => s.EstadoSocio === "Moroso")?.total || 0

  const sociosData = datos.socios.map((s: any) => ({
    estado: s.EstadoSocio,
    cantidad: s.total,
    fill: s.EstadoSocio === "Activo" ? "#22c55e" : s.EstadoSocio === "Moroso" ? "#ef4444" : "#94a3b8",
  }))

  const horariosData = datos.horariosPico.slice(0, 8).map((h: any) => ({
    hora: `${h.hora}:00`,
    ocupacion: h.totalEntradas,
  }))

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header premium */}
        <div className="rounded-2xl border bg-gradient-to-b from-muted/40 to-background p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Dashboard de Indicadores <span className="text-primary">(KPIs)</span>
              </h1>
              <p className="text-muted-foreground">Métricas clave basadas en Balanced Scorecard</p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Actualización en tiempo real
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  Datos financieros + operación
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[190px] rounded-xl border bg-background/70 shadow-sm hover:bg-background transition-colors">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="gap-2 rounded-xl bg-background/70 shadow-sm hover:bg-background"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>

              <Button
                onClick={fetchKPIs}
                variant="outline"
                size="icon"
                className="rounded-xl bg-background/70 shadow-sm hover:bg-background"
                title="Actualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 1 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-red-500/70 via-orange-500/60 to-yellow-500/60" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Tasa de Morosidad (TMM)</CardTitle>
                <CardDescription>Riesgo de ingresos</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end justify-between gap-2">
                <div className="text-3xl font-bold tracking-tight">{datos.kpis.tasaMorosidad.toFixed(2)}%</div>
                <span className="text-xs rounded-full border px-2 py-1 bg-background text-muted-foreground">
                  Meta: {"<"}10%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{sociosMorosos} socios morosos</p>
            </CardContent>
          </Card>

          {/* 2 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500/70 via-green-500/60 to-teal-500/60" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Retención de Socios (PRC)</CardTitle>
                <CardDescription>Fidelización</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end justify-between gap-2">
                <div className="text-3xl font-bold tracking-tight">{datos.kpis.tasaRetencion.toFixed(2)}%</div>
                <span className="text-xs rounded-full border px-2 py-1 bg-background text-muted-foreground">
                  Meta: {">"}80%
                </span>
              </div>
              <div
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border ${datos.kpis.tasaRetencion >= 80
                  ? "text-green-700 bg-green-500/10 border-green-500/20"
                  : "text-red-700 bg-red-500/10 border-red-500/20"
                  }`}
              >
                {datos.kpis.tasaRetencion >= 80 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{datos.kpis.tasaRetencion >= 80 ? "Cumple meta" : "Por debajo de meta"}</span>
              </div>
            </CardContent>
          </Card>

          {/* 3 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-slate-500/60 via-zinc-500/50 to-stone-500/50" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Tasa de Cancelación (Churn)</CardTitle>
                <CardDescription>Salida de socios</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-slate-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end justify-between gap-2">
                <div className="text-3xl font-bold tracking-tight">{datos.kpis.tasaChurn.toFixed(2)}%</div>
                <span className="text-xs rounded-full border px-2 py-1 bg-background text-muted-foreground">
                  Meta: {"<"}10%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-green-600/70 via-emerald-600/60 to-lime-500/60" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Ingreso por Socio (IPSA)</CardTitle>
                <CardDescription>Valor promedio</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold tracking-tight">${datos.kpis.ingresoPromedioPorSocio.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Promedio por socio activo</p>
            </CardContent>
          </Card>

          {/* 5 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-600/70 via-blue-600/60 to-cyan-500/60" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Pagos Digitales (PPD)</CardTitle>
                <CardDescription>Canal preferido</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end justify-between gap-2">
                <div className="text-3xl font-bold tracking-tight">{datos.kpis.porcentajePagosDigitales.toFixed(2)}%</div>
                <span className="text-xs rounded-full border px-2 py-1 bg-background text-muted-foreground">
                  Meta: 70%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 6 */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-fuchsia-600/70 via-purple-600/60 to-pink-500/60" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Socios Activos</CardTitle>
                <CardDescription>Estado actual</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold tracking-tight">{sociosActivos}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {sociosInactivos} inactivos, {sociosMorosos} morosos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="min-w-0 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </span>
                Ingresos Totales por Período
              </CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="pt-4" >
              <div className="aspect-[16/9] w-full">
                {tendencias && tendencias.datos.length > 0 ? (
                  <ChartContainer
                    config={{
                      total: { label: "Ingresos", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-64"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendencias.datos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-4 w-4 text-blue-700" />
                </span>
                Distribución de Socios
              </CardTitle>
              <CardDescription>Por estado actual</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="aspect-[16/9] w-full">
              <ChartContainer config={{ cantidad: { label: "Cantidad" } }} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sociosData} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={80}>
                      {sociosData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </span>
              Ingresos por Tipo de Membresía
            </CardTitle>
            <CardDescription>Total del período seleccionado</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="aspect-[16/9] w-full">
            <ChartContainer
              config={{
                totalIngresos: {
                  label: "Ingresos", color: "hsl(var(--chart-2))",
                }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.ingresosPorMembresia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="NombrePlan" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalIngresos" fill="hsl(var(--chart-2))"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Users className="h-4 w-4 text-purple-700" />
              </span>
              Horarios Pico
            </CardTitle>
            <CardDescription>Entradas por hora</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="aspect-[16/9] w-full">
            <ChartContainer config={{ ocupacion: { label: "Entradas", color: "hsl(var(--chart-4))" } }} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horariosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ocupacion" fill="hsl(var(--chart-2))"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            </div>
          </CardContent>
          
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600/70 via-indigo-600/60 to-purple-600/60" />
        <CardContent className="pt-6">
          <div className="aspect-[16/9] w-full">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-700" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">KPIs del Proyecto - Balanced Scorecard</p>
              <p className="text-sm text-muted-foreground">
                Los datos mostrados se calculan en tiempo real desde tu base de datos. Los KPIs incluyen: Tasa de
                Morosidad (TMM), Retención (PRC), Cancelación (Churn), Ingreso por Socio (IPSA), Pagos Digitales (PPD)
                y Participación de Membresías (PVV).
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2">
                <span className="text-sm font-semibold">
                  Total de ingresos del período: ${datos.ingresosTotales.totalPagos.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">({datos.ingresosTotales.numeroPagos} pagos)</span>
              </div>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout >
  )
}