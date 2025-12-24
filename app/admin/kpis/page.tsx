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
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Indicadores (KPIs)</h1>
            <p className="text-muted-foreground">Métricas clave basadas en Balanced Scorecard</p>
          </div>

          <div className="flex gap-2 items-center">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportPDF} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>

            <Button onClick={fetchKPIs} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Morosidad (TMM)</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.kpis.tasaMorosidad.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Meta: {"<"}10%</p>
              <p className="text-xs text-muted-foreground">{sociosMorosos} socios morosos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retención de Socios (PRC)</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.kpis.tasaRetencion.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Meta: {">"}80%</p>
              <div
                className={`flex items-center gap-1 text-xs ${datos.kpis.tasaRetencion >= 80 ? "text-green-600" : "text-red-600"}`}
              >
                {datos.kpis.tasaRetencion >= 80 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{datos.kpis.tasaRetencion >= 80 ? "Cumple meta" : "Por debajo de meta"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cancelación (Churn)</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.kpis.tasaChurn.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Meta: {"<"}10%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingreso por Socio (IPSA)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${datos.kpis.ingresoPromedioPorSocio.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Promedio por socio activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Digitales (PPD)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.kpis.porcentajePagosDigitales.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Meta: 70%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Socios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sociosActivos}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {sociosInactivos} inactivos, {sociosMorosos} morosos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Totales por Período</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {tendencias && tendencias.datos.length > 0 ? (
                <ChartContainer
                  config={{
                    total: {
                      label: "Ingresos",
                      color: "hsl(var(--chart-1))",
                    },
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
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Socios</CardTitle>
              <CardDescription>Por estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  cantidad: {
                    label: "Cantidad",
                  },
                }}
                className="h-64"
              >
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Tipo de Membresía</CardTitle>
              <CardDescription>Total del período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalIngresos: {
                    label: "Ingresos",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.ingresosPorMembresia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="NombrePlan" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalIngresos" fill="var(--color-totalIngresos)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horarios Pico</CardTitle>
              <CardDescription>Entradas por hora</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  ocupacion: {
                    label: "Entradas",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={horariosData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="ocupacion" fill="var(--color-ocupacion)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">KPIs del Proyecto - Balanced Scorecard</p>
                <p className="text-sm text-blue-800">
                  Los datos mostrados se calculan en tiempo real desde tu base de datos. Los KPIs incluyen: Tasa de
                  Morosidad (TMM), Retención (PRC), Cancelación (Churn), Ingreso por Socio (IPSA), Pagos Digitales (PPD)
                  y Participación de Membresías (PVV).
                </p>
                <p className="text-sm font-medium text-blue-900 mt-2">
                  Total de ingresos del período: ${datos.ingresosTotales.totalPagos.toLocaleString()} (
                  {datos.ingresosTotales.numeroPagos} pagos)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}