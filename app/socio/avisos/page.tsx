"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { AlertCircle, Bell, Calendar, CheckCircle, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  TipoAviso: string
  Destinatarios: string
  FechaInicio: string
  FechaFin: string | null
  Leido: number
  FechaLeido: string | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function SocioAvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [socioID, setSocioID] = useState<number | null>(null)
  const [marking, setMarking] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const user = await getUser()
      if (!user || !user.socioID) return

      setSocioID(user.socioID)

      const response = await fetch(`/api/avisos?socioID=${user.socioID}&soloActivos=true`)
      if (response.ok) {
        const data = await response.json()
        setAvisos(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error al cargar avisos:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeido = async (avisoID: number) => {
    if (!socioID) return
    setMarking(avisoID)

    try {
      const response = await fetch("/api/avisos/marcar-leido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisoID, socioID }),
      })

      if (response.ok) {
        setAvisos((prev) => prev.map((a) => (a.AvisoID === avisoID ? { ...a, Leido: 1 } : a)))
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error)
    } finally {
      setMarking(null)
    }
  }

  const tipoUI = (tipoRaw: string) => {
    const tipo = (tipoRaw || "General").trim()

    const map: Record<
      string,
      { label: string; badge: string; dot: string; border: string; glow: string; icon: JSX.Element }
    > = {
      Urgente: {
        label: "Urgente",
        badge:
          "bg-red-600/10 text-red-700 border-red-600/20 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/25",
        dot: "bg-red-600 dark:bg-red-400",
        border: "border-red-600/30 dark:border-red-500/30",
        glow: "shadow-[0_0_0_1px_rgba(220,38,38,0.18)] dark:shadow-[0_0_0_1px_rgba(248,113,113,0.18)]",
        icon: <AlertCircle className="h-4 w-4" />,
      },
      Evento: {
        label: "Evento",
        badge:
          "bg-indigo-600/10 text-indigo-700 border-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/25",
        dot: "bg-indigo-600 dark:bg-indigo-400",
        border: "border-indigo-600/25 dark:border-indigo-500/25",
        glow: "shadow-[0_0_0_1px_rgba(79,70,229,0.16)] dark:shadow-[0_0_0_1px_rgba(129,140,248,0.16)]",
        icon: <Calendar className="h-4 w-4" />,
      },
      Horario: {
        label: "Horario",
        badge:
          "bg-violet-600/10 text-violet-700 border-violet-600/20 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/25",
        dot: "bg-violet-600 dark:bg-violet-400",
        border: "border-violet-600/25 dark:border-violet-500/25",
        glow: "shadow-[0_0_0_1px_rgba(124,58,237,0.16)] dark:shadow-[0_0_0_1px_rgba(167,139,250,0.16)]",
        icon: <Bell className="h-4 w-4" />,
      },
      Mantenimiento: {
        label: "Mantenimiento",
        // sin amarillo (usamos naranja/rojo suave)
        badge:
          "bg-orange-600/10 text-orange-700 border-orange-600/20 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/25",
        dot: "bg-orange-600 dark:bg-orange-400",
        border: "border-orange-600/25 dark:border-orange-500/25",
        glow: "shadow-[0_0_0_1px_rgba(234,88,12,0.14)] dark:shadow-[0_0_0_1px_rgba(251,146,60,0.14)]",
        icon: <AlertCircle className="h-4 w-4" />,
      },
      General: {
        label: "General",
        badge:
          "bg-slate-600/10 text-slate-700 border-slate-600/20 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/25",
        dot: "bg-slate-600 dark:bg-slate-400",
        border: "border-slate-600/20 dark:border-slate-500/25",
        glow: "shadow-[0_0_0_1px_rgba(100,116,139,0.14)] dark:shadow-[0_0_0_1px_rgba(148,163,184,0.14)]",
        icon: <Bell className="h-4 w-4" />,
      },
    }

    return map[tipo] || map.General
  }

  const avisosNoLeidos = useMemo(() => avisos.filter((a) => !a.Leido).length, [avisos])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-CL", { year: "numeric", month: "short", day: "numeric" })

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center min-h-[320px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-3"
          >
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Cargando avisos...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        {/* HEADER con degradado rojo (sin verdes/amarillos) */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-red-50 via-white to-slate-50 dark:from-red-950/35 dark:via-background dark:to-slate-950/30"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(900px_circle_at_20%_10%,rgba(220,38,38,0.16),transparent_45%),radial-gradient(900px_circle_at_80%_30%,rgba(99,102,241,0.10),transparent_50%)] dark:bg-[radial-gradient(900px_circle_at_20%_10%,rgba(248,113,113,0.14),transparent_45%),radial-gradient(900px_circle_at_80%_30%,rgba(129,140,248,0.10),transparent_50%)]" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Avisos del Gimnasio
                </h1>
                <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Mantente al día con eventos, cambios de horario y novedades importantes.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/60 dark:text-slate-200">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        avisosNoLeidos > 0 ? "animate-ping bg-red-500" : "bg-slate-400"
                      }`}
                    />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${avisosNoLeidos > 0 ? "bg-red-600" : "bg-slate-400"}`} />
                  </span>
                  {avisosNoLeidos > 0 ? `${avisosNoLeidos} sin leer` : "Todo al día"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPIs - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
            <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(600px_circle_at_10%_0%,rgba(220,38,38,0.10),transparent_45%)] dark:bg-[radial-gradient(600px_circle_at_10%_0%,rgba(248,113,113,0.10),transparent_45%)]" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisos Activos</CardTitle>
                <Bell className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{avisos.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-300">Disponibles para ti</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-red-50 dark:from-slate-950 dark:to-red-950/20">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(600px_circle_at_90%_0%,rgba(220,38,38,0.16),transparent_45%)] dark:bg-[radial-gradient(600px_circle_at_90%_0%,rgba(248,113,113,0.16),transparent_45%)]" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisos Sin Leer</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-red-600 dark:text-red-300">{avisosNoLeidos}</div>
                <p className="text-xs text-slate-500 dark:text-slate-300">Pendientes de lectura</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* LISTA */}
        <Card className="border bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Todos los Avisos</CardTitle>
            <CardDescription className="text-sm">
              {avisosNoLeidos > 0 ? `Tienes ${avisosNoLeidos} aviso(s) sin leer` : "Todos los avisos están leídos"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {avisos.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Bell className="mx-auto mb-3 h-10 w-10 opacity-60" />
                No hay avisos disponibles
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {avisos.map((aviso, idx) => {
                    const ui = tipoUI(aviso.TipoAviso)
                    const isUnread = !aviso.Leido

                    return (
                      <motion.div
                        key={aviso.AvisoID}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        variants={fadeUp}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.18) }}
                        className={[
                          "group relative overflow-hidden rounded-2xl border p-4 sm:p-5",
                          "bg-white dark:bg-slate-950",
                          ui.glow,
                          isUnread
                            ? "border-red-500/30 bg-gradient-to-br from-red-50/70 via-white to-slate-50 dark:from-red-950/25 dark:via-slate-950 dark:to-slate-950"
                            : "border-slate-200/70 dark:border-slate-800/70",
                        ].join(" ")}
                      >
                        {/* Barra lateral (no comprime nada) */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ui.dot}`} />

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          {/* CONTENIDO: min-w-0 para evitar compresión y permitir wrap */}
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${ui.badge}`}>
                                {ui.icon}
                                {ui.label}
                              </span>

                              {isUnread && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-600/25 bg-red-600/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200">
                                  <Bell className="h-3.5 w-3.5" />
                                  Nuevo
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50 break-words">
                                {aviso.Titulo}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                                {aviso.Mensaje}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(aviso.FechaInicio)}
                                {aviso.FechaFin ? ` · ${formatDate(aviso.FechaFin)}` : ""}
                              </span>

                              {aviso.Leido ? (
                                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Leído
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-300">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ACCIÓN: en mobile abajo/full width para que no “comprima” */}
                          {!aviso.Leido && (
                            <div className="shrink-0 sm:pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => marcarComoLeido(aviso.AvisoID)}
                                disabled={marking === aviso.AvisoID}
                                className={[
                                  "w-full sm:w-auto",
                                  "border-red-600/25 text-red-700 hover:bg-red-600/10 hover:text-red-700",
                                  "dark:border-red-500/25 dark:text-red-200 dark:hover:bg-red-500/15",
                                ].join(" ")}
                              >
                                {marking === aviso.AvisoID ? "Marcando..." : "Marcar como leído"}
                                <ChevronRight className="ml-1.5 h-4 w-4 opacity-70" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* hover shine */}
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(220,38,38,0.10),transparent_40%)] dark:bg-[radial-gradient(900px_circle_at_20%_0%,rgba(248,113,113,0.10),transparent_40%)]" />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}