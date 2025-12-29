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

/**
 * Acentos (incluye azul) SOLO para íconos/badges internos,
 * para dar contraste sin romper la identidad rojo/negro/blanco.
 */
type AccentKey = "community" | "payments" | "classes" | "staff" | "access" | "shop" | "inventory" | "digital"

const ACCENT: Record<
  AccentKey,
  {
    ring: string
    bg: string
    icon: string
  }
> = {
  community: {
    ring: "ring-blue-500/15 group-hover:ring-blue-500/20",
    bg: "bg-blue-500/10 group-hover:bg-blue-500/15",
    icon: "text-blue-600 dark:text-blue-400",
  },
  payments: {
    ring: "ring-sky-500/15 group-hover:ring-sky-500/20",
    bg: "bg-sky-500/10 group-hover:bg-sky-500/15",
    icon: "text-sky-600 dark:text-sky-400",
  },
  classes: {
    ring: "ring-red-500/15 group-hover:ring-red-500/20",
    bg: "bg-red-500/10 group-hover:bg-red-500/15",
    icon: "text-red-600 dark:text-red-400",
  },
  staff: {
    ring: "ring-indigo-500/15 group-hover:ring-indigo-500/20",
    bg: "bg-indigo-500/10 group-hover:bg-indigo-500/15",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  access: {
    ring: "ring-slate-500/15 group-hover:ring-slate-500/20",
    bg: "bg-slate-500/10 group-hover:bg-slate-500/15",
    icon: "text-slate-700 dark:text-slate-300",
  },
  shop: {
    ring: "ring-blue-500/15 group-hover:ring-blue-500/20",
    bg: "bg-blue-500/10 group-hover:bg-blue-500/15",
    icon: "text-blue-600 dark:text-blue-400",
  },
  inventory: {
    ring: "ring-amber-500/15 group-hover:ring-amber-500/20",
    bg: "bg-amber-500/10 group-hover:bg-amber-500/15",
    icon: "text-amber-700 dark:text-amber-300",
  },
  digital: {
    ring: "ring-cyan-500/15 group-hover:ring-cyan-500/20",
    bg: "bg-cyan-500/10 group-hover:bg-cyan-500/15",
    icon: "text-cyan-700 dark:text-cyan-300",
  },
}

function StatCard(props: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  badge?: string
  accent?: AccentKey
}) {
  const accent = props.accent ? ACCENT[props.accent] : null

  return (
    <Card className="group card-surface hover-tint overflow-hidden">
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
            "h-10 w-10 rounded-2xl border",
            "flex items-center justify-center",
            "ring-1 ring-transparent transition-colors",
            accent?.bg ?? "bg-muted/40 group-hover:bg-primary/10",
            accent?.ring ?? "group-hover:ring-primary/15",
          ].join(" ")}
        >
          <span className={["transition-colors", accent?.icon ?? "text-foreground/80 group-hover:text-primary"].join(" ")}>
            {props.icon}
          </span>
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
  const cls = "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
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

  // 1) Dashboard KPIs
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

  // 2) Clases populares
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
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur">
          {/* Glow marca (rojo) + toque azul sutil */}
          <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Línea marca */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary/70 via-primary/25 to-transparent" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight brand-gradient-text">Dashboard Administrativo</h1>
              <p className="text-muted-foreground">Resumen general del gimnasio · {periodoLabel}</p>

              {errorMsg ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-destructive/10 px-3 py-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-muted-foreground">
                    No se pudieron cargar algunos datos. <span className="opacity-80">({errorMsg})</span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* Selector período */}
            <div className="flex justify-start md:justify-end">
              <div className="inline-flex items-center gap-1 rounded-full border bg-card/60 p-1 backdrop-blur">
                {(["mensual", "trimestral", "anual"] as const).map((p) => {
                  const active = periodo === p
                  const label = p === "mensual" ? "Mensual" : p === "trimestral" ? "Trimestral" : "Anual"

                  return (
                    <Button
                      key={p}
                      size="sm"
                      variant={active ? "default" : "ghost"}
                      className={[
                        "rounded-full",
                        active
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-foreground hover:bg-muted/60",
                      ].join(" ")}
                      onClick={() => setPeriodo(p)}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards (iconos con color para contraste) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Socios activos"
            value={`${kpis?.sociosActivos ?? 0}`}
            subtitle="Estado: Activo"
            icon={<Users className="h-5 w-5" />}
            badge="Comunidad"
            accent="community"
          />

          <StatCard
            title={`Ingresos del ${periodoLabel}`}
            value={`$${formatCurrencyCLP(kpis?.ingresosPeriodo ?? 0)}`}
            subtitle={`${Number(kpis?.porcentajePagosDigitales ?? 0).toFixed(1)}% digital`}
            icon={<CreditCard className="h-5 w-5" />}
            badge="Pagos"
            accent="payments"
          />

          <StatCard
            title="Clases activas"
            value={`${kpis?.clasesActivas ?? 0}`}
            subtitle="Programadas"
            icon={<Calendar className="h-5 w-5" />}
            badge="Clases"
            accent="classes"
          />

          <StatCard
            title="Entrenadores activos"
            value={`${kpis?.entrenadoresActivos ?? 0}`}
            subtitle="Equipo"
            icon={<TrendingUp className="h-5 w-5" />}
            badge="Staff"
            accent="staff"
          />

          <StatCard
            title={`Entradas del ${periodoLabel}`}
            value={`${kpis?.totalEntradasPeriodo ?? 0}`}
            subtitle="Asistencias"
            icon={<DoorOpen className="h-5 w-5" />}
            badge="Acceso"
            accent="access"
          />

          <StatCard
            title={`Ventas del ${periodoLabel}`}
            value={`$${formatCurrencyCLP(kpis?.ventasPeriodo ?? 0)}`}
            subtitle="Productos"
            icon={<ShoppingBag className="h-5 w-5" />}
            badge="Tienda"
            accent="shop"
          />

          <StatCard
            title="Stock bajo"
            value={`${kpis?.productosStockBajo ?? 0}`}
            subtitle="Bajo mínimo"
            icon={<AlertTriangle className="h-5 w-5" />}
            badge="Inventario"
            accent="inventory"
          />

          <StatCard
            title="Pagos digitales"
            value={`${Number(kpis?.porcentajePagosDigitales ?? 0).toFixed(1)}%`}
            subtitle="Tarjeta/transferencia"
            icon={<CreditCard className="h-5 w-5" />}
            badge="Medios de pago"
            accent="digital"
          />
        </div>

        {/* Widgets */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Actividad Reciente */}
          <Card
            className={[
              "group border bg-card/60 shadow-sm transition-all backdrop-blur",
              "hover:shadow-md",
              "hover:border-primary/25 hover:ring-1 hover:ring-primary/15",
            ].join(" ")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription className="transition-colors group-hover:text-primary/70">
                    Actualiza automáticamente cada 15 segundos
                  </CardDescription>
                </div>

                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 transition-colors group-hover:bg-primary/10 group-hover:text-primary"
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
                        "hover:bg-primary/5 hover:border-primary/20",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="group mt-0.5 h-9 w-9 rounded-xl border bg-muted/40 flex items-center justify-center transition-colors hover:bg-primary/10">
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
              "group border bg-card/60 shadow-sm transition-all backdrop-blur",
              "hover:shadow-md",
              "hover:border-primary/25 hover:ring-1 hover:ring-primary/15",
            ].join(" ")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Clases Populares
                  </CardTitle>
                  <CardDescription className="transition-colors group-hover:text-primary/70">
                    Top clases por asistencias (período: {periodoLabel})
                  </CardDescription>
                </div>

                <Badge
                  variant="secondary"
                  className="transition-colors group-hover:bg-primary/10 group-hover:text-primary"
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
                          "hover:bg-primary/5 hover:border-primary/20",
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
                            className="transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                          >
                            {share.toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Barra = % asistencias vs reservas */}
                        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground/80 group-hover:bg-primary/80 transition-colors"
                            style={{ width: `${Math.min(100, Math.max(0, asistenciaRate))}%` }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-muted-foreground">Barra = % de asistencias vs reservas</p>
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
