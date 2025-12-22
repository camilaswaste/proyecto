"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Activity,
  AlertCircle,
  CreditCard,
  DollarSign,
  Settings2,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useState } from "react"
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

const ingresosData = [
  { mes: "Jul", ingresos: 3200000, meta: 3500000 },
  { mes: "Ago", ingresos: 3400000, meta: 3500000 },
  { mes: "Sep", ingresos: 3100000, meta: 3500000 },
  { mes: "Oct", ingresos: 3650000, meta: 3500000 },
  { mes: "Nov", ingresos: 3850000, meta: 3700000 },
  { mes: "Dic", ingresos: 3850000, meta: 3700000 },
]

const asistenciaData = [
  { dia: "Lun", asistencia: 145, capacidad: 200 },
  { dia: "Mar", asistencia: 132, capacidad: 200 },
  { dia: "Mié", asistencia: 158, capacidad: 200 },
  { dia: "Jue", asistencia: 142, capacidad: 200 },
  { dia: "Vie", asistencia: 168, capacidad: 200 },
  { dia: "Sáb", asistencia: 95, capacidad: 200 },
  { dia: "Dom", asistencia: 78, capacidad: 200 },
]

const membresiasData = [
  { tipo: "Mensual", cantidad: 78, fill: "#ef4444" },
  { tipo: "Trimestral", cantidad: 45, fill: "#f97316" },
  { tipo: "Semestral", cantidad: 28, fill: "#eab308" },
  { tipo: "Anual", cantidad: 15, fill: "#22c55e" },
]

const horariosData = [
  { hora: "06:00", ocupacion: 35 },
  { hora: "08:00", ocupacion: 65 },
  { hora: "10:00", ocupacion: 42 },
  { hora: "12:00", ocupacion: 28 },
  { hora: "14:00", ocupacion: 38 },
  { hora: "16:00", ocupacion: 55 },
  { hora: "18:00", ocupacion: 85 },
  { hora: "20:00", ocupacion: 72 },
]

type KPIKey =
  | "ingresos"
  | "retencion"
  | "nuevosSocios"
  | "asistencia"
  | "ingresoPorSocio"
  | "morosidad"
  | "churn"
  | "pagosDigitales"
  | "membresias"

