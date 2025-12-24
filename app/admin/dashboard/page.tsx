"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  CreditCard,
  DoorOpen,
  Dumbbell,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

type Periodo = "mensual" | "trimestral" | "anual"

interface DashboardKPIs {
  periodo: string
  fechaInicio: string
  sociosActivos: number
  ingresosPeriodo: number
  clasesActivas: number
  entrenadoresActivos: number
  totalEntradasPeriodo: number
  ventasPeriodo: number
  productosStockBajo: number
  porcentajePagosDigitales: number
}

type AsistenciaClaseRow = {
  NombreClase: string
  asistencias: number
  totalReservas: number
}

type ApiKpisResponseForPopular = {
  asistenciaClases: AsistenciaClaseRow[]
}

type ActivityItem = {
  id: string
  tipo: "Pago" | "Venta" | "ReservaClase" | "Ingreso" | "NuevoSocio"
  titulo: string
  detalle: string | null
  fecha: string // ISO
}

function formatCurrencyCLP(value: number) {
  return Number(value || 0).toLocaleString("es-CL")
}

function formatDateTimeCL(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })
}

function StatCard(props: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  badge?: string
  accentClassName?: string
}) {
  return (
    <Card
      className={[
        "border-none overflow-hidden",
        "bg-gradient-to-br from-background to-muted/40",
        "shadow-sm hover:shadow-md transition-shadow",
      ].join(" ")}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{props.title}</CardTitle>
          {props.badge ? (
            <Badge variant="secondary" className="w-fit">
              {props.badge}
            </Badge>
          ) : null}
        </div>

        <div
          className={[
            "h-10 w-10 rounded-2xl",
            "flex items-center justify-center",
            "bg-muted",
            props.accentClassName ?? "",
          ].join(" ")}
        >
          {props.icon}
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-bold leading-none">{props.value}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{props.subtitle}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityIcon({ tipo }: { tipo: ActivityItem["tipo"] }) {
  const cls = "h-4 w-4 text-muted-foreground"
  switch (tipo) {
    case "Pago":
      return <Receipt className={cls} />
    case "Venta":
      return <ShoppingBag className={cls} />
    case "ReservaClase":
      return <Dumbbell className={cls} />
    case "Ingreso":
      return <DoorOpen className={cls} />
    case "NuevoSocio":
      return <UserPlus className={cls} />
    default:
      return <Activity className={cls} />
  }
}

export default function AdminDashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>("mensual")

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [popular, setPopular] = useState<AsistenciaClaseRow[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastActivityIdsRef = useRef<Set<string>>(new Set())

  const periodoLabel = useMemo(() => {
    switch (periodo) {
      case "mensual":
        return "Mes"
      case "trimestral":
        return "Trimestre"
      case "anual":
        return "Año"
      default:
        return "Período"
    }
  }, [periodo])

  // 1) Dashboard KPIs (rápido)
  useEffect(() => {
    let mounted = true

    const fetchDashboard = async () => {
      setLoading(true)
      setErrorMsg(null)

      try {
        const res = await fetch(`/api/admin/dashboard?periodo=${periodo}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const data = (await res.json()) as DashboardKPIs

        if (!mounted) return
        setKpis({
          ...data,
          sociosActivos: Number(data.sociosActivos ?? 0),
          ingresosPeriodo: Number(data.ingresosPeriodo ?? 0),
          clasesActivas: Number(data.clasesActivas ?? 0),
          entrenadoresActivos: Number(data.entrenadoresActivos ?? 0),
          totalEntradasPeriodo: Number(data.totalEntradasPeriodo ?? 0),
          ventasPeriodo: Number(data.ventasPeriodo ?? 0),
          productosStockBajo: Number(data.productosStockBajo ?? 0),
          porcentajePagosDigitales: Number(data.porcentajePagosDigitales ?? 0),
        })
      } catch (e) {
        console.error(e)
        if (!mounted) return
        setErrorMsg(e instanceof Error ? e.message : "Error desconocido")
        setKpis({
          periodo,
          fechaInicio: new Date().toISOString(),
          sociosActivos: 0,
          ingresosPeriodo: 0,
          clasesActivas: 0,
          entrenadoresActivos: 0,
          totalEntradasPeriodo: 0,
          ventasPeriodo: 0,
          productosStockBajo: 0,
          porcentajePagosDigitales: 0,
        })
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchDashboard()
    return () => {
      mounted = false
    }
  }, [periodo])

  // 2) Clases populares (usa tu /api/admin/kpis existente)
  useEffect(() => {
    let mounted = true

    const fetchPopular = async () => {
      try {
        const res = await fetch(`/api/admin/kpis?periodo=${periodo}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const data = (await res.json()) as ApiKpisResponseForPopular

        const rows = (data.asistenciaClases ?? [])
          .map((r) => ({
            ...r,
            asistencias: Number(r.asistencias ?? 0),
            totalReservas: Number(r.totalReservas ?? 0),
          }))
          .sort((a, b) => b.asistencias - a.asistencias)
          .slice(0, 6)

        if (!mounted) return
        setPopular(rows)
      } catch (e) {
        console.error("Error popular classes:", e)
        if (!mounted) return
        setPopular([])
      }
    }

    fetchPopular()
    return () => {
      mounted = false
    }
  }, [periodo])

  // 3) Actividad reciente (polling)
  useEffect(() => {
    let mounted = true
    let interval: ReturnType<typeof setInterval> | null = null

    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/admin/dashboard/actividad?periodo=${periodo}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const data = (await res.json()) as { items: ActivityItem[] }

        const items = (data.items ?? []).map((x) => ({ ...x }))
        if (!mounted) return

        setActivity(items)
        lastActivityIdsRef.current = new Set(items.map((i) => i.id))
      } catch (e) {
        console.error("Error activity:", e)
        if (!mounted) return
        setActivity([])
      }
    }

    fetchActivity()
    interval = setInterval(fetchActivity, 15000)

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [periodo])

  const totalReservasPopular = useMemo(() => popular.reduce((acc, r) => acc + (r.totalReservas || 0), 0), [popular])

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header más moderno (no “bloque plano”) */}
        <div className="relative overflow-hidden rounded-2xl border 
  bg-background/70 backdrop-blur 
  p-6 shadow-sm">
          {/* Glow rojo suave */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-500/20 blur-3xl opactity-50" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl opactity-50" />
          {/* Línea roja sutil */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/60 via-red-500/25 to-transparent" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between opactity-50">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Administrativo</h1>
              <p className="text-muted-foreground">Resumen general del gimnasio · {periodoLabel}</p>
              {errorMsg ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No se pudieron cargar algunos datos. <span className="opacity-80">({errorMsg})</span>
                </p>
              ) : null}
            </div>

            {/* Botones pill pro */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
              <Button
                size="sm"
                className={
                  periodo === "mensual"
                    ? "rounded-full bg-red-600 hover:bg-red-600 text-white"
                    : "rounded-full bg-transparent text-white/80 hover:bg-black/10"
                }
                onClick={() => setPeriodo("mensual")}
              >
                Mensual
              </Button>
              <Button
                size="sm"
                className={
                  periodo === "trimestral"
                    ? "rounded-full bg-red-600 hover:bg-red-600 text-white"
                    : "rounded-full bg-transparent text-white/80 hover:bg-white/10"
                }
                onClick={() => setPeriodo("trimestral")}
              >
                Trimestral
              </Button>
              <Button
                size="sm"
                className={
                  periodo === "anual"
                    ? "rounded-full bg-red-600 hover:bg-red-600 text-white"
                    : "rounded-full bg-transparent text-white/80 hover:bg-white/10"
                }
                onClick={() => setPeriodo("anual")}
              >
                Anual
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Socios activos"
            value={`${kpis?.sociosActivos ?? 0}`}
            subtitle="Estado: Activo"
            icon={<Users className="h-5 w-5" />}
            badge="Comunidad"
            accentClassName="bg-[oklch(0.82_0.05_280)]"
          />

          <StatCard
            title={`Ingresos del ${periodoLabel}`}
            value={`$${formatCurrencyCLP(kpis?.ingresosPeriodo ?? 0)}`}
            subtitle={`${Number(kpis?.porcentajePagosDigitales ?? 0).toFixed(1)}% digital`}
            icon={<CreditCard className="h-5 w-5" />}
            badge="Pagos"
            accentClassName="bg-[oklch(0.86_0.06_160)]"
          />

          <StatCard
            title="Clases activas"
            value={`${kpis?.clasesActivas ?? 0}`}
            subtitle="Programadas"
            icon={<Calendar className="h-5 w-5" />}
            badge="Clases"
            accentClassName="bg-[oklch(0.88_0.06_35)]"
          />

          <StatCard
            title="Entrenadores activos"
            value={`${kpis?.entrenadoresActivos ?? 0}`}
            subtitle="Equipo"
            icon={<TrendingUp className="h-5 w-5" />}
            badge="Staff"
            accentClassName="bg-[oklch(0.86_0.06_200)]"
          />

          <StatCard
            title={`Entradas del ${periodoLabel}`}
            value={`${kpis?.totalEntradasPeriodo ?? 0}`}
            subtitle="Asistencias"
            icon={<DoorOpen className="h-5 w-5" />}
            badge="Acceso"
            accentClassName="bg-muted"
          />

          <StatCard
            title={`Ventas del ${periodoLabel}`}
            value={`$${formatCurrencyCLP(kpis?.ventasPeriodo ?? 0)}`}
            subtitle="Productos"
            icon={<ShoppingBag className="h-5 w-5" />}
            badge="Tienda"
            accentClassName="bg-muted"
          />

          <StatCard
            title="Stock bajo"
            value={`${kpis?.productosStockBajo ?? 0}`}
            subtitle="Bajo mínimo"
            icon={<AlertTriangle className="h-5 w-5" />}
            badge="Inventario"
            accentClassName="bg-muted"
          />

          <StatCard
            title="Pagos digitales"
            value={`${Number(kpis?.porcentajePagosDigitales ?? 0).toFixed(1)}%`}
            subtitle="Tarjeta/transferencia"
            icon={<CreditCard className="h-5 w-5" />}
            badge="Medios de pago"
            accentClassName="bg-muted"
          />
        </div>

        {/* Widgets (hover rojo suave) */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Actividad Reciente */}
          <Card
            className={[
              "group border bg-background/60 shadow-sm transition-all",
              "hover:shadow-md",
              "hover:border-red-500/20 hover:ring-1 hover:ring-red-500/15",
            ].join(" ")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription className="group-hover:text-red-500/70 transition-colors">
                    Actualiza automáticamente cada 15 segundos
                  </CardDescription>
                </div>

                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 group-hover:bg-red-500/10 group-hover:text-red-600 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Live
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Sin actividad registrada en este período.</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 10).map((item, idx) => (
                    <div
                      key={item.id}
                      className={[
                        "rounded-xl border bg-background/60 p-3 transition-colors",
                        "hover:bg-red-500/5 hover:border-red-500/20",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-9 w-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                          <ActivityIcon tipo={item.tipo} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{item.titulo}</p>
                            <span className="text-xs text-muted-foreground">{formatDateTimeCL(item.fecha)}</span>
                          </div>
                          {item.detalle ? <p className="text-xs text-muted-foreground mt-1">{item.detalle}</p> : null}
                        </div>
                      </div>

                      {idx !== Math.min(activity.length, 10) - 1 ? <Separator className="mt-3" /> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clases Populares */}
          <Card
            className={[
              "group border bg-background/60 shadow-sm transition-all",
              "hover:shadow-md",
              "hover:border-red-500/20 hover:ring-1 hover:ring-red-500/15",
            ].join(" ")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Clases Populares
                  </CardTitle>
                  <CardDescription className="group-hover:text-red-500/70 transition-colors">
                    Top clases por asistencias (período: {periodoLabel})
                  </CardDescription>
                </div>

                <Badge
                  variant="secondary"
                  className="group-hover:bg-red-500/10 group-hover:text-red-600 transition-colors"
                >
                  Ranking
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {popular.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Aún no hay datos de asistencia.</p>
              ) : (
                <div className="space-y-3">
                  {popular.map((c) => {
                    const asistenciaRate = c.totalReservas > 0 ? (c.asistencias * 100) / c.totalReservas : 0
                    const share = totalReservasPopular > 0 ? (c.totalReservas * 100) / totalReservasPopular : 0

                    return (
                      <div
                        key={c.NombreClase}
                        className={[
                          "rounded-xl border bg-background/60 p-3 transition-colors",
                          "hover:bg-red-500/5 hover:border-red-500/20",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{c.NombreClase}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {c.asistencias} asistencias · {c.totalReservas} reservas · {asistenciaRate.toFixed(0)}%
                              asistencia
                            </p>
                          </div>

                          <Badge
                            variant="secondary"
                            className="group-hover:bg-red-500/10 group-hover:text-red-600 transition-colors"
                          >
                            {share.toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Barra = % asistencias vs reservas */}
                        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-neutral-900 group-hover:bg-red-600/80 transition-colors"
                            style={{ width: `${Math.min(100, Math.max(0, asistenciaRate))}%` }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Barra = % de asistencias vs reservas
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}