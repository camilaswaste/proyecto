"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUser } from "@/lib/auth-client"
import { Calendar, Mail, ShieldAlert, Sparkles, Users } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
  Email: string
  Especialidad: string
  Certificaciones: string
  FotoURL?: string
  FotoDemo?: string // stock/demo
}

const container = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export default function SocioEntrenadoresPage() {
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null)
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)

  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [bookingTrainer, setBookingTrainer] = useState<Entrenador | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<{ sessionCount: number; message: string } | null>(null)

  const [formData, setFormData] = useState({
    fechaSesion: "",
    horaInicio: "",
    horaFin: "",
    notas: "",
  })

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/socio/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      } else {
        console.error("Failed to fetch entrenadores:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBooking = (entrenador: Entrenador) => {
    setBookingTrainer(entrenador)
    setFormData({ fechaSesion: "", horaInicio: "", horaFin: "", notas: "" })
    setShowBookingDialog(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent, forceBooking = false) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = getUser()
      const socioID = user?.socioID || user?.usuarioID

      if (!socioID || !bookingTrainer) {
        alert("Error: No se pudo identificar al socio")
        setSubmitting(false)
        return
      }

      const response = await fetch("/api/socio/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          entrenadorID: bookingTrainer.EntrenadorID,
          ...formData,
          forceBooking,
        }),
      })

      const data = await response.json()

      if (data.warning && !forceBooking) {
        setConflictInfo({ sessionCount: data.sessionCount, message: data.message })
        setShowConflictDialog(true)
        setSubmitting(false)
        return
      }

      if (response.ok) {
        alert("Sesión agendada exitosamente")
        setShowBookingDialog(false)
        setShowConflictDialog(false)
        setConflictInfo(null)
        setFormData({ fechaSesion: "", horaInicio: "", horaFin: "", notas: "" })
      } else {
        alert(data.error || "Error al agendar sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agendar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmBooking = async () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    await handleSubmitBooking(fakeEvent, true)
  }

  const trainersCount = useMemo(() => entrenadores.length, [entrenadores])

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-600/10 dark:bg-red-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <p className="text-muted-foreground">Cargando entrenadores...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/60 dark:bg-zinc-950/50 backdrop-blur-xl shadow-sm">
          {/* fondo */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-zinc-900/10 to-transparent dark:from-red-500/15 dark:via-black/30" />
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-red-600/20 blur-3xl dark:bg-red-500/20" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-zinc-900/10 blur-3xl dark:bg-white/5" />

            {/* imagen opcional */}
            <div className="absolute inset-0 opacity-25 dark:opacity-20">
              <Image
                src="/images/gym-hero.jpg"
                alt="Mundo Fitness"
                fill
                className="object-cover"
                priority={false}
              />
            </div>
          </div>

          <div className="relative p-4 sm:p-6 md:p-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 dark:bg-zinc-950/60 px-3 py-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-200">
                    <Sparkles className="h-4 w-4 text-red-600 dark:text-red-400" />
                    Entrena con profesionales
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Entrenadores
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl">
                    Conoce a nuestros entrenadores y agenda tu sesión personalizada en minutos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl border bg-white/70 dark:bg-zinc-950/60 px-3 py-2">
                    <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-none">Disponibles</p>
                    <p className="text-lg sm:text-2xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                      {trainersCount}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-zinc-900/10 dark:to-white/10" />
        </div>

        {/* GRID */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {entrenadores.length === 0 ? (
            <motion.div variants={item} className="xl:col-span-3">
              <Card className="border-dashed">
                <CardContent className="py-10 text-center space-y-3">
                  <Users className="mx-auto h-10 w-10 text-zinc-400" />
                  <p className="text-muted-foreground">No hay entrenadores disponibles</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            entrenadores.map((entrenador) => {
              const open = selectedTrainer === entrenador.EntrenadorID
              const initials =
                (entrenador.Nombre?.[0] || "").toUpperCase() + (entrenador.Apellido?.[0] || "").toUpperCase()

              return (
                <motion.div key={entrenador.EntrenadorID} variants={item} layout>
                  <Card className="group relative overflow-hidden border bg-white dark:bg-zinc-950/40 shadow-sm hover:shadow-lg transition-all">
                    {/* top gradient bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-zinc-900/10 dark:to-white/10" />

                    {/* cover */}
                    <div className="relative h-36 sm:h-40">
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 via-red-600/10 to-transparent dark:from-black/40 dark:via-red-500/10" />
                      {entrenador.FotoDemo ? (
                        <Image
                          src={entrenador.FotoDemo}
                          alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-16 w-16 rounded-full bg-white/25 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                            <span className="text-2xl font-black text-white drop-shadow">{initials}</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/35 to-transparent dark:from-zinc-950/95 dark:via-zinc-950/40" />
                    </div>

                    {/* avatar overlap */}
                    <div className="relative px-4 sm:px-5">
                      <div className="absolute -top-10 left-4 sm:left-5">
                        <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-950 ring-1 ring-zinc-200 dark:ring-white/10 shadow-md overflow-hidden">
                          {entrenador.FotoURL ? (
                            // local/external; si es external y te falla next/image, cámbialo por <img />
                            <Image
                              src={entrenador.FotoURL}
                              alt={`${entrenador.Nombre} ${entrenador.Apellido}`}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-red-600 to-zinc-900 flex items-center justify-center">
                              <span className="text-white font-extrabold">{initials}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pt-10 sm:pt-12 px-4 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white truncate">
                            {entrenador.Nombre} {entrenador.Apellido}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                            <span className="line-clamp-1">
                              {entrenador.Especialidad || "Entrenador Personal"}
                            </span>
                          </CardDescription>

                          {entrenador.Certificaciones ? (
                            <p className="mt-2 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 break-words">
                              <span className="font-semibold text-zinc-600 dark:text-zinc-300">Certificaciones:</span>{" "}
                              {entrenador.Certificaciones}
                            </p>
                          ) : null}
                        </div>

                        <Button
                          variant={open ? "default" : "outline"}
                          className={
                            open
                              ? "bg-red-600 hover:bg-red-700 text-white shrink-0"
                              : "border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 shrink-0"
                          }
                          onClick={() => setSelectedTrainer(open ? null : entrenador.EntrenadorID)}
                        >
                          {open ? "Ocultar" : "Ver más"}
                        </Button>
                      </div>
                    </CardHeader>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <CardContent className="px-4 sm:px-5 pb-5 pt-0">
                            <div className="rounded-xl border bg-zinc-50 dark:bg-white/5 dark:border-white/10 p-3 sm:p-4 space-y-3">
                              <div className="flex items-start gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-200">
                                <Mail className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <span className="break-all">
                                  <span className="font-semibold">Email:</span> {entrenador.Email}
                                </span>
                              </div>

                              {entrenador.Especialidad ? (
                                <div className="flex items-start gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-200">
                                  <Users className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                  <span className="break-words">
                                    <span className="font-semibold">Especialidad:</span> {entrenador.Especialidad}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            <div className="pt-4">
                              <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                                onClick={() => handleOpenBooking(entrenador)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendar sesión
                              </Button>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })
          )}
        </motion.div>

        {/* BOOKING DIALOG */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-lg p-0 overflow-hidden border bg-white dark:bg-zinc-950">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/15 via-zinc-900/5 to-transparent dark:from-red-500/10 dark:via-black/30" />
              <div className="relative p-4 sm:p-6 border-b dark:border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
                    Agendar sesión con{" "}
                    <span className="text-red-600 dark:text-red-400">
                      {bookingTrainer?.Nombre} {bookingTrainer?.Apellido}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                  Completa la fecha y horario. Puedes agregar notas para el entrenador.
                </p>
              </div>

              <form onSubmit={handleSubmitBooking} className="relative p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaSesion" className="text-xs sm:text-sm">
                      Fecha *
                    </Label>
                    <Input
                      id="fechaSesion"
                      type="date"
                      value={formData.fechaSesion}
                      onChange={(e) => setFormData({ ...formData, fechaSesion: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio" className="text-xs sm:text-sm">
                        Inicio *
                      </Label>
                      <Input
                        id="horaInicio"
                        type="time"
                        value={formData.horaInicio}
                        onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                        required
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horaFin" className="text-xs sm:text-sm">
                        Fin *
                      </Label>
                      <Input
                        id="horaFin"
                        type="time"
                        value={formData.horaFin}
                        onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                        required
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas" className="text-xs sm:text-sm">
                    Notas (opcional)
                  </Label>
                  <textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full rounded-md border bg-white dark:bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600/40 dark:border-white/10"
                    placeholder="Objetivos, zonas a trabajar, lesiones, etc."
                    rows={4}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingDialog(false)}
                    disabled={submitting}
                    className="border-zinc-300 dark:border-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? "Agendando..." : "Agendar sesión"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* CONFLICT DIALOG */}
        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogContent className="max-w-lg p-0 overflow-hidden border bg-white dark:bg-zinc-950">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-zinc-900/5 to-transparent dark:from-red-500/10 dark:via-black/30" />
              <div className="relative p-4 sm:p-6 border-b dark:border-white/10">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Conflicto de horario
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                  Detectamos un posible cruce con tus sesiones.
                </p>
              </div>

              <div className="relative p-4 sm:p-6 space-y-4">
                <div className="rounded-xl border bg-zinc-50 dark:bg-white/5 dark:border-white/10 p-4">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 break-words">{conflictInfo?.message}</p>
                  <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">
                    ¿Deseas agendar de todas formas?
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowConflictDialog(false)
                      setConflictInfo(null)
                    }}
                    disabled={submitting}
                    className="border-zinc-300 dark:border-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleConfirmBooking} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? "Agendando..." : "Sí, agendar igual"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}