export default function AdminKPIsPage() {
  const [visibleKPIs, setVisibleKPIs] = useState<Set<KPIKey>>(
    new Set([
      "ingresos",
      "retencion",
      "nuevosSocios",
      "asistencia",
      "ingresoPorSocio",
      "morosidad",
      "churn",
      "pagosDigitales",
      "membresias",
    ]),
  )

  const [selectedCategory, setSelectedCategory] = useState<"all" | "balanced" | "general">("all")

  const toggleKPI = (key: KPIKey) => {
    const newSet = new Set(visibleKPIs)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setVisibleKPIs(newSet)
  }

  const kpis = [
    {
      key: "morosidad" as KPIKey,
      title: "Tasa de Morosidad (TMM)",
      value: "12.5%",
      change: "-3.5%",
      trend: "up",
      icon: AlertCircle,
      description: "Socios morosos / Total socios activos x 100",
      meta: "Meta: <10% en 2 años",
      category: "balanced",
    },
    {
      key: "retencion" as KPIKey,
      title: "Retención de Socios (PRC)",
      value: "82%",
      change: "+5%",
      trend: "up",
      icon: Target,
      description: "Socios que renuevan / Socios activos periodo anterior x 100",
      meta: "Meta: >80%",
      category: "balanced",
    },
    {
      key: "churn" as KPIKey,
      title: "Tasa de Cancelación (Churn)",
      value: "8.2%",
      change: "-2.1%",
      trend: "up",
      icon: TrendingDown,
      description: "Socios que cancelan / Socios al inicio del periodo x 100",
      meta: "Meta: <10%",
      category: "balanced",
    },
    {
      key: "ingresoPorSocio" as KPIKey,
      title: "Ingreso por Socio (IPSA)",
      value: "$42.500",
      change: "+8%",
      trend: "up",
      icon: DollarSign,
      description: "Ingresos totales / Socios activos del periodo",
      meta: "Meta: ≥$50.000 anuales",
      category: "balanced",
    },
    {
      key: "pagosDigitales" as KPIKey,
      title: "Pagos Digitales (PPD)",
      value: "65%",
      change: "+12%",
      trend: "up",
      icon: CreditCard,
      description: "Pagos digitales / Total de pagos x 100",
      meta: "Meta: 70% en 2 años",
      category: "balanced",
    },
    {
      key: "membresias" as KPIKey,
      title: "Participación Membresías (PVV)",
      value: "45%",
      change: "+3%",
      trend: "up",
      icon: Users,
      description: "Distribución de socios por tipo de plan",
      meta: "Meta: ≥40% planes premium",
      category: "balanced",
    },
    {
      key: "ingresos" as KPIKey,
      title: "Ingresos Totales",
      value: "$3.850.000",
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      description: "Ingresos totales del mes actual",
      meta: "Comparado con mes anterior",
      category: "general",
    },
    {
      key: "nuevosSocios" as KPIKey,
      title: "Nuevos Socios",
      value: "24",
      change: "+15%",
      trend: "up",
      icon: UserPlus,
      description: "Socios registrados este mes",
      meta: "Meta: 20-30 mensuales",
      category: "general",
    },
    {
      key: "asistencia" as KPIKey,
      title: "Asistencia Promedio",
      value: "145",
      change: "+8%",
      trend: "up",
      icon: Activity,
      description: "Promedio diario de asistencias",
      meta: "Capacidad: 200 personas",
      category: "general",
    },
  ]

  const filteredKPIs =
    selectedCategory === "all"
      ? kpis.filter((kpi) => visibleKPIs.has(kpi.key))
      : kpis.filter((kpi) => visibleKPIs.has(kpi.key) && kpi.category === selectedCategory)

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Indicadores (KPIs)</h1>
            <p className="text-muted-foreground">Métricas clave basadas en Balanced Scorecard</p>
          </div>

          <div className="flex gap-2">
            <div className="flex gap-2 mr-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={selectedCategory === "balanced" ? "default" : "outline"}
                onClick={() => setSelectedCategory("balanced")}
                size="sm"
              >
                Balanced Scorecard
              </Button>
              <Button
                variant={selectedCategory === "general" ? "default" : "outline"}
                onClick={() => setSelectedCategory("general")}
                size="sm"
              >
                Generales
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Settings2 className="h-4 w-4" />
                  Personalizar Vista
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Indicadores Visibles</h4>
                    <p className="text-sm text-muted-foreground mb-3">Selecciona qué KPIs mostrar en tu dashboard</p>
                  </div>
                  <div className="space-y-3">
                    {kpis.map((kpi) => (
                      <div key={kpi.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={kpi.key}
                          checked={visibleKPIs.has(kpi.key)}
                          onCheckedChange={() => toggleKPI(kpi.key)}
                        />
                        <Label htmlFor={kpi.key} className="text-sm font-normal cursor-pointer">
                          {kpi.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredKPIs.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div
                    className={`flex items-center gap-1 text-xs mb-2 ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{kpi.change} vs mes anterior</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.description}</p>
                  <p className="text-xs font-medium text-primary">{kpi.meta}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales vs Meta</CardTitle>
              <CardDescription>Comparación con objetivo mensual</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  ingresos: {
                    label: "Ingresos",
                    color: "hsl(var(--chart-1))",
                  },
                  meta: {
                    label: "Meta",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ingresosData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="ingresos" stroke="var(--color-ingresos)" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="var(--color-meta)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asistencia vs Capacidad</CardTitle>
              <CardDescription>Ocupación semanal del gimnasio</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  asistencia: {
                    label: "Asistencia",
                    color: "hsl(var(--chart-2))",
                  },
                  capacidad: {
                    label: "Capacidad",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asistenciaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="asistencia" fill="var(--color-asistencia)" />
                    <Bar dataKey="capacidad" fill="var(--color-capacidad)" opacity={0.3} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Membresías</CardTitle>
              <CardDescription>Por tipo de plan</CardDescription>
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
                    <Pie data={membresiasData} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius={80}>
                      {membresiasData.map((entry, index) => (
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
              <CardTitle>Horarios Peak</CardTitle>
              <CardDescription>Ocupación por hora</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  ocupacion: {
                    label: "Ocupación %",
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

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">KPIs del Proyecto - Balanced Scorecard</p>
                <p className="text-sm text-blue-800">
                  Estos 6 indicadores están alineados con las perspectivas del Balanced Scorecard: Financiera, Cliente y
                  Procesos Internos. Los datos mostrados son estáticos para demostración. En producción, se calcularán
                  automáticamente desde la base de datos según las fórmulas SMART definidas en el proyecto.
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>TMM: Reducir morosidad mediante control automatizado</li>
                  <li>PRC: Evaluar fidelización post-digitalización</li>
                  <li>Churn: Medir pérdida de socios y efectividad del sistema</li>
                  <li>IPSA: Ingreso promedio por socio activo</li>
                  <li>PPD: Adopción de medios de pago digitales</li>
                  <li>PVV: Distribución por tipo de membresía</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
