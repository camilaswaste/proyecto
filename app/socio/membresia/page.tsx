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
import { useEffect, useState } from "react"

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
  // Nuevos estados para los nuevos tipos de solicitud
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
            // Si el socio tiene membresía, incluir su plan actual aunque esté inactivo
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

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando membresía...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Membresía</h1>
          <p className="text-muted-foreground">Gestiona tu plan de membresía</p>
        </div>

        {currentMembership ? (
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
            <div className="relative">
              <CardHeader className="border-b bg-muted/50 dark:bg-muted/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Membresía Actual</CardTitle>
                    <CardDescription>Tu plan vigente</CardDescription>
                  </div>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      currentMembership.Estado === "Vigente"
                        ? "bg-green-500 hover:bg-green-600"
                        : currentMembership.Estado === "Suspendida"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {currentMembership.Estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 bg-muted/30 dark:bg-muted/10 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {currentMembership.NombrePlan}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Precio Pagado</p>
                    <p className="text-2xl font-bold text-green-600">${currentMembership.Precio.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                    <p className="font-semibold">{new Date(currentMembership.FechaInicio).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</p>
                    <p className="font-semibold">{new Date(currentMembership.FechaFin).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {currentMembership.Estado === "Vigente" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cambiar")}
                        disabled={hasPendingRequest("Cambiar")}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 font-medium"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Cambiar") ? "Solicitud Enviada" : "Cambiar Membresía"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Pausar")}
                        disabled={hasPendingRequest("Pausar")}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 font-medium"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Pausar") ? "Solicitud Enviada" : "Pausar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cancelar")}
                        disabled={hasPendingRequest("Cancelar")}
                        className="text-red-600 border-red-300 hover:bg-red-50 font-medium"
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
                        className="text-green-600 border-green-300 hover:bg-green-50 font-medium"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {hasPendingRequest("Reanudar") ? "Solicitud Enviada" : "Reanudar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestDialog("Cancelar")}
                        disabled={hasPendingRequest("Cancelar")}
                        className="text-red-600 border-red-300 hover:bg-red-50 font-medium"
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
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {hasPendingRequest("Asignar") ? "Solicitud Enviada" : "Nueva Membresía"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No tienes una membresía activa</p>
            </CardContent>
          </Card>
        )}

        {solicitudes.length > 0 && (
          <Card className="border-purple-200 dark:border-purple-900 shadow-lg bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <CardHeader className="pb-4 border-b border-purple-100 dark:border-purple-900">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Mis Solicitudes
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                >
                  {solicitudes.filter((s) => s.Estado === "Pendiente").length} pendientes
                </Badge>
              </div>
              <CardDescription className="text-sm mt-2">Estado de tus solicitudes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3">
                {solicitudes.slice(0, 5).map((solicitud) => (
                  <div
                    key={solicitud.SolicitudID}
                    className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                      solicitud.Estado === "Pendiente"
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
                        : solicitud.Estado === "Aprobada"
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                          : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                    }`}
                  >
                    {/* Left accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        solicitud.Estado === "Pendiente"
                          ? "bg-amber-400"
                          : solicitud.Estado === "Aprobada"
                            ? "bg-green-400"
                            : "bg-red-400"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-gray-800">{solicitud.TipoSolicitud}</h3>
                          <Badge
                            className={`text-xs font-semibold ${
                              solicitud.Estado === "Pendiente"
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : solicitud.Estado === "Aprobada"
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {solicitud.Estado}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(solicitud.FechaSolicitud).toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {solicitud.Estado === "Rechazada" && solicitud.MotivoRechazo && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-red-100 rounded-md border border-red-200 dark:border-red-900">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700">{solicitud.MotivoRechazo}</p>
                          </div>
                        )}
                      </div>

                      {solicitud.Estado === "Pendiente" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelRequest(solicitud.SolicitudID)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 shrink-0 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Planes Disponibles</h2>
          <p className="text-muted-foreground mb-6">
            {currentMembership ? "Selecciona un nuevo plan para actualizar tu membresía" : "Selecciona un plan"}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planes.map((plan) => {
              const beneficios = plan.Beneficios ? plan.Beneficios.split(",") : []
              const isCurrentPlan = currentMembership?.NombrePlan === plan.NombrePlan
              const isPromotion =
                plan.TipoPlan?.toLowerCase().includes("promo") || plan.TipoPlan?.toLowerCase().includes("oferta")

              return (
                <Card
                  key={plan.PlanID}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlan === plan.PlanID ? "border-primary shadow-lg ring-2 ring-primary/50" : ""
                  } ${isCurrentPlan ? "opacity-60" : ""} ${
                    isPromotion
                      ? "border-orange-300 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950"
                      : "dark:bg-card"
                  }`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.PlanID)}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full shadow-md">
                        ACTUAL
                      </span>
                    </div>
                  )}

                  {isPromotion && !isCurrentPlan && (
                    <div className="absolute -top-3 left-4 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 text-white font-bold shadow-lg">
                        <Sparkles className="h-3 w-3 mr-1" />
                        OFERTA
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={isPromotion ? "bg-muted/50 dark:bg-muted/20" : ""}>
                    <CardTitle className="text-center text-xl">{plan.NombrePlan}</CardTitle>
                    <CardDescription className="text-center">{plan.DuracionDias} días</CardDescription>
                  </CardHeader>
                  <CardContent className={isPromotion ? "bg-muted/30 dark:bg-muted/10" : ""}>
                    <div className="text-center mb-4">
                      {isPromotion ? (
                        <div className="space-y-1">
                          <p className="text-xl line-through text-gray-400 dark:text-gray-600 font-medium">
                            ${Math.round(plan.Precio * 1.15).toLocaleString()}
                          </p>
                          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            ${plan.Precio.toLocaleString()}
                          </p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">-15% OFF</p>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          ${plan.Precio.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {beneficios.length > 0 && (
                      <ul className="space-y-2">
                        {beneficios.map((beneficio, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check
                              className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isPromotion ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{beneficio.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedPlan && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleAcquirePlan} className="font-semibold">
                <CreditCard className="h-4 w-4 mr-2" />
                {currentMembership ? "Cambiar a" : "Adquirir"}{" "}
                {planes.find((p) => p.PlanID === selectedPlan)?.NombrePlan}
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Confirmar Solicitud de {confirmedAction}
              </DialogTitle>
              <DialogDescription>Lee atentamente las condiciones antes de continuar</DialogDescription>
            </DialogHeader>

            {confirmedAction === "Pausar" && currentMembership && (
              <div className="space-y-4">
                <div className="bg-card dark:bg-card rounded p-4 border border-orange-200 dark:border-orange-900">
                  <h4 className="font-semibold text-sm mb-2 text-orange-900">Suspensión de Membresía</h4>
                  <ul className="text-sm space-y-2 text-orange-800">
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
                      <div className="bg-card dark:bg-card border border-red-100 dark:border-red-900 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3 text-red-900">
                          Condiciones de Cancelación - {currentMembership.NombrePlan}
                        </h4>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-red-700 mb-1">¿Se puede cancelar?</p>
                            <p className="text-sm font-semibold text-red-900">{condiciones.puedeCancel}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-red-700 mb-1">¿Seguir pagando?</p>
                            <p className="text-sm font-semibold text-red-900">{condiciones.seguirPagando}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-red-700 mb-1">¿Hay devolución?</p>
                            <p className="text-sm font-semibold text-red-900">{condiciones.devolucion}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded p-3 border border-red-100 dark:border-red-900">
                          <p className="text-sm text-red-800">{condiciones.info}</p>
                        </div>
                      </div>

                      <div className="bg-card dark:bg-card p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Tu membresía:{" "}
                          <span className="font-semibold text-foreground">{currentMembership.NombrePlan}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pagaste:{" "}
                          <span className="font-semibold text-foreground">
                            ${currentMembership.Precio.toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <div className="bg-card dark:bg-card rounded-lg p-3 border border-orange-100 dark:border-orange-900">
                        <p className="text-sm text-orange-800 font-medium flex items-start gap-2">
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
                <div className="bg-card dark:bg-card border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-green-900">Reactivación de Membresía</h4>
                  <ul className="text-sm space-y-2 text-green-800">
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

                <div className="bg-card dark:bg-card p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Tu membresía: <span className="font-semibold text-foreground">{currentMembership.NombrePlan}</span>
                  </p>
                </div>
              </div>
            )}

            {confirmedAction === "Cambiar" && currentMembership && (
              <div className="space-y-4">
                <div className="bg-card dark:bg-card border border-purple-200 dark:border-purple-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3 text-purple-900">Condiciones de Cambio de Membresía</h4>

                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-purple-100 dark:border-purple-900">
                      <p className="font-semibold text-xs text-purple-900 mb-2">Upgrade (Mejorar Plan)</p>
                      <ul className="text-xs space-y-1 text-purple-800">
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

                    <div className="bg-white rounded-lg p-3 border border-purple-100 dark:border-purple-900">
                      <p className="font-semibold text-xs text-purple-900 mb-2">Downgrade (Reducir Plan)</p>
                      <ul className="text-xs space-y-1 text-purple-800">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-orange-600" />
                          <span>Limitado - Sujeto a aprobación</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                          <span className="font-medium">No habrá devolución de diferencia</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-purple-100 dark:border-purple-900">
                      <p className="font-semibold text-xs text-purple-900 mb-2">Cambio en Promoción</p>
                      <ul className="text-xs space-y-1 text-purple-800">
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

                    <div className="bg-white rounded-lg p-3 border border-purple-100 dark:border-purple-900">
                      <p className="font-semibold text-xs text-purple-900 mb-2">Cambio por Fuerza Mayor</p>
                      <ul className="text-xs space-y-1 text-purple-800">
                        <li className="flex items-start gap-2">
                          <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
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
                <div className="bg-card dark:bg-card border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-green-900">Reanudación de Membresía</h4>
                  <ul className="text-sm space-y-2 text-green-800">
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
                <div className="bg-card dark:bg-card border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900">Asignación de Nueva Membresía</h4>
                  <ul className="text-sm space-y-2 text-blue-800">
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
                  confirmedAction === "Cancelar" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }
              >
                {confirmedAction === "Cancelar" ? "Entiendo, Continuar" : "Continuar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitud de {requestType}</DialogTitle>
              <DialogDescription>Completa los detalles de tu solicitud</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {requestType === "Pausar" && (
                <div>
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
                  <div>
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

                  <div>
                    <Label>Nuevo plan deseado</Label>
                    <Select
                      value={planNuevoID?.toString() || ""}
                      onValueChange={(v) => setPlanNuevoID(Number.parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planes
                          .filter((p) => p.NombrePlan !== currentMembership?.NombrePlan)
                          .map((plan) => (
                            <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                              {plan.NombrePlan} - ${plan.Precio.toLocaleString()}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {requestType === "Asignar" && (
                <div>
                  <Label>Plan a asignar</Label>
                  <Select
                    value={planNuevoID?.toString() || ""}
                    onValueChange={(v) => setPlanNuevoID(Number.parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                          {plan.NombrePlan} - ${plan.Precio.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requestType === "Cancelar" && (
                <div>
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

              <div>
                <Label>Comentarios adicionales (opcional)</Label>
                <Textarea
                  value={motivoSolicitud}
                  onChange={(e) => setMotivoSolicitud(e.target.value)}
                  placeholder="Agrega cualquier información adicional..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitRequest}>Enviar Solicitud</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
