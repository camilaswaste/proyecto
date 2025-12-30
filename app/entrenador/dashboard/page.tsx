"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUser } from "@/lib/auth-client"
import { Activity, ArrowUpRight, Bell, Calendar, Clock, Dumbbell, MessageSquare, TrendingUp, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface DashboardData {
  sociosAsignados: number
  sesionesHoy: number
  clasesSemanales: number
  asistenciaPromedio: number
  clasesImpartidasSemana: number
  sesionesCompletadasSemana: number
  agendaHoy: Array<{
    Tipo: string
    ID: number
    HoraInicio: string
    HoraFin: string
    NombreSocio: string
    Estado: string
  }>
}

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  CreadoPor: number
  FechaCreacion: string
  Destinatarios: string
  Activo: boolean
  Leido: boolean
}

interface ProximaSesion {
  ClaseID: number
  NombreClase: string
  DiaSemana: string
  HoraInicio: string
  FechaInicio: string
  TipoClase: string
  NombreSocio?: string
  CuposOcupados?: number
}

function StatCard(props: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  badge?: string
  accentClassName?: string
  iconClassName?: string
  gradientClassName?: string
}) {
  return (
    <Card
      className={[
        "relative overflow-hidden border bg-background/70 backdrop-blur",
        "shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px]",
        "hover:border-red-500/15 hover:ring-1 hover:ring-red-500/10",
      ].join(" ")}
    >
      {/* Decor */}
      <div
        className={[
          "pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40",
          props.gradientClassName ?? "bg-red-500/30",
        ].join(" ")}
      />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/70 via-red-500/20 to-transparent" />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{props.title}</CardTitle>
          {props.badge ? (
            <Badge variant="secondary" className="w-fit bg-muted/60">
              {props.badge}
            </Badge>
          ) : null}
        </div>

        <div
          className={[
            "h-11 w-11 rounded-2xl",
            "flex items-center justify-center",
            "ring-1 ring-black/5 dark:ring-white/10",
            props.accentClassName ?? "bg-muted",
          ].join(" ")}
        >
          <span className={props.iconClassName ?? "text-foreground"}>{props.icon}</span>
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

export default function EntrenadorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0)
  const [showAvisosModal, setShowAvisosModal] = useState(false)
  const [usuarioID, setUsuarioID] = useState<number | null>(null)
  const [proximasSesiones, setProximasSesiones] = useState<ProximaSesion[]>([])

  useEffect(() => {
    fetchDashboard()
    fetchAvisos()
    fetchProximasSesiones()
  }, [])

  const fetchDashboard = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      setUsuarioID(user.usuarioID)

      const response = await fetch(`/api/entrenador/dashboard?usuarioID=${user.usuarioID}`)
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error("Error al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProximasSesiones = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      const response = await fetch(`/api/entrenador/clases?usuarioID=${user.usuarioID}`)
      if (response.ok) {
        const sesiones = await response.json()

        // Filtrar solo sesiones futuras
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const proximasSesionesFiltradas = sesiones
          .filter((sesion: any) => {
            if (sesion.TipoClase === "Personal" && sesion.FechaInicio) {
              const fechaSesion = new Date(sesion.FechaInicio)
              return fechaSesion >= hoy
            }
            return sesion.TipoClase === "Grupal" && sesion.Estado === 1
          })
          .sort((a: any, b: any) => {
            if (a.FechaInicio && b.FechaInicio) {
              return new Date(a.FechaInicio).getTime() - new Date(b.FechaInicio).getTime()
            }
            const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
            return diasOrden.indexOf(a.DiaSemana) - diasOrden.indexOf(b.DiaSemana)
          })
          .slice(0, 3) // Máximo 3 sesiones

        setProximasSesiones(proximasSesionesFiltradas)
      }
    } catch (error) {
      console.error("Error al cargar próximas sesiones:", error)
    }
  }

  const fetchAvisos = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      const response = await fetch(`/api/avisos?usuarioID=${user.usuarioID}&tipo=Entrenador`)
      if (response.ok) {
        const data = await response.json()
        setAvisos(data.avisos || [])
        setAvisosNoLeidos(data.noLeidos || 0)
      }
    } catch (error) {
      console.error("Error al cargar avisos:", error)
    }
  }

  const marcarAvisosLeidos = async () => {
    if (!usuarioID) return

    try {
      const avisosNoLeidosIds = avisos.filter((a) => !a.Leido).map((a) => a.AvisoID)

      for (const avisoID of avisosNoLeidosIds) {
        await fetch("/api/avisos/marcar-leido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avisoID, usuarioID }),
        })
      }

      setAvisos((prev) => prev.map((a) => ({ ...a, Leido: true })))
      setAvisosNoLeidos(0)
    } catch (error) {
      console.error("Error marking avisos as read:", error)
    }
  }

  const agendaStats = useMemo(() => {
    const total = data?.agendaHoy?.length ?? 0
    const clases = (data?.agendaHoy ?? []).filter((x) => x.Tipo === "clase").length
    const sesiones = Math.max(0, total - clases)
    return { total, clases, sesiones }
  }, [data])

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${diasSemana[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Error al cargar datos</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        {/* HEADER más dinámico (colores + chips) */}
        <div className="relative overflow-hidden rounded-2xl border bg-background/70 backdrop-blur p-6 shadow-sm">
          {/* Glows multi-color */}
          <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-red-500/20 blur-3xl opacity-60" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-blue-500/14 blur-3xl opacity-60" />
          <div className="pointer-events-none absolute top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl opacity-60" />
          {/* Línea gradiente */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[4px] bg-gradient-to-b from-red-500/70 via-blue-500/40 to-emerald-500/30" />
          {/* Líneas sutiles */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background:radial-gradient(circle_at_1px_1px,black_1px,transparent_0)] [background-size:22px_22px] dark:[background:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Entrenador</h1>
              <p className="text-muted-foreground">Resumen de tu actividad y agenda</p>

              {/* Chips rápidos */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Hoy: {agendaStats.total} actividades</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Clases: {agendaStats.clases}</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-red-600" />
                  <span>Sesiones: {agendaStats.sesiones}</span>
                </span>

                {avisosNoLeidos > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-700 dark:text-red-300">
                    <Bell className="h-3.5 w-3.5" />
                    <span>{avisosNoLeidos} avisos nuevos</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Mini panel derecha */}
            <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur shadow-sm w-full md:w-[340px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Estado del día</p>
                  <p className="mt-1 font-semibold">
                    {data.sesionesHoy > 0 ? "Tienes sesiones pendientes" : "Día al día ✅"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500"
                  style={{ width: `${Math.min(100, Math.max(10, data.asistenciaPromedio))}%` }}
                />
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Indicador visual basado en tu % de asistencia promedio.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards (más color) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Socios Asignados"
            value={`${data.sociosAsignados}`}
            subtitle="Con sesiones"
            icon={<Users className="h-5 w-5" />}
            badge="Clientes"
            accentClassName="bg-red-500/10"
            iconClassName="text-red-700 dark:text-red-300"
            gradientClassName="bg-red-500/30"
          />

          <StatCard
            title="Sesiones Hoy"
            value={`${data.sesionesHoy}`}
            subtitle={data.sesionesHoy > 0 ? "Pendientes" : "Completadas"}
            icon={<Clock className="h-5 w-5" />}
            badge="Hoy"
            accentClassName="bg-blue-500/10"
            iconClassName="text-blue-700 dark:text-blue-300"
            gradientClassName="bg-blue-500/30"
          />

          <StatCard
            title="Clases Semanales"
            value={`${data.clasesSemanales}`}
            subtitle="Esta semana"
            icon={<Calendar className="h-5 w-5" />}
            badge="Programadas"
            accentClassName="bg-emerald-500/10"
            iconClassName="text-emerald-700 dark:text-emerald-300"
            gradientClassName="bg-emerald-500/30"
          />

          <StatCard
            title="Asistencia"
            value={`${data.asistenciaPromedio}%`}
            subtitle="Promedio mensual"
            icon={<TrendingUp className="h-5 w-5" />}
            badge="Rendimiento"
            accentClassName="bg-violet-500/10"
            iconClassName="text-violet-700 dark:text-violet-300"
            gradientClassName="bg-violet-500/30"
          />
        </div>

        {/* Bloques medios (más dinámicos) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Consejo */}
          <Card className="relative overflow-hidden border bg-gradient-to-br from-red-50 via-orange-50 to-background dark:from-red-950/30 dark:via-orange-950/20 dark:to-background shadow-sm hover:shadow-md transition-all">
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-red-300/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-300/30 blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5" />
                </span>
                Consejo del Día
              </CardTitle>
              <CardDescription>Motivación y consistencia</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                "La constancia es la clave del éxito. Celebra cada pequeño logro con tus socios para mantener la
                motivación alta."
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-red-600 text-white hover:bg-red-600">Tip</Badge>
                <span className="text-xs text-muted-foreground">Úsalo como mensaje del día</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-background shadow-sm hover:shadow-md transition-all hover:border-blue-500/20 hover:ring-1 hover:ring-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </span>
                Próximas Sesiones
              </CardTitle>
              <CardDescription>Sesiones programadas esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              {proximasSesiones.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  No tienes sesiones próximas programadas
                </p>
              ) : (
                <div className="space-y-3">
                  {proximasSesiones.map((sesion, index) => {
                    const esPersonal = sesion.TipoClase === "Personal"
                    const etiquetaDia = esPersonal ? formatearFecha(sesion.FechaInicio) : sesion.DiaSemana
                    const valor = esPersonal ? 1 : sesion.CuposOcupados || 0

                    const colorGradient =
                      index === 0
                        ? "from-blue-500 to-cyan-400"
                        : index === 1
                          ? "from-emerald-500 to-lime-400"
                          : "from-red-500 to-orange-400"

                    return (
                      <div key={`${sesion.ClaseID}-${index}`} className="rounded-xl border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{etiquetaDia}</span>
                          <Badge variant="secondary" className="bg-background/70">
                            {esPersonal ? "1 sesión" : `${valor} inscritos`}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {sesion.HoraInicio.substring(0, 5)} - {sesion.NombreClase}
                          {sesion.NombreSocio && ` (${sesion.NombreSocio})`}
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colorGradient}`}
                            style={{ width: `${Math.min(100, Math.max(15, valor * 15))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rendimiento */}
          <Card className="border bg-background shadow-sm hover:shadow-md transition-all hover:border-emerald-500/20 hover:ring-1 hover:ring-emerald-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </span>
                Rendimiento Semanal
              </CardTitle>
              <CardDescription>Tus estadísticas de la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <KpiRow
                  label="Clases impartidas"
                  value={`${data.clasesImpartidasSemana}`}
                  tone="text-blue-700 dark:text-blue-300"
                />
                <KpiRow
                  label="Sesiones completadas"
                  value={`${data.sesionesCompletadasSemana}`}
                  tone="text-red-700 dark:text-red-300"
                />
                <KpiRow
                  label="Tasa de asistencia"
                  value={`${data.asistenciaPromedio}%`}
                  tone="text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div className="mt-5 rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Sugerencia</p>
                <p className="text-sm font-medium mt-1">
                  Mantén el promedio sobre <span className="text-emerald-700 dark:text-emerald-300">85%</span> para
                  mejorar retención.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda hoy (más visual + badges de color) */}
        <Card className="group border bg-background/60 shadow-sm transition-all hover:shadow-md hover:border-red-500/20 hover:ring-1 hover:ring-red-500/15 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Agenda de Hoy
                </CardTitle>
                <CardDescription className="group-hover:text-red-500/70 transition-colors">
                  Tus sesiones y clases programadas
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="group-hover:bg-red-500/10 group-hover:text-red-600 transition-colors"
              >
                {data.agendaHoy.length} actividades
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {data.agendaHoy.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No tienes actividades programadas para hoy</p>
            ) : (
              <div className="space-y-3">
                {data.agendaHoy.map((item, index) => {
                  const isClase = item.Tipo === "clase"
                  return (
                    <div
                      key={`${item.Tipo}-${item.ID}-${index}`}
                      className={[
                        "rounded-2xl border p-4 transition-all",
                        "bg-background/70 hover:shadow-sm",
                        isClase
                          ? "border-blue-200/70 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                          : "hover:bg-red-500/5 hover:border-red-500/20",
                      ].join(" ")}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Time block */}
                        <div
                          className={[
                            "flex items-center gap-3 rounded-2xl p-3 w-full sm:w-[220px]",
                            "ring-1 ring-black/5 dark:ring-white/10",
                            isClase ? "bg-blue-500/10" : "bg-muted/50",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "h-10 w-10 rounded-xl flex items-center justify-center",
                              isClase
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                : "bg-red-500/10 text-red-700 dark:text-red-300",
                            ].join(" ")}
                          >
                            {isClase ? <Dumbbell className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                          </div>

                          <div className="flex-1">
                            <p
                              className={`text-sm font-semibold ${isClase ? "text-blue-900 dark:text-blue-100" : "text-foreground"}`}
                            >
                              {isClase ? "Clase Grupal" : "Sesión Personal"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.HoraInicio} - {item.HoraFin}
                            </p>
                          </div>

                          <Badge
                            className={[
                              "rounded-full",
                              isClase
                                ? "bg-blue-600 text-white hover:bg-blue-600"
                                : "bg-red-600 text-white hover:bg-red-600",
                            ].join(" ")}
                          >
                            {isClase ? "Clase" : "1:1"}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <p
                            className={`font-semibold ${isClase ? "text-blue-900 dark:text-blue-100" : "text-foreground"}`}
                          >
                            {item.NombreSocio}
                          </p>
                          <p
                            className={`text-sm mt-0.5 ${isClase ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"}`}
                          >
                            {isClase ? `${item.Estado} inscritos` : item.Estado}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Duración: {calcMinutes(item.HoraInicio, item.HoraFin)} min</span>
                            </span>

                            <span
                              className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
                                isClase
                                  ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300"
                                  : "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300",
                              ].join(" ")}
                            >
                              {isClase ? "Grupo" : "Personalizado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAB Avisos (más pro + gradiente) */}
      {avisosNoLeidos > 0 && (
        <button
          onClick={() => {
            setShowAvisosModal(true)
            marcarAvisosLeidos()
          }}
          className={[
            "fixed bottom-8 right-8 z-50 group",
            "rounded-2xl px-6 py-4 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]",
            "text-white font-semibold flex items-center gap-3",
            "bg-gradient-to-r from-red-600 via-rose-600 to-blue-600",
            "border border-white/10",
          ].join(" ")}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-base">Avisos</span>
          <Badge className="bg-white/95 text-slate-900 border border-white text-sm px-2.5 py-0.5 font-bold">
            {avisosNoLeidos}
          </Badge>
        </button>
      )}

      {/* Modal avisos (solo estética) */}
      <Dialog open={showAvisosModal} onOpenChange={setShowAvisosModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <span className="h-9 w-9 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </span>
              Avisos del Gimnasio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {avisos.length > 0 ? (
              avisos.map((aviso) => (
                <Card
                  key={aviso.AvisoID}
                  className={[
                    "overflow-hidden border shadow-sm",
                    "hover:shadow-md transition-all",
                    "hover:border-red-500/20 hover:ring-1 hover:ring-red-500/10",
                  ].join(" ")}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-blue-500" />

                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{aviso.Titulo}</CardTitle>
                        <CardDescription>
                          {new Date(aviso.FechaCreacion).toLocaleDateString("es-CL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                      </div>

                      <Badge
                        variant="secondary"
                        className={aviso.Leido ? "bg-muted/60" : "bg-red-500/10 text-red-700 dark:text-red-300"}
                      >
                        {aviso.Leido ? "Leído" : "Nuevo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aviso.Mensaje}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay avisos disponibles</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

/* helpers (no cambian lógica del fetch, solo UI) */
function KpiRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={["font-bold text-lg", tone ?? "text-foreground"].join(" ")}>{value}</span>
    </div>
  )
}

function calcMinutes(h1: string, h2: string) {
  // acepta "HH:MM" (si viene distinto, cae con 0)
  try {
    const [aH, aM] = h1.split(":").map(Number)
    const [bH, bM] = h2.split(":").map(Number)
    const start = aH * 60 + aM
    const end = bH * 60 + bM
    return Math.max(0, end - start)
  } catch {
    return 0
  }
}
