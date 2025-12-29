"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getUser } from "@/lib/auth-client"
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Info,
  Play,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

interface Membresia {
  MembresíaID: number
  FechaInicio: string
  FechaFin: string
  Estado: string
  NombrePlan: string
  Descripcion: string
  Precio: number
  DuracionDias: number
  Beneficios: string
}

interface Plan {
  PlanID: number
  NombrePlan: string
  Descripcion: string
  Precio: number
  DuracionDias: number
  TipoPlan: string
  Beneficios: string
  Activo: boolean
}

interface SolicitudMembresia {
  SolicitudID: number
  TipoSolicitud: string
  MesesPausa: number | null
  MotivoCancelacion: string | null
  MotivoSolicitud: string | null
  Estado: string
  FechaSolicitud: string
  FechaRespuesta: string | null
  MotivoRechazo: string | null
  PlanNuevoID: number | null
  TipoCambio: string | null
}

const pageIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const cardIn = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { scale: 0.99 },
}

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(n || 0))
}

export default function SocioMembresiaPage() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [currentMembership, setCurrentMembership] = useState<Membresia | null>(null)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const [solicitudes, setSolicitudes] = useState<SolicitudMembresia[]>([])
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestType, setRequestType] = useState<
    "Pausar" | "Cancelar" | "Activar" | "Cambiar" | "Reanudar" | "Asignar" | null
  >(null)
  const [mesesPausa, setMesesPausa] = useState(1)
  const [motivoCancelacion, setMotivoCancelacion] = useState("")
  const [motivoSolicitud, setMotivoSolicitud] = useState("")
  const [tipoCambio, setTipoCambio] = useState<"Upgrade" | "Downgrade" | "Promocion" | "FuerzaMayor">("Upgrade")
  const [planNuevoID, setPlanNuevoID] = useState<number | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmedAction, setConfirmedAction] = useState<
    "Pausar" | "Cancelar" | "Activar" | "Cambiar" | "Reanudar" | "Asignar" | null
  >(null)

  const getAuthHeaders = () => {
    const user = getUser()
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getUser()
        if (!user?.socioID && !user?.usuarioID) return

        const socioID = user.socioID || user.usuarioID

        const membresiaResponse = await fetch(`/api/socio/membresia?socioID=${socioID}`)
        let membresiaActual = null
        if (membresiaResponse.ok) {
          membresiaActual = await membresiaResponse.json()
          setCurrentMembership(membresiaActual)
        }

        const planesResponse = await fetch("/api/admin/membresias")
        if (planesResponse.ok) {
          const planesData = await planesResponse.json()
          const activePlans = planesData.filter((p: Plan) => p.Activo)

          if (membresiaActual) {
            const currentPlanInActive = activePlans.some((p: Plan) => p.NombrePlan === membresiaActual.NombrePlan)
            if (!currentPlanInActive) {
              const currentPlan = planesData.find((p: Plan) => p.NombrePlan === membresiaActual.NombrePlan)
              if (currentPlan) {
                setPlanes([currentPlan, ...activePlans])
              } else {
                setPlanes(activePlans)
              }
            } else {
              setPlanes(activePlans)
            }
          } else {
            setPlanes(activePlans)
          }
        }

        const solicitudesResponse = await fetch("/api/socio/solicitudes", {
          headers: getAuthHeaders(),
        })
        if (solicitudesResponse.ok) {
          const solicitudesData = await solicitudesResponse.json()
          setSolicitudes(solicitudesData)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAcquirePlan = async () => {
    if (!selectedPlan) return

    try {
      const user = getUser()
      if (!user?.socioID && !user?.usuarioID) {
        alert("Error: No se pudo identificar al socio")
        return
      }

      const socioID = user.socioID || user.usuarioID
      const plan = planes.find((p) => p.PlanID === selectedPlan)
      if (!plan) return

      const response = await fetch("/api/socio/membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          planID: selectedPlan,
        }),
      })

      if (response.ok) {
        alert(`Membresía ${plan.NombrePlan} adquirida exitosamente!`)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Error al adquirir membresía")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al adquirir membresía")
    }
  }

  const handleOpenRequestDialog = (type: "Pausar" | "Cancelar" | "Activar" | "Cambiar" | "Reanudar" | "Asignar") => {
    setConfirmedAction(type)
    setShowConfirmDialog(true)
  }

  const handleConfirmAction = () => {
    setShowConfirmDialog(false)
    setRequestType(confirmedAction)
    setMesesPausa(1)
    setMotivoCancelacion("")
    setMotivoSolicitud("")
    setPlanNuevoID(null)
    setTipoCambio("Upgrade")
    setShowRequestDialog(true)
  }

  const handleCancelRequest = async (solicitudID: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta solicitud?")) return

    try {
      const response = await fetch(`/api/socio/solicitudes/${solicitudID}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        alert("Solicitud cancelada exitosamente")
        const solicitudesResponse = await fetch("/api/socio/solicitudes", {
          headers: getAuthHeaders(),
        })
        if (solicitudesResponse.ok) {
          const solicitudesData = await solicitudesResponse.json()
          setSolicitudes(solicitudesData)
        }
      } else {
        const error = await response.json()
        alert(error.error || "Error al cancelar solicitud")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cancelar solicitud")
    }
  }

  const handleSubmitRequest = async () => {
    if (!requestType) return

    if (requestType === "Cancelar" && !motivoCancelacion.trim()) {
      alert("Debe especificar un motivo de cancelación")
      return
    }

    if ((requestType === "Cambiar" || requestType === "Asignar") && !planNuevoID) {
      alert("Debe seleccionar un plan")
      return
    }

    try {
      const payload = {
        tipoSolicitud: requestType,
        mesesPausa: requestType === "Pausar" ? mesesPausa : null,
        motivoCancelacion: requestType === "Cancelar" ? motivoCancelacion : null,
        motivoSolicitud,
        planNuevoID: requestType === "Cambiar" || requestType === "Asignar" ? planNuevoID : null,
        tipoCambio: requestType === "Cambiar" ? tipoCambio : null,
      }

      const response = await fetch("/api/socio/solicitudes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert("Solicitud enviada exitosamente. El administrador la revisará pronto.")
        setShowRequestDialog(false)
        const solicitudesResponse = await fetch("/api/socio/solicitudes", {
          headers: getAuthHeaders(),
        })
        if (solicitudesResponse.ok) {
          const solicitudesData = await solicitudesResponse.json()
          setSolicitudes(solicitudesData)
        }
      } else {
        const error = await response.json()
        alert(error.error || "Error al enviar solicitud")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al enviar solicitud")
    }
  }

  const hasPendingRequest = (type: string) => {
    return solicitudes.some((s) => s.TipoSolicitud === type && s.Estado === "Pendiente")
  }

  const getCancelacionCondiciones = (tipoPlan: string) => {
    const tipo = tipoPlan.toLowerCase()

    if (tipo.includes("mensual")) {
      return {
        puedeCancel: "Sí",
        seguirPagando: "No (mes siguiente)",
        devolucion: "No",
        info: "Tu membresía mensual finalizará al término del mes actual. No habrá cobros adicionales y no se realizarán devoluciones.",
      }
    } else if (tipo.includes("semestral") || tipo.includes("trimestral")) {
      return {
        puedeCancel: "Sí, con condiciones",
        seguirPagando: "Puede aplicar multa",
        devolucion: "No",
        info: "La cancelación de membresías semestrales/trimestrales puede estar sujeta a penalizaciones según el reglamento. No se realizarán devoluciones del monto pagado.",
      }
    } else if (tipo.includes("anual")) {
      return {
        puedeCancel: "Sí, con penalización",
        seguirPagando: "Sí o multa aplicable",
        devolucion: "No",
        info: "Las membresías anuales tienen restricciones para cancelación. Podrían aplicar cobros pendientes o multas. No se realizarán devoluciones.",
      }
    } else if (tipo.includes("promocion") || tipo.includes("promo")) {
      return {
        puedeCancel: "Generalmente no",
        seguirPagando: "Sí",
        devolucion: "No",
        info: "Las membresías promocionales generalmente no permiten cancelación anticipada. Los pagos comprometidos continuarán según lo acordado.",
      }
    } else {
      return {
        puedeCancel: "Verificar con administración",
        seguirPagando: "Por confirmar",
        devolucion: "No",
        info: "Las condiciones de cancelación variarán según tu plan específico. El administrador revisará tu caso.",
      }
    }
  }

  const selectedPlanName = useMemo(() => {
    if (!selectedPlan) return null
    return planes.find((p) => p.PlanID === selectedPlan)?.NombrePlan ?? null
  }, [planes, selectedPlan])

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-red-500/30 border-t-red-600 animate-spin" />
            <p className="text-muted-foreground text-sm sm:text-base">Cargando tu membresía...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <motion.div {...pageIn} className="space-y-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-red-600 via-red-700 to-zinc-900 text-white">
          <div className="absolute inset-0 opacity-25">
            <Image
              src="/images/gym-hero.jpg"
              alt="Mundo Fitness"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="relative p-5 sm:p-7 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  Mi Membresía
                </h1>
                <p className="mt-1 text-white/80 text-sm sm:text-base">
                  Gestiona tu plan, solicita cambios y revisa tus solicitudes.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 border border-white/15">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold">Mundo Fitness</span>
              </div>
            </div>
          </div>
        </div>

        {/* MEMBRESÍA ACTUAL */}
        {currentMembership ? (
          <motion.div {...cardIn}>
            <Card className="relative overflow-hidden border bg-white/70 dark:bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-950/40">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />
                <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-zinc-500/10 blur-3xl dark:bg-zinc-400/10" />
              </div>

              <CardHeader className="relative border-b bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-2xl font-bold leading-tight">
                      Membresía Actual
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Tu plan vigente y acciones disponibles
                    </CardDescription>
                  </div>

                  <Badge
                    className={`shrink-0 text-xs sm:text-sm px-3 py-1 ${
                      currentMembership.Estado === "Vigente"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : currentMembership.Estado === "Suspendida"
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {currentMembership.Estado}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative pt-5 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="rounded-xl border bg-white/70 dark:bg-zinc-950/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Plan</p>
                    <p className="mt-1 text-lg sm:text-2xl font-extrabold leading-tight break-words">
                      {currentMembership.NombrePlan}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                      {currentMembership.Descripcion || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white/70 dark:bg-zinc-950/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Precio Pagado</p>
                    <p className="mt-1 text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCLP(currentMembership.Precio)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-3 border">
                        <p className="text-[11px] text-muted-foreground">Inicio</p>
                        <p className="text-xs sm:text-sm font-semibold">
                          {new Date(currentMembership.FechaInicio).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-3 border">
                        <p className="text-[11px] text-muted-foreground">Vence</p>
                        <p className="text-xs sm:text-sm font-semibold">
                          {new Date(currentMembership.FechaFin).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentMembership.Estado === "Vigente" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cambiar")}
                        disabled={hasPendingRequest("Cambiar")}
                        className="border-purple-300/70 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Cambiar") ? "Solicitud Enviada" : "Cambiar Membresía"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Pausar")}
                        disabled={hasPendingRequest("Pausar")}
                        className="border-amber-300/70 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Pausar") ? "Solicitud Enviada" : "Pausar"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cancelar")}
                        disabled={hasPendingRequest("Cancelar")}
                        className="border-red-300/70 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Cancelar") ? "Solicitud Enviada" : "Cancelar"}
                      </Button>
                    </>
                  )}

                  {currentMembership.Estado === "Suspendida" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Reanudar")}
                        disabled={hasPendingRequest("Reanudar")}
                        className="border-emerald-300/70 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Reanudar") ? "Solicitud Enviada" : "Reanudar"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cancelar")}
                        disabled={hasPendingRequest("Cancelar")}
                        className="border-red-300/70 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Cancelar") ? "Solicitud Enviada" : "Cancelar"}
                      </Button>
                    </>
                  )}

                  {currentMembership.Estado === "Cancelada" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRequestDialog("Asignar")}
                      disabled={hasPendingRequest("Asignar")}
                      className="border-blue-300/70 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {hasPendingRequest("Asignar") ? "Solicitud Enviada" : "Nueva Membresía"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div {...cardIn}>
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">No tienes una membresía activa</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SOLICITUDES */}
        {solicitudes.length > 0 && (
          <motion.div {...cardIn}>
            <Card className="border bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
              <CardHeader className="border-b bg-white/40 dark:bg-zinc-900/40 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-500/15 border border-purple-600/15 dark:border-purple-400/20">
                        <AlertCircle className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                      </span>
                      <span className="truncate">Mis Solicitudes</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Estado de tus solicitudes recientes
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 bg-purple-100/80 dark:bg-purple-500/10 text-purple-800 dark:text-purple-200 border-purple-300/70 dark:border-purple-400/25"
                  >
                    {solicitudes.filter((s) => s.Estado === "Pendiente").length} pendientes
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="grid gap-3">
                  {solicitudes.slice(0, 5).map((solicitud) => (
                    <motion.div
                      key={solicitud.SolicitudID}
                      {...hoverLift}
                      className={`relative overflow-hidden rounded-2xl border p-4 ${
                        solicitud.Estado === "Pendiente"
                          ? "bg-white/70 dark:bg-zinc-950/40 border-amber-300/60 dark:border-amber-500/25"
                          : solicitud.Estado === "Aprobada"
                            ? "bg-white/70 dark:bg-zinc-950/40 border-emerald-300/60 dark:border-emerald-500/25"
                            : "bg-white/70 dark:bg-zinc-950/40 border-red-300/60 dark:border-red-500/25"
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          solicitud.Estado === "Pendiente"
                            ? "bg-amber-500"
                            : solicitud.Estado === "Aprobada"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                        }`}
                      />

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate min-w-0">
                              {solicitud.TipoSolicitud}
                            </h3>

                            <Badge
                              className={`text-[11px] sm:text-xs font-semibold ${
                                solicitud.Estado === "Pendiente"
                                  ? "bg-amber-500 text-white hover:bg-amber-600"
                                  : solicitud.Estado === "Aprobada"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {solicitud.Estado}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(solicitud.FechaSolicitud).toLocaleDateString("es-CL", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {solicitud.Estado === "Rechazada" && solicitud.MotivoRechazo && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-200/70 dark:border-red-500/20 bg-red-50/70 dark:bg-red-950/25 p-3">
                              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300 mt-0.5 shrink-0" />
                              <p className="text-[11px] sm:text-xs text-red-800 dark:text-red-200 break-words">
                                {solicitud.MotivoRechazo}
                              </p>
                            </div>
                          )}
                        </div>

                        {solicitud.Estado === "Pendiente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelRequest(solicitud.SolicitudID)}
                            className="shrink-0 h-9 w-9 p-0 rounded-xl text-red-600 dark:text-red-300 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40"
                            title="Cancelar solicitud"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PLANES */}
        <motion.div {...cardIn} className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">Planes Disponibles</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {currentMembership ? "Selecciona un nuevo plan para actualizar tu membresía" : "Selecciona un plan"}
              </p>
            </div>

            {selectedPlanName && (
              <Badge className="hidden sm:inline-flex bg-red-600 text-white">
                Seleccionado: <span className="ml-1 max-w-[220px] truncate">{selectedPlanName}</span>
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planes.map((plan) => {
              const beneficios = plan.Beneficios ? plan.Beneficios.split(",") : []
              const isCurrentPlan = currentMembership?.NombrePlan === plan.NombrePlan
              const isPromotion =
                plan.TipoPlan?.toLowerCase().includes("promo") || plan.TipoPlan?.toLowerCase().includes("oferta")

              return (
                <motion.div key={plan.PlanID} {...hoverLift}>
                  <Card
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      selectedPlan === plan.PlanID ? "ring-2 ring-red-500/60 border-red-400" : ""
                    } ${isCurrentPlan ? "opacity-60 cursor-not-allowed" : ""} ${
                      isPromotion
                        ? "border-orange-300/70 dark:border-orange-500/25 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20"
                        : "bg-white/70 dark:bg-zinc-950/50"
                    }`}
                    onClick={() => !isCurrentPlan && setSelectedPlan(plan.PlanID)}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-emerald-600 text-white text-[11px] font-extrabold py-1 px-3 rounded-full shadow-md">
                          ACTUAL
                        </span>
                      </div>
                    )}

                    {isPromotion && !isCurrentPlan && (
                      <div className="absolute top-2 left-4 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-extrabold shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1" />
                          OFERTA
                        </Badge>
                      </div>
                    )}

                    <CardHeader className={`${isPromotion ? "bg-white/50 dark:bg-zinc-900/30" : ""}`}>
                      {/* Fix overflow: min-w-0 + truncate */}
                      <CardTitle className="text-center text-base sm:text-xl font-extrabold leading-tight min-w-0 truncate">
                        {plan.NombrePlan}
                      </CardTitle>
                      <CardDescription className="text-center text-xs sm:text-sm">
                        {plan.DuracionDias} días
                      </CardDescription>
                    </CardHeader>

                    <CardContent className={`${isPromotion ? "bg-white/30 dark:bg-zinc-900/20" : ""}`}>
                      <div className="text-center mb-4">
                        {isPromotion ? (
                          <div className="space-y-1">
                            <p className="text-sm sm:text-base line-through text-zinc-400 dark:text-zinc-500 font-semibold">
                              {formatCLP(Math.round(plan.Precio * 1.15))}
                            </p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-orange-700 dark:text-orange-300">
                              {formatCLP(plan.Precio)}
                            </p>
                            <p className="text-[11px] sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                              -15% OFF
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                            {formatCLP(plan.Precio)}
                          </p>
                        )}
                      </div>

                      {/* Descripción (evita desbordes) */}
                      {plan.Descripcion && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 break-words line-clamp-2">
                          {plan.Descripcion}
                        </p>
                      )}

                      {beneficios.length > 0 && (
                        <ul className="space-y-2">
                          {beneficios.map((beneficio, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs sm:text-sm min-w-0">
                              <Check
                                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                  isPromotion ? "text-orange-700 dark:text-orange-300" : "text-emerald-700 dark:text-emerald-300"
                                }`}
                              />
                              <span className="text-zinc-700 dark:text-zinc-200 break-words min-w-0">
                                {beneficio.trim()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          <AnimatePresence>
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 flex justify-center"
              >
                <Button
                  size="lg"
                  onClick={handleAcquirePlan}
                  className="font-extrabold bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {currentMembership ? "Cambiar a" : "Adquirir"}{" "}
                  <span className="ml-1 truncate max-w-[220px] inline-block align-bottom">
                    {planes.find((p) => p.PlanID === selectedPlan)?.NombrePlan}
                  </span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CONFIRM DIALOG */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Confirmar Solicitud de {confirmedAction}
              </DialogTitle>
              <DialogDescription>Lee atentamente las condiciones antes de continuar</DialogDescription>
            </DialogHeader>

            {confirmedAction === "Pausar" && currentMembership && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20">
                  <h4 className="font-extrabold text-sm mb-2 text-amber-900 dark:text-amber-200">
                    Suspensión de Membresía
                  </h4>
                  <ul className="text-sm space-y-2 text-amber-900/90 dark:text-amber-100/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Puedes pausar entre 1 y 3 meses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>No podrás usar las instalaciones durante la pausa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Tu fecha de vencimiento se extenderá proporcionalmente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>No habrá devolución de dinero</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {confirmedAction === "Cancelar" && currentMembership && (
              <div className="space-y-4">
                {(() => {
                  const condiciones = getCancelacionCondiciones(currentMembership.NombrePlan)
                  return (
                    <>
                      <div className="rounded-xl p-4 border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-950/20">
                        <h4 className="font-extrabold text-sm mb-3 text-red-900 dark:text-red-200">
                          Condiciones de Cancelación - {currentMembership.NombrePlan}
                        </h4>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center rounded-lg bg-white/60 dark:bg-zinc-900/50 border p-2">
                            <p className="text-[11px] text-red-700 dark:text-red-200 mb-1">¿Se puede?</p>
                            <p className="text-xs sm:text-sm font-extrabold text-red-900 dark:text-red-100">
                              {condiciones.puedeCancel}
                            </p>
                          </div>
                          <div className="text-center rounded-lg bg-white/60 dark:bg-zinc-900/50 border p-2">
                            <p className="text-[11px] text-red-700 dark:text-red-200 mb-1">¿Seguir pagando?</p>
                            <p className="text-xs sm:text-sm font-extrabold text-red-900 dark:text-red-100">
                              {condiciones.seguirPagando}
                            </p>
                          </div>
                          <div className="text-center rounded-lg bg-white/60 dark:bg-zinc-900/50 border p-2">
                            <p className="text-[11px] text-red-700 dark:text-red-200 mb-1">¿Devolución?</p>
                            <p className="text-xs sm:text-sm font-extrabold text-red-900 dark:text-red-100">
                              {condiciones.devolucion}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg p-3 border bg-white/70 dark:bg-zinc-900/50">
                          <p className="text-xs sm:text-sm text-red-800 dark:text-red-100 break-words">
                            {condiciones.info}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                        <p className="text-sm text-muted-foreground">
                          Tu membresía:{" "}
                          <span className="font-extrabold text-foreground">{currentMembership.NombrePlan}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pagaste:{" "}
                          <span className="font-extrabold text-foreground">
                            {formatCLP(currentMembership.Precio)}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl p-3 border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20">
                        <p className="text-sm text-amber-900 dark:text-amber-100 font-semibold flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          Esta acción es definitiva y puede tener consecuencias financieras
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {confirmedAction === "Activar" && currentMembership && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <h4 className="font-extrabold text-sm mb-2 text-emerald-900 dark:text-emerald-200">
                    Reactivación de Membresía
                  </h4>
                  <ul className="text-sm space-y-2 text-emerald-900/90 dark:text-emerald-100/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Podrás volver a usar todas las instalaciones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Tu fecha de vencimiento continuará desde donde se pausó</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>No habrá cargos adicionales por reactivar</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                  <p className="text-sm text-muted-foreground">
                    Tu membresía:{" "}
                    <span className="font-extrabold text-foreground">{currentMembership.NombrePlan}</span>
                  </p>
                </div>
              </div>
            )}

            {confirmedAction === "Cambiar" && currentMembership && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-950/20">
                  <h4 className="font-extrabold text-sm mb-3 text-purple-900 dark:text-purple-200">
                    Condiciones de Cambio de Membresía
                  </h4>

                  <div className="space-y-3">
                    <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                      <p className="font-extrabold text-xs text-purple-900 dark:text-purple-200 mb-2">
                        Upgrade (Mejorar Plan)
                      </p>
                      <ul className="text-xs space-y-1 text-purple-900/90 dark:text-purple-100/90">
                        <li className="flex items-start gap-2">
                          <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Permitido - Podrás mejorar tu plan actual</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Se aplicará prorrateo del monto pagado</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                      <p className="font-extrabold text-xs text-purple-900 dark:text-purple-200 mb-2">
                        Downgrade (Reducir Plan)
                      </p>
                      <ul className="text-xs space-y-1 text-purple-900/90 dark:text-purple-100/90">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-600" />
                          <span>Limitado - Sujeto a aprobación</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                          <span className="font-semibold">No habrá devolución de diferencia</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                      <p className="font-extrabold text-xs text-purple-900 dark:text-purple-200 mb-2">
                        Cambio en Promoción
                      </p>
                      <ul className="text-xs space-y-1 text-purple-900/90 dark:text-purple-100/90">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                          <span>Restrictivo - Condiciones especiales aplican</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Puede perder beneficios promocionales</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl p-3 border bg-white/70 dark:bg-zinc-950/40">
                      <p className="font-extrabold text-xs text-purple-900 dark:text-purple-200 mb-2">
                        Cambio por Fuerza Mayor
                      </p>
                      <ul className="text-xs space-y-1 text-purple-900/90 dark:text-purple-100/90">
                        <li className="flex items-start gap-2">
                          <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-600" />
                          <span>Permitido - Sin penalización (requiere justificación)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {confirmedAction === "Reanudar" && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <h4 className="font-extrabold text-sm mb-2 text-emerald-900 dark:text-emerald-200">
                    Reanudación de Membresía
                  </h4>
                  <ul className="text-sm space-y-2 text-emerald-900/90 dark:text-emerald-100/90">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Tu membresía volverá al estado Vigente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Podrás volver a usar las instalaciones del gimnasio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>La fecha de vencimiento se mantendrá según el tiempo de pausa</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {confirmedAction === "Asignar" && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/20">
                  <h4 className="font-extrabold text-sm mb-2 text-blue-900 dark:text-blue-200">
                    Asignación de Nueva Membresía
                  </h4>
                  <ul className="text-sm space-y-2 text-blue-900/90 dark:text-blue-100/90">
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Se te asignará una nueva membresía desde cero</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Podrás seleccionar el plan que desees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Deberás coordinar el pago con el administrador</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                className={
                  confirmedAction === "Cancelar" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }
              >
                {confirmedAction === "Cancelar" ? "Entiendo, Continuar" : "Continuar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* REQUEST DIALOG */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitud de {requestType}</DialogTitle>
              <DialogDescription>Completa los detalles de tu solicitud</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {requestType === "Pausar" && (
                <div className="space-y-2">
                  <Label>Duración de la pausa</Label>
                  <Select value={mesesPausa.toString()} onValueChange={(v) => setMesesPausa(Number.parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mes</SelectItem>
                      <SelectItem value="2">2 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requestType === "Cambiar" && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de cambio</Label>
                    <Select value={tipoCambio} onValueChange={(v: any) => setTipoCambio(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Upgrade">Upgrade (Mejorar)</SelectItem>
                        <SelectItem value="Downgrade">Downgrade (Reducir)</SelectItem>
                        <SelectItem value="Promocion">Cambio en Promoción</SelectItem>
                        <SelectItem value="FuerzaMayor">Fuerza Mayor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nuevo plan deseado</Label>
                    <Select value={planNuevoID?.toString() || ""} onValueChange={(v) => setPlanNuevoID(Number.parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planes
                          .filter((p) => p.NombrePlan !== currentMembership?.NombrePlan)
                          .map((plan) => (
                            <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                              <span className="truncate inline-block max-w-[260px] align-bottom">
                                {plan.NombrePlan}
                              </span>{" "}
                              - {formatCLP(plan.Precio)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {requestType === "Asignar" && (
                <div className="space-y-2">
                  <Label>Plan a asignar</Label>
                  <Select value={planNuevoID?.toString() || ""} onValueChange={(v) => setPlanNuevoID(Number.parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                          <span className="truncate inline-block max-w-[260px] align-bottom">{plan.NombrePlan}</span>{" "}
                          - {formatCLP(plan.Precio)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requestType === "Cancelar" && (
                <div className="space-y-2">
                  <Label>Motivo de cancelación *</Label>
                  <Select value={motivoCancelacion} onValueChange={setMotivoCancelacion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Problemas económicos">Problemas económicos</SelectItem>
                      <SelectItem value="Cambio de residencia">Cambio de residencia</SelectItem>
                      <SelectItem value="Problemas de salud">Problemas de salud</SelectItem>
                      <SelectItem value="Insatisfacción con el servicio">Insatisfacción con el servicio</SelectItem>
                      <SelectItem value="Falta de tiempo">Falta de tiempo</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Comentarios adicionales (opcional)</Label>
                <Textarea
                  value={motivoSolicitud}
                  onChange={(e) => setMotivoSolicitud(e.target.value)}
                  placeholder="Agrega cualquier información adicional..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitRequest} className="bg-red-600 hover:bg-red-700">
                  Enviar Solicitud
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  )
}