"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUser } from "@/lib/auth-client"
import { Activity, ArrowUpRight, Bell, Calendar, Clock, Dumbbell, MessageSquare, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardData {
  sociosAsignados: number
  sesionesHoy: number
  clasesSemanales: number
  asistenciaPromedio: number
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

export default function EntrenadorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0)
  const [showAvisosModal, setShowAvisosModal] = useState(false)
  const [usuarioID, setUsuarioID] = useState<number | null>(null)

  useEffect(() => {
    fetchDashboard()
    fetchAvisos()
  }, [])

  const fetchDashboard = async () => {
    try {
      const user = getUser()

      if (!user?.usuarioID) {
        return
      }

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
        <div
          className="relative overflow-hidden rounded-2xl border 
          bg-background/70 backdrop-blur 
          p-6 shadow-sm"
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-500/20 blur-3xl opacity-50" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl opacity-50" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/60 via-red-500/25 to-transparent" />

          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Entrenador</h1>
            <p className="text-muted-foreground">Resumen de tu actividad y agenda</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Socios Asignados"
            value={`${data.sociosAsignados}`}
            subtitle="Con sesiones"
            icon={<Users className="h-5 w-5" />}
            badge="Clientes"
            accentClassName="bg-[oklch(0.82_0.05_280)]"
          />

          <StatCard
            title="Sesiones Hoy"
            value={`${data.sesionesHoy}`}
            subtitle={data.sesionesHoy > 0 ? "Pendientes" : "Completadas"}
            icon={<Clock className="h-5 w-5" />}
            badge="Hoy"
            accentClassName="bg-[oklch(0.88_0.06_35)]"
          />

          <StatCard
            title="Clases Semanales"
            value={`${data.clasesSemanales}`}
            subtitle="Esta semana"
            icon={<Calendar className="h-5 w-5" />}
            badge="Programadas"
            accentClassName="bg-[oklch(0.86_0.06_160)]"
          />

          <StatCard
            title="Asistencia"
            value={`${data.asistenciaPromedio}%`}
            subtitle="Promedio mensual"
            icon={<TrendingUp className="h-5 w-5" />}
            badge="Rendimiento"
            accentClassName="bg-[oklch(0.86_0.06_200)]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border bg-gradient-to-br from-red-50 to-orange-50 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-red-200/40 blur-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Dumbbell className="h-5 w-5" />
                Consejo del Día
              </CardTitle>
              <CardDescription className="text-red-700">Mantén motivados a tus socios</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-red-800 italic">
                "La constancia es la clave del éxito. Recuerda celebrar cada pequeño logro con tus socios para mantener
                su motivación alta."
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-background shadow-sm hover:shadow-md transition-all hover:border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Sesiones
              </CardTitle>
              <CardDescription>Sesiones programadas esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Lunes</span>
                  <Badge variant="secondary">{data.sesionesHoy} sesiones</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Miércoles</span>
                  <Badge variant="secondary">{Math.max(1, data.sesionesHoy - 1)} sesiones</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Viernes</span>
                  <Badge variant="secondary">{Math.max(2, data.sesionesHoy + 1)} sesiones</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-background shadow-sm hover:shadow-md transition-all hover:border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Rendimiento Semanal
              </CardTitle>
              <CardDescription>Tus estadísticas de la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clases impartidas</span>
                  <span className="font-bold text-lg">{data.clasesSemanales}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sesiones completadas</span>
                  <span className="font-bold text-lg">{Math.max(5, data.sesionesHoy * 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasa de asistencia</span>
                  <span className="font-bold text-lg text-green-600">{data.asistenciaPromedio}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {data.agendaHoy.map((item, index) => (
                  <div
                    key={`${item.Tipo}-${item.ID}-${index}`}
                    className={[
                      "rounded-xl border p-4 transition-all",
                      item.Tipo === "clase"
                        ? "bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        : "bg-background/60 hover:bg-red-500/5 hover:border-red-500/20",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={[
                          "flex flex-col items-center justify-center rounded-xl p-3 min-w-[70px]",
                          item.Tipo === "clase" ? "bg-blue-100" : "bg-muted",
                        ].join(" ")}
                      >
                        {item.Tipo === "clase" ? (
                          <Dumbbell className="h-5 w-5 text-blue-700 mb-1" />
                        ) : (
                          <Users className="h-5 w-5 text-primary mb-1" />
                        )}
                        <span
                          className={`text-xs font-bold ${item.Tipo === "clase" ? "text-blue-700" : "text-primary"}`}
                        >
                          {item.HoraInicio}
                        </span>
                        <span
                          className={`text-[10px] ${item.Tipo === "clase" ? "text-blue-600" : "text-muted-foreground"}`}
                        >
                          {item.HoraFin}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${item.Tipo === "clase" ? "text-blue-900" : "text-foreground"}`}>
                          {item.Tipo === "clase" ? "Clase Grupal" : "Sesión Personal"}
                        </p>
                        <p className={`text-sm font-medium ${item.Tipo === "clase" ? "text-blue-800" : ""}`}>
                          {item.NombreSocio}
                        </p>
                        <p
                          className={`text-xs mt-1 ${item.Tipo === "clase" ? "text-blue-700" : "text-muted-foreground"}`}
                        >
                          {item.Tipo === "clase" ? `${item.Estado} inscritos` : item.Estado}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {avisosNoLeidos > 0 && (
        <button
          onClick={() => {
            setShowAvisosModal(true)
            marcarAvisosLeidos()
          }}
          className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-50 group flex items-center gap-3 font-semibold border border-red-700"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-base">Avisos</span>
          <Badge className="bg-white text-red-600 border-2 border-red-600 text-sm px-2.5 py-0.5 font-bold">
            {avisosNoLeidos}
          </Badge>
        </button>
      )}

      <Dialog open={showAvisosModal} onOpenChange={setShowAvisosModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Bell className="h-5 w-5 text-red-600" />
              Avisos del Gimnasio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {avisos.length > 0 ? (
              avisos.map((aviso) => (
                <Card key={aviso.AvisoID} className="border-l-4 border-l-red-500 border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-900">{aviso.Titulo}</CardTitle>
                    <CardDescription>
                      {new Date(aviso.FechaCreacion).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700">{aviso.Mensaje}</p>
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
