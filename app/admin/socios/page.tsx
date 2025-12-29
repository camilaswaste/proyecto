"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { MembershipModal } from "@/components/membership-modal"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// ⚠️ OJO: en shadcn normalmente es: import { useToast } from "@/components/ui/use-toast"
// Si tu proyecto lo tiene en "@/components/ui/toast", déjalo así.
import { useToast } from "@/components/ui/toast"

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit,
  Filter,
  History,
  QrCodeIcon,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react"

interface PlanMembresia {
  PlanID: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
  Activo: boolean
}

interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  FechaNacimiento?: string
  Direccion?: string
  EstadoSocio: string
  CodigoQR: string
  NombrePlan: string | null
  EstadoMembresia: string | null
  FechaInicio: string | null
  FechaFin: string | null
}

interface SolicitudMembresia {
  SolicitudID: number
  SocioID: number
  TipoSolicitud: string
  MesesPausa: number | null
  MotivoCancelacion: string | null
  MotivoSolicitud: string | null
  Estado: string
  FechaSolicitud: string
  FechaRespuesta: string | null
  MotivoRechazo: string | null
  Nombre: string
  Apellido: string
  Email: string
  RUT: string
  AdminRespuesta: string | null
}

const ITEMS_PER_PAGE = 10

export default function AdminSociosPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstadoMembresia, setFilterEstadoMembresia] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)

  const [showDialog, setShowDialog] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)

  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrSocio, setQrSocio] = useState<Socio | null>(null)

  const [formData, setFormData] = useState({
    RUT: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Telefono: "",
    FechaNacimiento: "",
    Direccion: "",
    EstadoSocio: "Activo",
  })
  const [rutError, setRutError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const [showMembresiaDialog, setShowMembresiaDialog] = useState(false)
  const [membresiaSocio, setMembresiaSocio] = useState<Socio | null>(null)
  const [planes, setPlanes] = useState<PlanMembresia[]>([])
  const [selectedPlanID, setSelectedPlanID] = useState<number>(0)

  const [solicitudes, setSolicitudes] = useState<SolicitudMembresia[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudMembresia | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [solicitudesModalOpen, setSolicitudesModalOpen] = useState(false)

  // -------------------------
  // Helpers (format/validations)
  // -------------------------
  const handleRUTChange = (rut: string) => {
    const cleanRUT = rut.replace(/[^\dkK]/g, "")
    let formattedRUT = cleanRUT

    if (cleanRUT.length > 1) {
      const body = cleanRUT.slice(0, -1)
      const dv = cleanRUT.slice(-1)
      const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      formattedRUT = `${formattedBody}-${dv}`
    }

    setFormData((p) => ({ ...p, RUT: formattedRUT }))
    if (cleanRUT.length >= 8) setRutError("")
  }

  const handlePhoneChange = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")

    let formattedPhone = cleanPhone
    if (cleanPhone.length > 0) {
      if (cleanPhone.length <= 2) {
        formattedPhone = `(+${cleanPhone}`
      } else if (cleanPhone.length <= 3) {
        formattedPhone = `(+${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`
      } else if (cleanPhone.length <= 7) {
        formattedPhone = `(+${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 3)} ${cleanPhone.slice(3)}`
      } else {
        formattedPhone = `(+${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 3)} ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7, 11)}`
      }
    }

    setFormData((p) => ({ ...p, Telefono: formattedPhone }))
    if (cleanPhone.length >= 11) setPhoneError("")
  }

  const validateRUT = (_rut: string) => true
  const validatePhone = (_phone: string) => true

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    try {
      return new Date(dateString).toLocaleDateString("es-CL")
    } catch {
      return "—"
    }
  }

  const formatRUT = (rut: string) => {
    if (!rut) return "—"
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "")
    const dv = cleanRUT.slice(-1)
    const body = cleanRUT.slice(0, -1)

    let formattedBody = ""
    let counter = 0
    for (let i = body.length - 1; i >= 0; i--) {
      formattedBody = body[i] + formattedBody
      counter++
      if (counter === 3 && i !== 0) {
        formattedBody = "." + formattedBody
        counter = 0
      }
    }
    return `${formattedBody}-${dv}`
  }

  const formatTelefono = (telefono: string) => {
    if (!telefono) return "—"
    const cleanPhone = telefono.replace(/\D/g, "")
    if (cleanPhone.startsWith("56") && cleanPhone.length >= 11) {
      const code = cleanPhone.slice(0, 2)
      const mobile = cleanPhone.slice(2, 3)
      const part1 = cleanPhone.slice(3, 7)
      const part2 = cleanPhone.slice(7, 11)
      return `+(${code}${mobile}) ${part1} ${part2}`
    }
    if (cleanPhone.length === 9) {
      const part1 = cleanPhone.slice(0, 4)
      const part2 = cleanPhone.slice(4)
      return `+(569) ${part1} ${part2}`
    }
    return telefono
  }

  // Preferir rojo sobre amarillo
  const getEstadoMembresiaPill = (estado: string | null) => {
    switch (estado) {
      case "Vigente":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      case "Pausada":
        return "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
      case "Vencida":
        return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      case "Cancelada":
        return "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
      case "Suspendida":
        return "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
      default:
        return "border-border/60 bg-muted/40 text-muted-foreground"
    }
  }

  const getEstadoSocioPill = (estado: string) => {
    if (estado === "Activo") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
    return "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
  }

  // -------------------------
  // Fetch
  // -------------------------
  useEffect(() => {
    fetchSocios()
    fetchPlanes()
    fetchSolicitudes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSolicitudes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/solicitudes?estado=Pendiente", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSolicitudes(Array.isArray(data) ? data : [])
      } else {
        toast({
          variant: "warning",
          title: "Atención",
          description: "No se pudieron cargar las solicitudes pendientes.",
        })
      }
    } catch (error) {
      console.error("Error al cargar solicitudes:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al cargar solicitudes.",
      })
    } finally {
      setLoadingSolicitudes(false)
    }
  }

  const fetchSocios = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/socios")
      if (response.ok) {
        const data = await response.json()
        setSocios(Array.isArray(data) ? data : [])
      } else {
        toast({
          variant: "error",
          title: "Error",
          description: "No se pudieron cargar los socios.",
        })
      }
    } catch (error) {
      console.error("Error al cargar socios:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al cargar socios.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/admin/membresias")
      if (response.ok) {
        const data = await response.json()
        const activePlanes = (Array.isArray(data) ? data : []).filter((p: PlanMembresia) => p.Activo)
        setPlanes(activePlanes)
        if (activePlanes.length > 0) setSelectedPlanID(activePlanes[0].PlanID)
      } else {
        toast({
          variant: "warning",
          title: "Atención",
          description: "No se pudieron cargar los planes de membresía.",
        })
      }
    } catch (error) {
      console.error("Error al cargar planes:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al cargar planes.",
      })
    }
  }

  // -------------------------
  // Dialog handlers
  // -------------------------
  const handleOpenDialog = (socio?: Socio) => {
    setRutError("")
    setPhoneError("")

    if (socio) {
      setEditingSocio(socio)
      setFormData({
        RUT: socio.RUT,
        Nombre: socio.Nombre,
        Apellido: socio.Apellido, // ✅ arreglado (tu código tenía "Ap_attach")
        Email: socio.Email,
        Telefono: socio.Telefono || "",
        FechaNacimiento: socio.FechaNacimiento || "",
        Direccion: socio.Direccion || "",
        EstadoSocio: socio.EstadoSocio,
      })
    } else {
      setEditingSocio(null)
      setFormData({
        RUT: "",
        Nombre: "",
        Apellido: "",
        Email: "",
        Telefono: "",
        FechaNacimiento: "",
        Direccion: "",
        EstadoSocio: "Activo",
      })
    }
    setShowDialog(true)
  }

  const handleOpenQrDialog = (socio: Socio) => {
    setQrSocio(socio)
    setShowQrDialog(true)
  }

  const handleOpenMembresiaDialog = (socio: Socio) => {
    setMembresiaSocio(socio)
    setSelectedPlanID(planes.length > 0 ? planes[0].PlanID : 0)
    setShowMembresiaDialog(true)
  }

  // -------------------------
  // Membership actions
  // -------------------------
  const handleMembershipAction = async (
    action: "assign" | "pause" | "cancel" | "resume" | "change" | null,
    data?: any,
  ) => {
    if (!membresiaSocio) return

    try {
      toast({
        variant: "info",
        title: "Información",
        description: "Procesando solicitud...",
      })

      const token = localStorage.getItem("token")
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" }
      if (token) authHeaders.Authorization = `Bearer ${token}`

      if (action === "assign") {
        const params = new URLSearchParams({
          socioID: membresiaSocio.SocioID.toString(),
          planID: selectedPlanID.toString(),
        })
        setShowMembresiaDialog(false)
        router.push(`/admin/pagos/procesar?${params.toString()}`)
        return
      }

      if (action === "change") {
        const keepDates = data?.keepDates === "on"
        const res = await fetch("/api/admin/membresias/cambiar", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            planID: selectedPlanID,
            mantenerFechas: keepDates,
            motivo: data?.changeReason || "Cambio de plan",
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo cambiar la membresía")

        toast({
          variant: "success",
          title: "Guardado",
          description: "Membresía cambiada exitosamente.",
        })

        setShowMembresiaDialog(false)
        fetchSocios()
        return
      }

      if (action === "pause") {
        const res = await fetch("/api/admin/membresias/pausar", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            dias: data?.pauseDuration,
            motivo: data?.pauseReason,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo pausar")

        toast({
          variant: "warning",
          title: "Atención",
          description: `Membresía pausada por ${data?.pauseDuration ?? 0} días.`,
        })

        setShowMembresiaDialog(false)
        fetchSocios()
        return
      }

      if (action === "cancel") {
        const res = await fetch("/api/admin/membresias/cancelar", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            motivo: data?.cancelReason,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo cancelar")

        toast({
          variant: "success",
          title: "Guardado",
          description: "Membresía cancelada.",
        })

        setShowMembresiaDialog(false)
        fetchSocios()
        return
      }

      if (action === "resume") {
        const extender = data?.extendVencimiento === "on"
        const res = await fetch("/api/admin/membresias/reanudar", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            extenderVencimiento: extender,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo reanudar")

        toast({
          variant: "success",
          title: "Guardado",
          description: "Membresía reanudada correctamente.",
        })

        setShowMembresiaDialog(false)
        fetchSocios()
      }
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Error",
        description: e?.message || "No se pudo completar la operación",
      })
    }
  }

  // -------------------------
  // Solicitudes handlers
  // -------------------------
  const handleAprobarSolicitud = async (solicitudID: number) => {
    try {
      toast({
        variant: "info",
        title: "Información",
        description: "Procesando solicitud...",
      })

      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/solicitudes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ solicitudID, accion: "aprobar" }),
      })

      if (response.ok) {
        await fetchSolicitudes()
        await fetchSocios()
        toast({
          variant: "success",
          title: "Guardado",
          description: "Solicitud aprobada exitosamente.",
        })
      } else {
        toast({
          variant: "error",
          title: "Error",
          description: "Error al aprobar la solicitud.",
        })
      }
    } catch (error) {
      console.error("Error al aprobar solicitud:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al aprobar la solicitud.",
      })
    }
  }

  const handleOpenRejectDialog = (solicitud: SolicitudMembresia) => {
    setSelectedSolicitud(solicitud)
    setMotivoRechazo("")
    setShowRejectDialog(true)
  }

  const handleRechazarSolicitud = async () => {
    if (!selectedSolicitud) return
    if (!motivoRechazo.trim()) {
      toast({
        variant: "warning",
        title: "Atención",
        description: "Debe proporcionar un motivo de rechazo.",
      })
      return
    }

    try {
      toast({
        variant: "info",
        title: "Información",
        description: "Procesando solicitud...",
      })

      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/solicitudes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          solicitudID: selectedSolicitud.SolicitudID,
          accion: "rechazar",
          motivoRechazo,
        }),
      })

      if (response.ok) {
        await fetchSolicitudes()
        setShowRejectDialog(false)
        setSelectedSolicitud(null)
        setMotivoRechazo("")
        toast({
          variant: "success",
          title: "Guardado",
          description: "Solicitud rechazada correctamente.",
        })
      } else {
        toast({
          variant: "error",
          title: "Error",
          description: "Error al rechazar la solicitud.",
        })
      }
    } catch (error) {
      console.error("Error al rechazar solicitud:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al rechazar la solicitud.",
      })
    }
  }

  // -------------------------
  // Submit socio
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRUT(formData.RUT)) {
      toast({
        variant: "warning",
        title: "Atención",
        description: "Por favor ingresa un RUT válido en formato xx.xxx.xxx-x",
      })
      return
    }

    if (formData.Telefono && !validatePhone(formData.Telefono)) {
      toast({
        variant: "warning",
        title: "Atención",
        description: "Por favor ingresa un teléfono válido en formato (+56) 9 xxxx xxxx",
      })
      return
    }

    try {
      toast({
        variant: "info",
        title: "Información",
        description: "Procesando solicitud...",
      })

      const validationResponse = await fetch("/api/auth/validate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.Email,
          rut: formData.RUT,
          excludeId: editingSocio?.SocioID,
          userType: "Socio",
        }),
      })

      const validationResult = await validationResponse.json()
      if (!validationResult.valid) {
        toast({
          variant: "error",
          title: "Error",
          description: (validationResult.errors || ["Validación fallida"]).join(" • "),
        })
        return
      }

      const body = editingSocio ? { ...formData, socioID: editingSocio.SocioID } : formData
      const url = "/api/admin/socios"
      const method = editingSocio ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()

        if (!editingSocio && result.tempPassword) {
          toast({
            variant: "success",
            title: "Guardado",
            description: "Socio creado. Se generó una contraseña temporal.",
          })
          // Si quieres mostrar la contraseña sí o sí, mantenlo en alert.
          alert(
            `Socio creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.Email}\nContraseña temporal: ${result.tempPassword}\n\nIMPORTANTE: El socio debe cambiar su contraseña al iniciar sesión por primera vez.\nComparte estas credenciales de forma segura.`,
          )
        } else if (editingSocio) {
          toast({
            variant: "success",
            title: "Guardado",
            description: "Socio actualizado exitosamente.",
          })
        } else {
          toast({
            variant: "success",
            title: "Guardado",
            description: "Socio creado exitosamente.",
          })
        }

        setShowDialog(false)
        fetchSocios()
      } else {
        const err = await response.json().catch(() => ({}))
        toast({
          variant: "error",
          title: "Error",
          description: err.error || "Error al guardar socio",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al guardar socio",
      })
    }
  }

  const handleDelete = async (id: number) => {
    // confirm nativo (si lo quieres con modal, lo cambiamos después)
    if (!confirm("¿Estás seguro de eliminar este socio?")) return

    try {
      toast({
        variant: "info",
        title: "Información",
        description: "Procesando solicitud...",
      })

      const response = await fetch(`/api/admin/socios?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({
          variant: "success",
          title: "Guardado",
          description: "Socio eliminado correctamente.",
        })
        fetchSocios()
      } else {
        const err = await response.json().catch(() => ({}))
        toast({
          variant: "error",
          title: "Error",
          description: err.error || "No se pudo eliminar el socio",
        })
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Error de red al eliminar.",
      })
    }
  }

  // -------------------------
  // Filtering + pagination
  // -------------------------
  const filteredSocios = useMemo(() => {
    return socios.filter((socio) => {
      const q = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !q ||
        socio.Nombre.toLowerCase().includes(q) ||
        socio.Apellido.toLowerCase().includes(q) ||
        socio.Email.toLowerCase().includes(q) ||
        (socio.Telefono || "").toLowerCase().includes(q) ||
        (socio.RUT || "").toLowerCase().includes(q)

      const matchesEstado =
        filterEstadoMembresia === "todos" ||
        socio.EstadoMembresia === filterEstadoMembresia ||
        (filterEstadoMembresia === "sin-plan" && !socio.EstadoMembresia)

      return matchesSearch && matchesEstado
    })
  }, [socios, searchTerm, filterEstadoMembresia])

  const totalPages = Math.ceil(filteredSocios.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSocios = filteredSocios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterEstadoMembresia])

  // -------------------------
  // Loading state
  // -------------------------
  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="rounded-2xl border bg-background/60 backdrop-blur px-6 py-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Cargando socios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border bg-background/70 backdrop-blur">
          <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/60 via-red-500/25 to-transparent" />

          <div className="p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Socios</h1>
              <p className="text-sm text-muted-foreground">Gestiona los socios del gimnasio y sus membresías.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {solicitudes.length > 0 && (
                <Button
                  onClick={() => setSolicitudesModalOpen(true)}
                  className="relative rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Solicitudes Pendientes
                  <Badge className="ml-2 bg-white/15 text-white border-white/20">
                    {loadingSolicitudes ? "…" : solicitudes.length}
                  </Badge>
                </Button>
              )}

              <Button
                onClick={() => handleOpenDialog()}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Socio
              </Button>
            </div>
          </div>
        </div>

        {/* Solicitudes modal */}
        <Dialog open={solicitudesModalOpen} onOpenChange={setSolicitudesModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/15">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                Solicitudes Pendientes
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {solicitudes.length === 0 ? (
                <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No hay solicitudes pendientes.
                </div>
              ) : (
                solicitudes.map((solicitud) => (
                  <Card key={solicitud.SolicitudID} className="border-border/70 bg-background/70">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-semibold truncate">
                              {solicitud.Nombre} {solicitud.Apellido}
                            </p>

                            <Badge
                              variant="outline"
                              className={
                                solicitud.TipoSolicitud === "Pausar"
                                  ? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                  : solicitud.TipoSolicitud === "Cancelar"
                                    ? "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
                                    : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              }
                            >
                              {solicitud.TipoSolicitud}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">{solicitud.Email}</p>

                          {solicitud.TipoSolicitud === "Pausar" && solicitud.MesesPausa && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Duración:</span> {solicitud.MesesPausa}{" "}
                              {solicitud.MesesPausa === 1 ? "mes" : "meses"}
                            </p>
                          )}

                          {solicitud.TipoSolicitud === "Cancelar" && solicitud.MotivoCancelacion && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Motivo:</span> {solicitud.MotivoCancelacion}
                            </p>
                          )}

                          {solicitud.MotivoSolicitud && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Observaciones:</span> {solicitud.MotivoSolicitud}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            Solicitado el {new Date(solicitud.FechaSolicitud).toLocaleString("es-CL")}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAprobarSolicitud(solicitud.SolicitudID)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenRejectDialog(solicitud)}
                            className="rounded-xl"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista principal */}
        <Card className="border-border/70 bg-background/70 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-foreground">Lista de Socios</CardTitle>
                <CardDescription>Total: {socios.length} socios registrados</CardDescription>
              </div>

              <div className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span>–
                <span className="font-medium text-foreground">{Math.min(endIndex, filteredSocios.length)}</span> de{" "}
                <span className="font-medium text-foreground">{filteredSocios.length}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, RUT o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl bg-background/80"
                />
              </div>

              <div className="w-full lg:w-[260px]">
                <Select value={filterEstadoMembresia} onValueChange={setFilterEstadoMembresia}>
                  <SelectTrigger className="rounded-xl bg-background/80">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Vigente">Vigente</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Vencida">Vencida</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Suspendida">Suspendida</SelectItem>
                    <SelectItem value="sin-plan">Sin plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 dark:bg-muted/20">
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">RUT</th>
                      <th className="text-left px-4 py-3 font-medium">Nombre</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Plan / Estado</th>
                      <th className="text-left px-4 py-3 font-medium">Inicio</th>
                      <th className="text-left px-4 py-3 font-medium">Fin</th>
                      <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                      <th className="text-left px-4 py-3 font-medium">Socio</th>
                      <th className="text-left px-4 py-3 font-medium">QR</th>
                      <th className="text-left px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="dark:bg-background/50">
                    {paginatedSocios.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                          No se encontraron socios.
                        </td>
                      </tr>
                    ) : (
                      paginatedSocios.map((socio) => (
                        <tr
                          key={socio.SocioID}
                          className="border-t border-border/50 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{formatRUT(socio.RUT)}</td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {socio.Nombre} {socio.Apellido}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">{socio.Email}</td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground text-sm">{socio.NombrePlan || "Sin Plan"}</div>
                            <span
                              className={[
                                "inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium border",
                                getEstadoMembresiaPill(socio.EstadoMembresia),
                              ].join(" ")}
                            >
                              {socio.EstadoMembresia || "N/A"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">{formatDate(socio.FechaInicio)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(socio.FechaFin)}</td>

                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {formatTelefono(socio.Telefono)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                                getEstadoSocioPill(socio.EstadoSocio),
                              ].join(" ")}
                            >
                              {socio.EstadoSocio}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl hover:bg-red-500/10 dark:hover:bg-red-500/20"
                              onClick={() => handleOpenQrDialog(socio)}
                              disabled={!socio.CodigoQR}
                              title="Ver QR"
                            >
                              <QrCodeIcon
                                className={[
                                  "h-4 w-4",
                                  socio.CodigoQR ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
                                ].join(" ")}
                              />
                            </Button>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-purple-500/10 dark:hover:bg-purple-500/20"
                                onClick={() => router.push(`/admin/socios/${socio.SocioID}/historial`)}
                                title="Historial"
                              >
                                <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-500/20"
                                onClick={() => handleOpenMembresiaDialog(socio)}
                                title="Gestionar membresía"
                              >
                                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-muted dark:hover:bg-muted/50"
                                onClick={() => handleOpenDialog(socio)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4 text-foreground" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-red-500/10 dark:hover:bg-red-500/20"
                                onClick={() => handleDelete(socio.SocioID)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Página <span className="font-medium text-foreground">{currentPage}</span> de{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const show =
                        page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)

                      if (!show) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              …
                            </span>
                          )
                        }
                        return null
                      }

                      const active = currentPage === page
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className={["w-10 rounded-xl", active ? "bg-red-600 hover:bg-red-700 text-white" : ""].join(
                            " ",
                          )}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/15">
                  <UserPlus className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                {editingSocio ? "Editar Socio" : "Nuevo Socio"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="RUT">RUT *</Label>
                  <Input
                    id="RUT"
                    value={formData.RUT}
                    onChange={(e) => handleRUTChange(e.target.value)}
                    placeholder="12.345.678-9"
                    required
                    maxLength={12}
                    className="rounded-xl"
                  />
                  {rutError && <p className="text-sm text-red-600 mt-1">{rutError}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Formato: xx.xxx.xxx-x</p>
                </div>

                <div>
                  <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="FechaNacimiento"
                    type="date"
                    value={formData.FechaNacimiento}
                    onChange={(e) => setFormData((p) => ({ ...p, FechaNacimiento: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="Nombre">Nombre *</Label>
                  <Input
                    id="Nombre"
                    value={formData.Nombre}
                    onChange={(e) => setFormData((p) => ({ ...p, Nombre: e.target.value }))}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="Apellido">Apellido *</Label>
                  <Input
                    id="Apellido"
                    value={formData.Apellido}
                    onChange={(e) => setFormData((p) => ({ ...p, Apellido: e.target.value }))}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="Email">Email *</Label>
                <Input
                  id="Email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData((p) => ({ ...p, Email: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="Telefono">Teléfono</Label>
                <Input
                  id="Telefono"
                  value={formData.Telefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(+56) 9 xxxx xxxx"
                  maxLength={17}
                  className="rounded-xl"
                />
                {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
                <p className="text-xs text-muted-foreground mt-1">Formato: (+56) 9 xxxx xxxx</p>
              </div>

              <div>
                <Label htmlFor="Direccion">Dirección</Label>
                <Input
                  id="Direccion"
                  value={formData.Direccion}
                  onChange={(e) => setFormData((p) => ({ ...p, Direccion: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.EstadoSocio}
                  onValueChange={(v) => setFormData((p) => ({ ...p, EstadoSocio: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                    <SelectItem value="Moroso">Moroso</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="rounded-xl bg-transparent">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                  {editingSocio ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-[460px] bg-background border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/15">
                  <QrCodeIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                Código QR de Acceso
              </DialogTitle>
            </DialogHeader>

            {qrSocio && (
              <div className="flex flex-col items-center gap-3">
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">
                    {qrSocio.Nombre} {qrSocio.Apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatRUT(qrSocio.RUT)}</p>
                </div>

                {qrSocio.CodigoQR ? (
                  <div className="w-full rounded-2xl border border-border bg-background/50 dark:bg-background/30 p-4 flex items-center justify-center">
                    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
                      <QrCodeQuickChart value={qrSocio.CodigoQR} size={240} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                    Este socio no tiene un Código QR asignado.
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Este código se utiliza para el control de acceso al gimnasio.
                </p>

                <DialogFooter className="w-full">
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full rounded-xl bg-transparent">
                      Cerrar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-[520px] bg-background border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/15">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                Rechazar Solicitud
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedSolicitud && (
                <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/20 p-3">
                  <p className="font-semibold text-foreground">
                    {selectedSolicitud.Nombre} {selectedSolicitud.Apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solicitud de {selectedSolicitud.TipoSolicitud.toLowerCase()}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="motivoRechazo">Motivo del Rechazo *</Label>
                <Textarea
                  id="motivoRechazo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por qué se rechaza esta solicitud..."
                  rows={4}
                  required
                  className="rounded-xl"
                />
              </div>

              <Separator />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" className="rounded-xl" onClick={handleRechazarSolicitud}>
                  Rechazar Solicitud
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <MembershipModal
          open={showMembresiaDialog}
          onOpenChange={setShowMembresiaDialog}
          socio={membresiaSocio}
          planes={planes}
          selectedPlanID={selectedPlanID}
          onPlanChange={setSelectedPlanID}
          onSubmit={handleMembershipAction}
        />
      </div>
    </DashboardLayout>
  )
}