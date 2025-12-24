"use client"

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
import Link from "next/link"
import { useEffect, useState } from "react"

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

          const mappedData = {
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
          const dayOfWeek = now.getDay()
          const currentTime = now.getHours() * 60 + now.getMinutes()

          const todaySchedule = horariosData.find((h: any) => h.DiaSemana === dayOfWeek)
          if (todaySchedule && !todaySchedule.Cerrado) {
            const [openHour, openMin] = todaySchedule.HoraApertura.split(":").map(Number)
            const [closeHour, closeMin] = todaySchedule.HoraCierre.split(":").map(Number)
            const openTime = openHour * 60 + openMin
            const closeTime = closeHour * 60 + closeMin

            setIsGymOpen(currentTime >= openTime && currentTime <= closeTime)
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

  const stats = {
    asistenciasMes: 18,
    proximaSesion: "2025-01-22 11:00",
    clasesReservadas: 3,
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Dumbbell className="h-12 w-12 text-gray-600 animate-pulse" />
            <p className="text-muted-foreground">Cargando tu información...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="relative overflow-hidden rounded-xl bg-slate-800 p-4 sm:p-8 mb-6 sm:mb-8 shadow-lg border border-slate-700">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Hola, {membershipData?.nombre}!
            </h1>
            <p className="text-slate-300 text-base sm:text-lg">Bienvenido a Mundo Fitness Chimbarongo</p>
            <div className="flex items-center gap-2 mt-4">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-sm sm:text-base text-white font-medium">
                Gimnasio {isGymOpen ? "ABIERTO" : "CERRADO"} ahora
              </span>
              <div
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${isGymOpen ? "bg-emerald-400" : "bg-slate-400"} animate-pulse`}
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-lg bg-slate-700 border border-slate-600 mb-2">
                <Flame className="h-10 w-10 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.asistenciasMes}</p>
              <p className="text-xs text-slate-300 uppercase tracking-wide">Entrenamientos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-lg bg-slate-700 border border-slate-600 mb-2">
                <Target className="h-10 w-10 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.clasesReservadas}</p>
              <p className="text-xs text-slate-300 uppercase tracking-wide">Clases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="border border-slate-200 shadow-lg overflow-hidden">
            <div className="h-1 bg-red-600" />
            <CardHeader className="bg-slate-50 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl text-slate-900">
                  <div className="p-1.5 sm:p-2 bg-red-600 rounded-lg shadow-sm">
                    <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Tu Membresía
                </CardTitle>
                <Badge
                  variant={membershipData?.estado === "Vigente" ? "default" : "destructive"}
                  className="text-xs sm:text-sm px-2 sm:px-4 py-1"
                >
                  {membershipData?.estado || "Sin datos"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 bg-white p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-100 border border-slate-300">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium mb-1">Plan Actual</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{membershipData?.plan || "Sin plan"}</p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-red-50 border border-red-300">
                  <p className="text-xs sm:text-sm text-red-700 font-medium mb-1">Vence</p>
                  <p className="text-base sm:text-lg font-bold text-red-900">
                    {membershipData?.fechaVencimiento || "N/A"}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-emerald-50 border border-emerald-300">
                  <p className="text-xs sm:text-sm text-emerald-700 font-medium mb-1">Días Restantes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                    {membershipData?.diasRestantes !== undefined ? membershipData.diasRestantes : "-"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/socio/membresia" className="flex-1">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-base sm:text-lg py-4 sm:py-6 shadow-md hover:shadow-lg transition-all">
                    Ver Detalles Completos
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowCredencial(true)}
                  className="w-full sm:w-auto px-4 sm:px-8 py-4 sm:py-6 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  <IdCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Mi Credencial QR
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link href="/socio/entrenadores">
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-slate-200 hover:border-red-400 group bg-white">
                <CardContent className="p-4 sm:pt-6 flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-red-600 rounded-lg group-hover:bg-red-700 transition-all shadow-sm">
                    <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-red-600 transition-colors">
                      Agendar Sesión
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">Con entrenador personal</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/socio/pagos">
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-slate-200 hover:border-slate-400 group bg-white">
                <CardContent className="p-4 sm:pt-6 flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-slate-700 rounded-lg group-hover:bg-slate-800 transition-all shadow-sm">
                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-slate-700 transition-colors">
                      Realizar Pago
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">Renueva tu membresía</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="shadow-md border border-slate-200 bg-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-xl text-slate-900">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Tus Próximas Actividades
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Sesiones y clases programadas</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-lg bg-white hover:border-red-300 hover:bg-red-50/50 transition-all">
                  <div className="flex flex-col items-center justify-center bg-red-600 text-white rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] shadow-sm">
                    <span className="text-xl sm:text-2xl font-bold">22</span>
                    <span className="text-xs">ENE</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg text-slate-900">Sesión Personal</p>
                    <p className="text-xs sm:text-sm text-slate-600">11:00 AM - Con Pedro Martínez</p>
                  </div>
                  <Badge className="bg-red-600 hover:bg-red-700 text-xs hidden sm:inline-flex">Confirmada</Badge>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <div className="flex flex-col items-center justify-center bg-slate-700 text-white rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] shadow-sm">
                    <span className="text-xl sm:text-2xl font-bold">23</span>
                    <span className="text-xs">ENE</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg text-slate-900">Clase Funcional</p>
                    <p className="text-xs sm:text-sm text-slate-600">6:00 PM - Grupal</p>
                  </div>
                  <Badge className="bg-slate-700 hover:bg-slate-800 text-xs hidden sm:inline-flex">Reservada</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border border-slate-200 shadow-lg lg:sticky lg:top-4 bg-white">
            <div className="h-1 bg-red-600" />
            <CardHeader className="bg-slate-50 pb-3 p-4 sm:p-6 sm:pb-3">
              <CardTitle className="text-slate-900 text-lg sm:text-xl">Mundo Fitness</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-xs sm:text-sm">
                Información de Contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 p-4 sm:p-6 sm:pt-4">
              <a
                href="https://www.instagram.com/mundofitness_chimbarongo?igsh=MXByeW51ZjNxejU3eA=="
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-all group"
              >
                <div className="p-2 bg-pink-600 rounded-lg shadow-sm">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-pink-600">Instagram</p>
                  <p className="text-xs text-slate-600 truncate">@mundofitness_chimbarongo</p>
                </div>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 group-hover:text-pink-600" />
              </a>

              <a
                href="https://maps.app.goo.gl/JAzpwyHFAyoPToLE7?g_st=aw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all group"
              >
                <div className="p-2 bg-teal-600 rounded-lg shadow-sm">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-600">Ubicación</p>
                  <p className="text-xs text-slate-600">Chimbarongo, Chile</p>
                </div>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 group-hover:text-teal-600" />
              </a>

              <a
                href="mailto:mundofitnesschimbarongo08@gmail.com"
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
              >
                <div className="p-2 bg-slate-700 rounded-lg shadow-sm">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-700">Email</p>
                  <p className="text-xs text-slate-600 truncate">mundofitness...@gmail.com</p>
                </div>
              </a>

              <Link href="/socio/horarios" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium transition-all bg-transparent text-xs sm:text-sm py-4 sm:py-5"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Ver Horarios
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {avisosNoLeidos > 0 && (
        <button
          onClick={() => {
            setShowAvisosModal(true)
            marcarAvisosLeidos()
          }}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 sm:px-6 py-3 sm:py-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-50 group flex items-center gap-2 sm:gap-3 font-semibold border border-red-700"
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-sm sm:text-base">Avisos</span>
          <Badge className="bg-white text-red-600 border-2 border-red-600 text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 font-bold">
            {avisosNoLeidos}
          </Badge>
        </button>
      )}

      <Dialog open={showAvisosModal} onOpenChange={setShowAvisosModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Bell className="h-5 w-5 text-blue-600" />
              Avisos del Gimnasio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {avisos.length > 0 ? (
              avisos.map((aviso) => (
                <Card key={aviso.AvisoID} className="border-l-4 border-l-blue-500 border border-slate-200">
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
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{aviso.Mensaje}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay avisos disponibles</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCredencial} onOpenChange={setShowCredencial}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none">
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-xl shadow-2xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-red-600 to-red-800 relative">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative h-full flex items-center px-6">
                <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">CREDENCIAL DE SOCIO</h2>
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
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-red-600 shadow-lg">
                  {membershipData?.fotoURL ? (
                    <img
                      src={membershipData.fotoURL || "/placeholder.svg"}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-zinc-400 text-4xl font-bold">
                        {membershipData?.nombre?.[0]}
                        {membershipData?.apellido?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                  <p className="text-white text-xl sm:text-2xl font-semibold">
                    {membershipData?.nombre && membershipData?.apellido
                      ? `${membershipData.nombre} ${membershipData.apellido}`
                      : "Sin información"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">RUT</p>
                    <p className="text-white text-lg sm:text-xl font-medium">
                      {membershipData?.rut || "Sin información"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Estado</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm sm:text-base font-semibold ${
                        membershipData?.estado === "Vigente"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {membershipData?.estado || "Sin datos"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Plan de Membresía</p>
                  <p className="text-white text-lg sm:text-xl font-medium">{membershipData?.plan || "Sin plan"}</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Vigencia</p>
                  <p className="text-white text-lg sm:text-xl font-medium">
                    Hasta {membershipData?.fechaVencimiento || "N/A"}
                  </p>
                </div>
              </div>

              {membershipData?.codigoQR && (
                <div className="flex justify-center pt-4 border-t border-zinc-700">
                  <div className="bg-white p-4 rounded-lg">
                    <QrCodeQuickChart value={membershipData.codigoQR} size={180} />
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-xs text-zinc-500">Presenta esta credencial al ingresar al gimnasio</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
