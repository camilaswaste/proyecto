"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUser } from "@/lib/auth-client"

import {
  Bell,
  Calendar,
  Clock,
  CreditCard,
  Dumbbell,
  ExternalLink,
  Flame,
  Award as IdCard,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Target,
  X,
} from "lucide-react"

interface MembresiaData {
  plan: string
  fechaInicio: string
  fechaVencimiento: string
  diasRestantes: number
  estado: string
  codigoQR?: string
  nombre?: string
  apellido?: string
  rut?: string
  fotoURL?: string
}

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  FechaCreacion: string
  Leido: boolean
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const springy = {
  type: "spring" as const,
  stiffness: 260,
  damping: 22,
}

export default function SocioDashboardPage() {
  const [membershipData, setMembershipData] = useState<MembresiaData | null>(null)
  const [showCredencial, setShowCredencial] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0)
  const [showAvisosModal, setShowAvisosModal] = useState(false)
  const [isGymOpen, setIsGymOpen] = useState(false)
  const [socioID, setSocioID] = useState<number | null>(null)
  const [usuarioID, setUsuarioID] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser()
        if (!user || !user.socioID) {
          console.error("[v0] No socio ID found")
          return
        }

        setSocioID(user.socioID)
        setUsuarioID(user.usuarioID)

        const response = await fetch(`/api/socio/membresia?socioID=${user.socioID}`)
        if (!response.ok) throw new Error("Error al obtener datos de membresía")

        const data = await response.json()

        if (data) {
          const fechaVencimiento = new Date(data.FechaFin)
          const hoy = new Date()
          const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          const mappedData: MembresiaData = {
            plan: data.NombrePlan,
            fechaInicio: new Date(data.FechaInicio).toLocaleDateString("es-CL"),
            fechaVencimiento: fechaVencimiento.toLocaleDateString("es-CL"),
            diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
            estado: data.Estado,
            codigoQR: data.CodigoQR,
            nombre: data.Nombre,
            apellido: data.Apellido,
            rut: data.RUT,
            fotoURL: data.FotoURL,
          }

          setMembershipData(mappedData)
        }

        const avisosResponse = await fetch(`/api/avisos?usuarioID=${user.usuarioID}&tipo=Socio&soloActivos=true`)
        if (avisosResponse.ok) {
          const avisosData = await avisosResponse.json()
          setAvisos(avisosData.avisos || [])
          setAvisosNoLeidos(avisosData.noLeidos || 0)
        }

        const horariosResponse = await fetch("/api/horarios")
        if (horariosResponse.ok) {
          const horariosData = await horariosResponse.json()
          const now = new Date()
          const dayOfWeek = now.getDay() // 0=Domingo, 1=Lunes, ..., 6=Sábado
          const currentTime = now.getHours() * 60 + now.getMinutes()

          const todaySchedule = horariosData.find((h: any) => h.DiaSemana === dayOfWeek)

          if (todaySchedule && !todaySchedule.Cerrado) {
            const parseTime = (timeStr: string) => {
              if (timeStr.includes("T")) {
                const date = new Date(timeStr)
                const hour = date.getUTCHours()
                const minute = date.getUTCMinutes()
                return hour * 60 + minute
              }
              const parts = timeStr.split(":")
              const hour = Number.parseInt(parts[0])
              const minute = Number.parseInt(parts[1])
              return hour * 60 + minute
            }

            const openTime = parseTime(todaySchedule.HoraApertura)
            const closeTime = parseTime(todaySchedule.HoraCierre)
            setIsGymOpen(currentTime >= openTime && currentTime < closeTime)
          } else {
            setIsGymOpen(false)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  const stats = useMemo(
    () => ({
      asistenciasMes: 18,
      proximaSesion: "2025-01-22 11:00",
      clasesReservadas: 3,
    }),
    [],
  )

  const nombreMostrar = membershipData?.nombre?.trim() || "Socio"

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-72">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springy}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Dumbbell className="h-12 w-12 text-slate-600 dark:text-slate-300" />
            </motion.div>
            <p className="text-sm sm:text-base text-muted-foreground">Cargando tu información...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-5 sm:space-y-7">
        {/* HERO */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ ...springy, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-xl"
        >
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <Image
              src="/images/gym-hero.jpg"
              alt="Mundo Fitness"
              fill
              className="object-cover opacity-35"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/70" />
          </div>

          <div className="relative z-10 p-4 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springy, delay: 0.12 }}
                  className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
                >
                  Hola, {nombreMostrar}!
                </motion.h1>
                <p className="mt-1 text-sm sm:text-base text-slate-200">
                  Bienvenido a <span className="font-semibold text-white">Mundo Fitness Chimbarongo</span>
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Gimnasio {isGymOpen ? "ABIERTO" : "CERRADO"} ahora
                  </span>
                  <motion.div
                    className={`h-2.5 w-2.5 rounded-full ${isGymOpen ? "bg-emerald-400" : "bg-slate-300"}`}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>

              {/* Mini Stats (desktop) */}
              <div className="hidden md:flex items-center gap-5">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={springy}
                  className="w-[140px] rounded-2xl border border-white/15 bg-white/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Flame className="h-6 w-6 text-orange-300" />
                    <span className="text-[10px] font-bold tracking-widest text-slate-200">MES</span>
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">{stats.asistenciasMes}</div>
                  {/* FIX: esto ya NO se sale */}
                  <div className="mt-1 text-[10px] font-semibold tracking-wide text-slate-200 truncate">
                    ENTRENAMIENTOS
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={springy}
                  className="w-[140px] rounded-2xl border border-white/15 bg-white/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Target className="h-6 w-6 text-sky-300" />
                    <span className="text-[10px] font-bold tracking-widest text-slate-200">ACTIVAS</span>
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">{stats.clasesReservadas}</div>
                  <div className="mt-1 text-[10px] font-semibold tracking-wide text-slate-200 truncate">CLASES</div>
                </motion.div>
              </div>
            </div>

            {/* Stats (mobile) */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:hidden">
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={springy}
                className="rounded-2xl border border-white/15 bg-white/10 p-3"
              >
                <div className="flex items-center justify-between">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-200">MES</span>
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">{stats.asistenciasMes}</div>
                {/* FIX: truncate + min-w-0 */}
                <div className="mt-1 min-w-0 truncate text-[10px] font-semibold tracking-wide text-slate-200">
                  ENTRENAMIENTOS
                </div>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={springy}
                className="rounded-2xl border border-white/15 bg-white/10 p-3"
              >
                <div className="flex items-center justify-between">
                  <Target className="h-5 w-5 text-sky-300" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-200">ACTIVAS</span>
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">{stats.clasesReservadas}</div>
                <div className="mt-1 min-w-0 truncate text-[10px] font-semibold tracking-wide text-slate-200">
                  CLASES
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* GRID PRINCIPAL */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna Izquierda */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Membresía */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ ...springy, delay: 0.1 }}>
              <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-800 shadow-lg">
                <div className="h-1 bg-red-600" />
                <CardHeader className="bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-2xl text-slate-900 dark:text-slate-100">
                        <span className="inline-flex p-2 rounded-xl bg-red-600 shadow-sm">
                          <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                        </span>
                        Tu Membresía
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        Revisa tu plan y vigencia rápidamente
                      </CardDescription>
                    </div>

                    <Badge
                      variant={membershipData?.estado === "Vigente" ? "default" : "destructive"}
                      className="text-[10px] sm:text-sm px-2 sm:px-4 py-1"
                    >
                      {membershipData?.estado || "Sin datos"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-3 sm:p-4">
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Plan Actual
                      </p>
                      <p className="mt-1 text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                        {membershipData?.plan || "Sin plan"}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        Inicio: {membershipData?.fechaInicio || "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/25 p-3 sm:p-4">
                      <p className="text-[11px] sm:text-sm font-semibold text-red-700 dark:text-red-300">Vence</p>
                      <p className="mt-1 text-base sm:text-lg font-extrabold text-red-900 dark:text-red-200">
                        {membershipData?.fechaVencimiento || "N/A"}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-red-700/70 dark:text-red-300/70">
                        Mantén tu membresía al día
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/25 p-3 sm:p-4">
                      <p className="text-[11px] sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Días Restantes
                      </p>
                      <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
                        {membershipData?.diasRestantes !== undefined ? membershipData.diasRestantes : "-"}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-emerald-700/70 dark:text-emerald-300/70">
                        Aprovecha tu plan 💪
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <Link href="/socio/membresia" className="flex-1">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base py-5 sm:py-6 font-bold shadow-md hover:shadow-lg transition-all">
                        Ver Detalles Completos
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      onClick={() => setShowCredencial(true)}
                      className="w-full sm:w-auto px-4 sm:px-8 py-5 sm:py-6 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all"
                    >
                      <IdCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Mi Credencial QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ ...springy, delay: 0.14 }}>
                <Link href="/socio/entrenadores">
                  <Card className="h-full cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 shadow-sm hover:shadow-lg transition-all">
                    <div className="relative h-24">
                      <Image src="/images/gym-1.jpg" alt="Entrenadores" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-red-600/90 px-3 py-1">
                        <Dumbbell className="h-4 w-4 text-white" />
                        <span className="text-[11px] font-bold text-white">AGENDAR</span>
                      </div>
                    </div>

                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-red-600 shadow-sm">
                        <Dumbbell className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          Agendar Sesión
                        </h3>
                        <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 truncate">
                          Con entrenador personal
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ ...springy, delay: 0.18 }}>
                <Link href="/socio/pagos">
                  <Card className="h-full cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm hover:shadow-lg transition-all">
                    <div className="relative h-24">
                      <Image src="/images/gym-2.jpg" alt="Pagos" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-1 border border-white/10">
                        <CreditCard className="h-4 w-4 text-white" />
                        <span className="text-[11px] font-bold text-white">PAGOS</span>
                      </div>
                    </div>

                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-800 shadow-sm">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          Realizar Pago
                        </h3>
                        <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 truncate">
                          Renueva tu membresía
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            </div>

            {/* Próximas actividades */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ ...springy, delay: 0.22 }}>
              <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-xl text-slate-900 dark:text-white">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    Tus Próximas Actividades
                  </CardTitle>
                  <CardDescription className="text-[11px] sm:text-sm">
                    Sesiones y clases programadas
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={springy}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/30 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <div className="flex flex-col items-center justify-center bg-red-600 text-white rounded-2xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] shadow-sm">
                        <span className="text-xl sm:text-2xl font-extrabold leading-none">22</span>
                        <span className="text-[10px] font-bold tracking-widest">ENE</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">
                          Sesión Personal
                        </p>
                        <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 truncate">
                          11:00 AM - Con Pedro Martínez
                        </p>
                      </div>

                      <Badge className="bg-transparent text-red-600 dark:text-red-300 border-2 border-red-600 dark:border-red-600 text-[10px] sm:text-sm px-2 py-0.5 font-extrabold">
                        Confirmada
                      </Badge>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={springy}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all"
                    >
                      <div className="flex flex-col items-center justify-center bg-slate-800 text-white rounded-2xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] shadow-sm">
                        <span className="text-xl sm:text-2xl font-extrabold leading-none">23</span>
                        <span className="text-[10px] font-bold tracking-widest">ENE</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">
                          Clase Funcional
                        </p>
                        <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 truncate">
                          6:00 PM - Grupal
                        </p>
                      </div>

                      <Badge className="bg-transparent text-red-600 dark:text-red-300 border-2 border-red-600 dark:border-red-600 text-[10px] sm:text-sm px-2 py-0.5 font-extrabold">
                        Reservada
                      </Badge>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-4">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ ...springy, delay: 0.12 }}>
              <Card className="border border-slate-200 dark:border-slate-800 shadow-lg lg:sticky lg:top-4 bg-white dark:bg-slate-950/30 overflow-hidden">
                <div className="h-1 bg-red-600" />
                <CardHeader className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/40">
                  <CardTitle className="text-slate-900 dark:text-white text-base sm:text-xl">
                    Mundo Fitness
                  </CardTitle>
                  <CardDescription className="text-[11px] sm:text-sm font-medium">
                    Información de contacto
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-3">
                  <a
                    href="https://www.instagram.com/mundofitness_chimbarongo?igsh=MXByeW51ZjNxejU3eA=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-300 dark:hover:border-pink-800 transition-all group"
                  >
                    <div className="p-2 bg-pink-600 rounded-xl shadow-sm">
                      <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-pink-600">
                        Instagram
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-pink-200 truncate">
                        @mundofitness_chimbarongo
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-pink-600" />
                  </a>

                  <a
                    href="https://maps.app.goo.gl/JAzpwyHFAyoPToLE7?g_st=aw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:border-teal-300 dark:hover:border-teal-800 transition-all group"
                  >
                    <div className="p-2 bg-teal-600 rounded-xl shadow-sm">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600">
                        Ubicación
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-teal-200 truncate">
                        Chimbarongo, Chile
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />
                  </a>

                  <a
                    href="mailto:mundofitnesschimbarongo08@gmail.com"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                  >
                    <div className="p-2 bg-slate-800 rounded-xl shadow-sm">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        Email
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        mundofitness...@gmail.com
                      </p>
                    </div>
                  </a>

                  <Link href="/socio/horarios" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/30 bg-transparent text-xs sm:text-sm py-5"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Ver Horarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* FAB avisos */}
        <AnimatePresence>
          {avisosNoLeidos > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={springy}
              onClick={() => {
                setShowAvisosModal(true)
                marcarAvisosLeidos()
              }}
              className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 bg-red-600 hover:bg-red-700 text-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-xl hover:shadow-2xl transition-all z-50 flex items-center gap-2 sm:gap-3 font-extrabold border border-red-700"
            >
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base">Avisos</span>
              <Badge className="bg-white text-red-600 border-2 border-white text-xs sm:text-sm px-2 py-0.5 font-extrabold">
                {avisosNoLeidos}
              </Badge>
            </motion.button>
          )}
        </AnimatePresence>

        {/* MODAL Avisos */}
        <Dialog open={showAvisosModal} onOpenChange={setShowAvisosModal}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Bell className="h-5 w-5 text-red-600" />
                Avisos del Gimnasio
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {avisos.length > 0 ? (
                avisos.map((aviso) => (
                  <Card key={aviso.AvisoID} className="border-l-4 border-l-red-600 border border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base text-slate-900 dark:text-white">
                        {aviso.Titulo}
                      </CardTitle>
                      <CardDescription className="text-[11px] sm:text-sm">
                        {new Date(aviso.FechaCreacion).toLocaleDateString("es-CL", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[12px] sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {aviso.Mensaje}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay avisos disponibles</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL Credencial */}
        <Dialog open={showCredencial} onOpenChange={setShowCredencial}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={springy}
              className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="h-24 bg-gradient-to-r from-red-600 to-red-800 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-full flex items-center px-6">
                  <h2 className="text-white text-xl sm:text-3xl font-extrabold tracking-tight">
                    CREDENCIAL DE SOCIO
                  </h2>
                </div>
                <button
                  onClick={() => setShowCredencial(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-red-600 shadow-lg">
                    {membershipData?.fotoURL ? (
                      <img
                        src={membershipData.fotoURL || "/placeholder.svg"}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-zinc-300 text-4xl font-extrabold">
                          {membershipData?.nombre?.[0]}
                          {membershipData?.apellido?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                    <p className="text-white text-lg sm:text-2xl font-extrabold">
                      {membershipData?.nombre && membershipData?.apellido
                        ? `${membershipData.nombre} ${membershipData.apellido}`
                        : "Sin información"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">RUT</p>
                      <p className="text-white text-sm sm:text-xl font-bold truncate">
                        {membershipData?.rut || "Sin información"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Estado</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-base font-extrabold ${
                          membershipData?.estado === "Vigente"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {membershipData?.estado || "Sin datos"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Plan de Membresía</p>
                    <p className="text-white text-sm sm:text-xl font-bold truncate">
                      {membershipData?.plan || "Sin plan"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Vigencia</p>
                    <p className="text-white text-sm sm:text-xl font-bold truncate">
                      Hasta {membershipData?.fechaVencimiento || "N/A"}
                    </p>
                  </div>
                </div>

                {membershipData?.codigoQR && (
                  <div className="flex justify-center pt-4 border-t border-white/10">
                    <div className="bg-white p-4 rounded-xl">
                      <QrCodeQuickChart value={membershipData.codigoQR} size={180} />
                    </div>
                  </div>
                )}

                <div className="text-center pt-2">
                  <p className="text-[10px] text-zinc-400">Presenta esta credencial al ingresar al gimnasio</p>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}