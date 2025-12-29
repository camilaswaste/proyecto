"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, User, Users } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  NombreEntrenador: string
  Especialidad: string
  ReservasActuales: number
}

interface Reservacion {
  ClaseID: number
  FechaClase: string
  Estado: string
}

const formatTime = (timeString: string) => {
  try {
    const date = new Date(timeString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  } catch {
    return timeString
  }
}

export default function SocioClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [fechaClase, setFechaClase] = useState("")

  useEffect(() => {
    fetchClases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchClases = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID
      const response = await fetch(`/api/socio/clases?socioID=${socioID}`)
      if (response.ok) {
        const data = await response.json()
        setClases(data.clases)
        setReservaciones(data.reservaciones)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = (clase: Clase) => {
    setSelectedClase(clase)
    const today = new Date()
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    let diff = dias.indexOf(clase.DiaSemana) - today.getDay()
    if (diff <= 0) diff += 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    setFechaClase(next.toISOString().split("T")[0])
    setShowDialog(true)
  }

  const handleSubmitReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClase) return

    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const socioID = user.socioID || user.usuarioID

    const res = await fetch("/api/socio/clases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        socioID,
        claseID: selectedClase.ClaseID,
        fechaClase,
      }),
    })

    if (res.ok) {
      alert("Clase reservada exitosamente")
      setShowDialog(false)
      fetchClases()
    } else {
      alert("Error al reservar clase")
    }
  }

  const diasOrdenados = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const clasesPorDia = useMemo(() => {
    const map: Record<string, Clase[]> = {}
    for (const d of diasOrdenados) map[d] = []
    for (const c of clases) {
      if (!map[c.DiaSemana]) map[c.DiaSemana] = []
      map[c.DiaSemana].push(c)
    }
    return map
  }, [clases])

  // (UI) helper: barra y estados de cupos
  const getCupoUI = (clase: Clase) => {
    const cupos = clase.CupoMaximo - clase.ReservasActuales
    const llena = cupos <= 0
    const pocos = cupos > 0 && cupos <= 3
    const ratio = clase.CupoMaximo > 0 ? Math.min(1, clase.ReservasActuales / clase.CupoMaximo) : 0
    return { cupos, llena, pocos, ratio }
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-600/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">Cargando clases...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6 sm:space-y-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          {/* Imagen (cámbiala por la tuya en /public/images) */}
          <div className="absolute inset-0">
            <Image
              src="/images/mundoFitness.jpg" // <-- reemplaza por tu imagen real
              alt="Clases Mundo Fitness"
              fill
              className="object-cover opacity-20 dark:opacity-15"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/40 dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950/40" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-5 sm:p-8"
          >
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-600/20 bg-red-600/10 px-3 py-1 text-xs sm:text-sm text-red-700 dark:text-red-300">
                <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                Reserva tu cupo en segundos
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Clases Grupales
              </h1>

              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl">
                Encuentra tu clase ideal, revisa cupos y reserva tu lugar. Todo optimizado para celular.
              </p>
            </div>
          </motion.div>
        </div>

        {/* LISTADO POR DÍA */}
        <div className="space-y-8">
          {diasOrdenados.map((dia) => {
            const clasesDia = clasesPorDia[dia] || []
            if (!clasesDia.length) return null

            return (
              <motion.section
                key={dia}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35 }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 truncate">
                      {dia}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {clasesDia.length} {clasesDia.length === 1 ? "clase" : "clases"} disponibles
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                  >
                    {clasesDia.length}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {clasesDia.map((clase) => {
                    const { cupos, llena, pocos, ratio } = getCupoUI(clase)

                    return (
                      <motion.div
                        key={clase.ClaseID}
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="h-full"
                      >
                        <Card className="relative h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-950/50 shadow-sm hover:shadow-md transition-shadow">
                          {/* Accent */}
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-600 to-emerald-500" />
                          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-red-600/10 blur-2xl" />

                          <CardHeader className="pb-3">
                            {/* Evita overflow del título */}
                            <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-50 break-words leading-snug">
                              {clase.NombreClase}
                            </CardTitle>

                            {clase.Descripcion && (
                              <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-words line-clamp-2">
                                {clase.Descripcion}
                              </CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-3">
                            {/* Info chips */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                <Clock className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <span className="break-words">
                                  {formatTime(clase.HoraInicio)} – {formatTime(clase.HoraFin)}
                                </span>
                              </div>

                              <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                <User className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <span className="break-words">
                                  {clase.NombreEntrenador}
                                  {clase.Especialidad ? (
                                    <span className="text-slate-500 dark:text-slate-400"> · {clase.Especialidad}</span>
                                  ) : null}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-start gap-2 text-xs sm:text-sm">
                                  <Users className="h-4 w-4 text-slate-700 dark:text-slate-200 mt-0.5 shrink-0" />
                                  <span
                                    className={[
                                      "font-semibold",
                                      llena
                                        ? "text-red-600 dark:text-red-400"
                                        : pocos
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-emerald-600 dark:text-emerald-400",
                                    ].join(" ")}
                                  >
                                    {llena ? "Clase llena" : `${cupos} cupos disponibles`}
                                  </span>
                                </div>

                                <Badge
                                  className={[
                                    "shrink-0 border",
                                    llena
                                      ? "bg-red-600 text-white border-red-700"
                                      : pocos
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-emerald-600 text-white border-emerald-700",
                                  ].join(" ")}
                                >
                                  {llena ? "0%" : `${Math.max(0, Math.round((cupos / clase.CupoMaximo) * 100))}%`}
                                </Badge>
                              </div>

                              {/* Barra cupos */}
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div
                                  className={[
                                    "h-full transition-all",
                                    llena
                                      ? "bg-red-600"
                                      : pocos
                                        ? "bg-amber-500"
                                        : "bg-emerald-600",
                                  ].join(" ")}
                                  style={{ width: `${Math.min(100, Math.max(6, Math.round(ratio * 100)))}%` }}
                                />
                              </div>
                            </div>

                            {/* CTA */}
                            <Button
                              disabled={llena}
                              onClick={() => handleReservar(clase)}
                              className={[
                                "w-full h-11 sm:h-12 text-sm sm:text-base font-extrabold tracking-tight",
                                "rounded-xl",
                                llena
                                  ? "bg-slate-200 text-slate-500 dark:bg-slate-900 dark:text-slate-500 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700 text-white shadow-sm",
                              ].join(" ")}
                            >
                              {llena ? "No disponible" : "Reservar ahora"}
                            </Button>

                            {/* Nota responsive para evitar desbordes */}
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                              Al reservar, se asigna la <span className="font-semibold">próxima fecha</span> del día{" "}
                              <span className="font-semibold">{clase.DiaSemana}</span>.
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )
          })}
        </div>

        {/* DIALOG */}
        <AnimatePresence>
          {showDialog && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent className="sm:max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 border border-red-600/20">
                        <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </span>
                      Reservar clase
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmitReserva} className="space-y-4 mt-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                      <p className="text-xs text-muted-foreground">Clase seleccionada</p>
                      <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-50 break-words">
                        {selectedClase?.NombreClase}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        {selectedClase ? (
                          <>
                            {selectedClase.DiaSemana} · {formatTime(selectedClase.HoraInicio)} –{" "}
                            {formatTime(selectedClase.HoraFin)}
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Fecha</Label>
                      <Input
                        type="date"
                        value={fechaClase}
                        onChange={(e) => setFechaClase(e.target.value)}
                        required
                        className="h-11 rounded-xl"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Puedes modificar la fecha si corresponde, antes de confirmar.
                      </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowDialog(false)}
                        className="h-11 rounded-xl"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="h-11 rounded-xl bg-red-600 hover:bg-red-700 font-extrabold">
                        Confirmar
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}