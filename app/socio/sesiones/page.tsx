"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, CheckCircle, Clock, X, XCircle } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

type EstadoSesion = "Agendada" | "Completada" | "Cancelada"
interface Sesion {
  SesionID: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: EstadoSesion
  Notas: string
  NombreEntrenador: string
  Especialidad: string
  FotoURL?: string
}

export default function SocioSesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSesiones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSesiones = async () => {
    try {
      const user = getUser()
      const socioID = user?.socioID || user?.usuarioID
      if (!socioID) return

      const response = await fetch(`/api/socio/sesiones?socioID=${socioID}`)
      if (response.ok) {
        setSesiones(await response.json())
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSesion = async (sesionID: number) => {
    if (!confirm("¿Cancelar esta sesión?")) return

    const response = await fetch(`/api/socio/sesiones?sesionID=${sesionID}`, {
      method: "DELETE",
    })

    if (response.ok) fetchSesiones()
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const estadoPill = (estado: EstadoSesion) => {
    // Sin verdes/amarillos: rojo + acentos fríos (slate/indigo) que complementan al rojo
    if (estado === "Agendada")
      return "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
    if (estado === "Completada")
      return "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
    return "border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
  }

  const sesionesActivas = useMemo(() => sesiones.filter((s) => s.Estado === "Agendada"), [sesiones])
  const sesionesHistoricas = useMemo(() => sesiones.filter((s) => s.Estado !== "Agendada"), [sesiones])

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex justify-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-muted-foreground"
          >
            <div className="relative h-12 w-12">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-600/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.25, 0.6] }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute inset-2 rounded-full bg-red-600/20"
                animate={{ scale: [1, 0.9, 1] }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>
            <p className="text-sm sm:text-base">Cargando sesiones...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-8">
        {/* HERO / HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 dark:border-white/10"
        >
          {/* Fondo con imagen (si existe en /public/images) */}
          <div className="absolute inset-0">
            <Image
              src="/images/gym-hero.jpg" // cambia el nombre si tu imagen es otra (ej: /images/hero.jpg)
              alt="Mundo Fitness"
              fill
              className="object-cover opacity-20 dark:opacity-15"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/30 dark:from-zinc-950 dark:via-zinc-950/70 dark:to-zinc-950/30" />
            <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,rgba(220,38,38,0.18),transparent_55%)] dark:bg-[radial-gradient(80%_60%_at_20%_20%,rgba(220,38,38,0.28),transparent_55%)]" />
          </div>

          <div className="relative p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  <Clock className="h-3.5 w-3.5" />
                  Sesiones personales
                </div>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                  Tus entrenamientos con entrenador
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
                  Revisa tus próximas sesiones, cancela si es necesario y consulta tu historial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Próximas</p>
                  <p className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                    {sesionesActivas.length}
                  </p>
                </div>
                <div className="rounded-xl border bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Historial</p>
                  <p className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                    {sesionesHistoricas.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Línea degradada (regla de degradado) */}
            <div className="mt-5 h-[3px] w-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-zinc-900/20 dark:to-white/10" />
          </div>
        </motion.div>

        {/* PRÓXIMAS SESIONES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">Próximas sesiones</h2>
            <Badge className="shrink-0 border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {sesionesActivas.length} agendadas
            </Badge>
          </div>

          {sesionesActivas.length === 0 ? (
            <Card className="border-dashed dark:border-white/10">
              <CardContent className="py-10 sm:py-12 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200"
                >
                  <Calendar className="h-6 w-6" />
                </motion.div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                    No tienes sesiones agendadas
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 sm:text-sm">
                    Agenda una sesión para seguir avanzando con tu plan.
                  </p>
                </div>

                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => (window.location.href = "/socio/entrenadores")}
                >
                  Agendar sesión
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence initial={false}>
                {sesionesActivas.map((sesion) => (
                  <motion.div
                    key={sesion.SesionID}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group relative overflow-hidden border bg-white shadow-sm transition-all hover:shadow-lg dark:bg-zinc-950 dark:border-white/10">
                      {/* Degradado lateral + brillo sutil */}
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-red-600 via-red-500 to-zinc-900/20 dark:to-white/10" />
                      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-red-600/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100 dark:bg-red-500/15" />

                      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border border-white/60 shadow-sm dark:border-white/10">
                            <AvatarImage src={sesion.FotoURL || "/placeholder.svg"} />
                            <AvatarFallback className="bg-zinc-200 text-zinc-800 font-bold dark:bg-white/10 dark:text-zinc-100">
                              {sesion.NombreEntrenador.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg text-zinc-900 dark:text-zinc-100 truncate">
                              {sesion.NombreEntrenador}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 truncate">
                              {sesion.Especialidad}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:text-sm font-semibold ${estadoPill(sesion.Estado)}`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Agendada
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                            <span className="min-w-0 break-words text-xs sm:text-sm">
                              {formatDate(sesion.FechaSesion)}
                            </span>
                          </div>

                          <div className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                            <span className="min-w-0 break-words text-xs sm:text-sm">
                              {sesion.HoraInicio} - {sesion.HoraFin}
                            </span>
                          </div>
                        </div>

                        {sesion.Notas && (
                          <div className="rounded-xl border bg-zinc-50 p-4 text-xs sm:text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                            <p className="whitespace-pre-wrap break-words">{sesion.Notas}</p>
                          </div>
                        )}

                        <div className="pt-3 border-t border-zinc-200 dark:border-white/10">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelSesion(sesion.SesionID)}
                            className="w-full sm:w-auto"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar sesión
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* HISTORIAL */}
        {sesionesHistoricas.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">Historial</h2>
              <Badge className="shrink-0 border border-white/10 bg-zinc-50 text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                {sesionesHistoricas.length} registros
              </Badge>
            </div>

            <div className="grid gap-3">
              {sesionesHistoricas.map((sesion, idx) => (
                <motion.div
                  key={sesion.SesionID}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.12) }}
                >
                  <Card className="border bg-white shadow-sm dark:bg-zinc-950 dark:border-white/10">
                    <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {sesion.NombreEntrenador}
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 break-words">
                          {formatDate(sesion.FechaSesion)} · {sesion.HoraInicio}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${estadoPill(
                          sesion.Estado,
                        )}`}
                      >
                        {sesion.Estado === "Completada" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="whitespace-nowrap">{sesion.Estado}</span>
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
