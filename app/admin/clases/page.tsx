"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import {
  Brain,
  CalendarIcon,
  Clock,
  Dumbbell,
  Edit,
  Heart,
  Music,
  Plus,
  Search,
  Sword,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useMemo, useState } from "react"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  EntrenadorID: number
  NombreEntrenador: string
  DiasSemana: string[]
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  Estado: boolean
  FechaInicio: string
  FechaFin: string
  Categoria: string
  CuposOcupados?: number
}

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
}

type CatKey = "Cardiovascular" | "Fuerza" | "Mente y Cuerpo" | "Baile" | "Artes Marciales"

const categorias: Array<{
  nombre: CatKey
  icon: any
  tone: "red" | "orange" | "green" | "purple" | "yellow"
  clases: string[]
}> = [
  { nombre: "Cardiovascular", tone: "red", icon: Heart, clases: ["Zumba", "Spinning", "Cardio Box"] },
  { nombre: "Fuerza", tone: "orange", icon: Dumbbell, clases: ["Body Pump", "CrossFit", "Funcional", "Body Combat"] },
  { nombre: "Mente y Cuerpo", tone: "green", icon: Brain, clases: ["Yoga", "Pilates"] },
  { nombre: "Baile", tone: "purple", icon: Music, clases: ["Zumba", "Groove", "Salsa"] },
  { nombre: "Artes Marciales", tone: "yellow", icon: Sword, clases: ["Cardio Box", "Kickboxing", "Muay Thai"] },
]

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const bloquesHorario = [
  { inicio: "06:00", fin: "08:00" },
  { inicio: "08:00", fin: "10:00" },
  { inicio: "10:00", fin: "12:00" },
  { inicio: "12:00", fin: "14:00" },
  { inicio: "14:00", fin: "16:00" },
  { inicio: "16:00", fin: "18:00" },
  { inicio: "18:00", fin: "20:00" },
  { inicio: "20:00", fin: "22:00" },
  { inicio: "22:00", fin: "23:00" },
]

const toneStyles = {
  red: {
    chip: "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/10 ring-1 ring-red-500/15",
    tile: "border-red-500/25 bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-300",
    dot: "bg-red-500",
  },
  orange: {
    chip: "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/10 ring-1 ring-orange-500/15",
    tile: "border-orange-500/25 bg-orange-500/10 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  green: {
    chip: "border-green-500/30 text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/10 ring-1 ring-green-500/15",
    tile: "border-green-500/25 bg-green-500/10 dark:bg-green-500/10 text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  purple: {
    chip: "border-purple-500/30 text-purple-700 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/10 ring-1 ring-purple-500/15",
    tile: "border-purple-500/25 bg-purple-500/10 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  yellow: {
    chip: "border-yellow-500/35 text-yellow-800 dark:text-yellow-300 bg-yellow-500/10 dark:bg-yellow-500/10 ring-1 ring-yellow-500/15",
    tile: "border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-200",
    dot: "bg-yellow-500",
  },
} as const

export default function AdminClasesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [clases, setClases] = useState<Clase[]>([])
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)

  const [showDialog, setShowDialog] = useState(false)
  const [editingClase, setEditingClase] = useState<Clase | null>(null)
  const [vistaActual, setVistaActual] = useState<"calendario" | "lista">("calendario")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas")
  const [semanaOffset, setSemanaOffset] = useState(0)

  const [formData, setFormData] = useState({
    NombreClase: "",
    Descripcion: "",
    EntrenadorID: "",
    DiasSemana: [] as string[],
    HoraInicio: "",
    HoraFin: "",
    CupoMaximo: "",
    FechaInicio: "",
    FechaFin: "",
    Categoria: "",
  })

  useEffect(() => {
    fetchClases()
    fetchEntrenadores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchClases = async () => {
    try {
      const response = await fetch("/api/admin/clases", { cache: "no-store" })
      if (!response.ok) {
        toast({
          variant: "error",
          title: "No se pudieron cargar las clases",
          description: `Error HTTP ${response.status}`,
        })
        return
      }
      const data = await response.json()
      setClases(data)
    } catch (error) {
      console.error("Error al cargar clases:", error)
      toast({
        variant: "error",
        title: "Error de conexión",
        description: "No se pudo contactar al servidor para cargar clases.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/admin/entrenadores", { cache: "no-store" })
      if (!response.ok) {
        toast({
          variant: "warning",
          title: "Entrenadores no disponibles",
          description: `No se pudieron cargar (HTTP ${response.status}).`,
        })
        return
      }
      const data = await response.json()
      setEntrenadores(data)
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
      toast({
        variant: "warning",
        title: "Entrenadores no disponibles",
        description: "Revisa tu conexión o intenta nuevamente.",
      })
    }
  }

  const determinarCategoria = (nombreClase: string): CatKey => {
    const nombre = nombreClase.toLowerCase().trim()
    for (const cat of categorias) {
      for (const claseCategoria of cat.clases) {
        const cc = claseCategoria.toLowerCase()
        if (nombre === cc || nombre.includes(cc)) return cat.nombre
      }
    }
    return "Cardiovascular"
  }

  const formatearHora = (hora: string): string => {
    if (!hora) return "00:00"
    if (hora.includes("T")) return hora.split("T")[1].substring(0, 5)
    if (hora.length >= 5) return hora.substring(0, 5)
    return hora
  }

  const handleOpenDialog = (clase?: Clase) => {
    if (clase) {
      setEditingClase(clase)
      setFormData({
        NombreClase: clase.NombreClase,
        Descripcion: clase.Descripcion || "",
        EntrenadorID: clase.EntrenadorID.toString(),
        DiasSemana: clase.DiasSemana || [clase.DiaSemana],
        HoraInicio: formatearHora(clase.HoraInicio),
        HoraFin: formatearHora(clase.HoraFin),
        CupoMaximo: clase.CupoMaximo.toString(),
        FechaInicio: clase.FechaInicio ? new Date(clase.FechaInicio).toISOString().split("T")[0] : "",
        FechaFin: clase.FechaFin ? new Date(clase.FechaFin).toISOString().split("T")[0] : "",
        Categoria: (clase.Categoria as CatKey) || determinarCategoria(clase.NombreClase),
      })
    } else {
      setEditingClase(null)
      const hoy = new Date()
      const tresMesesDespues = new Date()
      tresMesesDespues.setMonth(hoy.getMonth() + 3)

      setFormData({
        NombreClase: "",
        Descripcion: "",
        EntrenadorID: "",
        DiasSemana: [],
        HoraInicio: "",
        HoraFin: "",
        CupoMaximo: "",
        FechaInicio: hoy.toISOString().split("T")[0],
        FechaFin: tresMesesDespues.toISOString().split("T")[0],
        Categoria: "Cardiovascular",
      })
    }
    setShowDialog(true)
  }

  const handleOpenDialogFromCalendar = (dia: string, hora: string) => {
    const hoy = new Date()
    const tresMesesDespues = new Date()
    tresMesesDespues.setMonth(hoy.getMonth() + 3)

    setEditingClase(null)
    setFormData({
      NombreClase: "",
      Descripcion: "",
      EntrenadorID: "",
      DiasSemana: [dia],
      HoraInicio: hora,
      HoraFin: "",
      CupoMaximo: "",
      FechaInicio: hoy.toISOString().split("T")[0],
      FechaFin: tresMesesDespues.toISOString().split("T")[0],
      Categoria: "Cardiovascular",
    })
    setShowDialog(true)
  }

  const validarFormulario = () => {
    if (!formData.NombreClase.trim()) {
      toast({ variant: "warning", title: "Falta el nombre de la clase" })
      return false
    }
    if (!formData.EntrenadorID) {
      toast({ variant: "warning", title: "Selecciona un entrenador" })
      return false
    }
    if (formData.DiasSemana.length === 0) {
      toast({ variant: "warning", title: "Selecciona al menos un día de la semana" })
      return false
    }
    if (!formData.HoraInicio || !formData.HoraFin) {
      toast({ variant: "warning", title: "Completa hora de inicio y fin" })
      return false
    }
    if (!formData.CupoMaximo || Number(formData.CupoMaximo) <= 0) {
      toast({ variant: "warning", title: "Cupo máximo inválido", description: "Debe ser mayor a 0." })
      return false
    }
    if (!formData.FechaInicio || !formData.FechaFin) {
      toast({ variant: "warning", title: "Completa fecha de inicio y fin" })
      return false
    }
    if (new Date(formData.FechaFin) <= new Date(formData.FechaInicio)) {
      toast({ variant: "warning", title: "Fecha fin inválida", description: "Debe ser posterior a la fecha inicio." })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return

    try {
      const url = editingClase ? `/api/admin/clases?id=${editingClase.ClaseID}` : "/api/admin/clases"
      const method = editingClase ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast({
          variant: "error",
          title: "No se pudo guardar la clase",
          description: err?.error || `Error HTTP ${response.status}`,
        })
        return
      }

      setShowDialog(false)
      toast({
        variant: "success",
        title: editingClase ? "Clase actualizada" : "Clase creada",
        description: "Los cambios se guardaron correctamente.",
      })
      fetchClases()
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "error",
        title: "Error al guardar",
        description: "Revisa tu conexión o intenta nuevamente.",
      })
    }
  }

  const handleDelete = async (id: number) => {
    const ok = window.confirm("¿Estás seguro de eliminar esta clase?")
    if (!ok) {
      toast({ variant: "info", title: "Acción cancelada", description: "No se eliminó la clase." })
      return
    }

    try {
      const response = await fetch(`/api/admin/clases?id=${id}`, { method: "DELETE" })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        toast({
          variant: "error",
          title: "No se pudo eliminar",
          description: err?.error || `Error HTTP ${response.status}`,
        })
        return
      }

      toast({ variant: "success", title: "Clase eliminada", description: "Se eliminó correctamente." })
      fetchClases()
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast({ variant: "error", title: "Error de conexión", description: "No se pudo eliminar la clase." })
    }
  }

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      DiasSemana: prev.DiasSemana.includes(dia) ? prev.DiasSemana.filter((d) => d !== dia) : [...prev.DiasSemana, dia],
    }))
  }

  const obtenerCategoriaInfo = (nombreClase: string, categoriaGuardada?: string) => {
    const nombreCat = (categoriaGuardada as CatKey) || determinarCategoria(nombreClase)
    return categorias.find((c) => c.nombre === nombreCat) || categorias[0]
  }

  const obtenerSemanaActual = () => {
    const hoy = new Date()
    const primerDia = new Date(hoy)
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1 + semanaOffset * 7) // lunes
    const fechasSemana = []
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(primerDia)
      fecha.setDate(primerDia.getDate() + i)
      fechasSemana.push(fecha)
    }
    return fechasSemana
  }

  const fechasSemana = obtenerSemanaActual()

  const formatearRangoSemana = () => {
    const primerDia = fechasSemana[0]
    const ultimoDia = fechasSemana[6]
    const opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    return `${primerDia.toLocaleDateString("es-ES", opciones)} - ${ultimoDia.toLocaleDateString("es-ES", opciones)}`
  }

  const clasesFiltradas = useMemo(() => {
    let resultado = clases

    if (categoriaFiltro !== "Todas") {
      resultado = resultado.filter((clase) => {
        const info = obtenerCategoriaInfo(clase.NombreClase, clase.Categoria)
        return info.nombre === categoriaFiltro
      })
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (clase) => clase.NombreClase.toLowerCase().includes(q) || clase.NombreEntrenador.toLowerCase().includes(q),
      )
    }

    return resultado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clases, categoriaFiltro, searchTerm])

  const filteredClases = useMemo(() => {
    return clasesFiltradas.filter((clase) => {
      const primerDiaSemana = fechasSemana[0]
      const ultimoDiaSemana = fechasSemana[6]
      const fechaInicio = clase.FechaInicio ? new Date(clase.FechaInicio) : null
      const fechaFin = clase.FechaFin ? new Date(clase.FechaFin) : null
      if (fechaInicio && fechaFin) return fechaInicio <= ultimoDiaSemana && fechaFin >= primerDiaSemana
      return true
    })
  }, [clasesFiltradas, fechasSemana])

  const stats = {
    totalClases: clases.length,
    clasesActivas: clases.filter((c) => c.Estado).length,
    cupoTotal: clases.reduce((sum, c) => sum + c.CupoMaximo, 0),
    entrenadores: new Set(clases.map((c) => c.EntrenadorID)).size,
  }

  const handleClaseClick = (claseId: number) => router.push(`/admin/clases/${claseId}`)

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Clases Grupales</h1>
            <p className="text-muted-foreground">Administra horarios, categorías y entrenadores</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={vistaActual === "calendario" ? "default" : "outline"}
              onClick={() => setVistaActual("calendario")}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendario
            </Button>
            <Button variant={vistaActual === "lista" ? "default" : "outline"} onClick={() => setVistaActual("lista")}>
              Vista Lista
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Clase
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Clases</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalClases}</p>
                </div>
                <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full w-[55%] bg-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Clases Activas</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.clasesActivas}</p>
                </div>
                <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Estado general <span className="text-emerald-500 font-semibold">OK</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cupo Total</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.cupoTotal}</p>
                </div>
                <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                  <Users className="h-5 w-5 text-sky-500" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Capacidad máxima semanal</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Entrenadores</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.entrenadores}</p>
                </div>
                <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-violet-500" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Asignados a clases</p>
            </CardContent>
          </Card>
        </div>

        {/* Categorías */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground">Categorías de Clases</CardTitle>
            <CardDescription>Filtra rápido por tipo</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={[
                  "cursor-pointer px-3 py-1.5 rounded-full border-border/60 bg-background/40 hover:bg-muted/40",
                  categoriaFiltro === "Todas" ? "ring-1 ring-primary/20 border-primary/30 text-foreground" : "",
                ].join(" ")}
                onClick={() => setCategoriaFiltro("Todas")}
              >
                Todas
              </Badge>

              {categorias.map((cat) => {
                const Icon = cat.icon
                const selected = categoriaFiltro === cat.nombre
                const s = toneStyles[cat.tone]

                return (
                  <Badge
                    key={cat.nombre}
                    variant="outline"
                    onClick={() => setCategoriaFiltro(cat.nombre)}
                    className={[
                      "cursor-pointer px-3 py-1.5 rounded-full border bg-background/40 hover:bg-muted/40 transition-colors",
                      selected ? s.chip : "border-border/60 text-muted-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {cat.nombre}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vista Calendario */}
        {vistaActual === "calendario" ? (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">Calendario Semanal</CardTitle>
                  <CardDescription>{formatearRangoSemana()}</CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSemanaOffset(semanaOffset - 1)}>
                      ← Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSemanaOffset(0)} disabled={semanaOffset === 0}>
                      Hoy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSemanaOffset(semanaOffset + 1)}>
                      Siguiente →
                    </Button>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar clase..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[110px_repeat(7,minmax(160px,1fr))] gap-0 min-w-[1250px]">
                  <div className="font-semibold p-2 text-center sticky left-0 bg-background text-foreground border-b border-border/60">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    Hora
                  </div>

                  {diasSemana.map((dia, index) => {
                    const fecha = fechasSemana[index]
                    const esHoy = fecha.toDateString() === new Date().toDateString()

                    return (
                      <div
                        key={dia}
                        className={[
                          "p-2 text-center border-b border-border/60",
                          esHoy ? "bg-primary/10 text-foreground ring-1 ring-primary/20" : "bg-muted/40 text-foreground",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{dia}</div>
                        <div className="text-lg font-bold">{fecha.getDate()}</div>
                        <div className="text-xs text-muted-foreground">
                          {fecha.toLocaleDateString("es-ES", { month: "short" })}
                        </div>
                      </div>
                    )
                  })}

                  {bloquesHorario.map((bloque) => (
                    <React.Fragment key={`${bloque.inicio}-${bloque.fin}`}>
                      <div className="p-2 text-sm text-center border-r border-border/60 sticky left-0 bg-background">
                        <div className="font-semibold text-foreground">{bloque.inicio}</div>
                        <div className="text-xs text-muted-foreground">-</div>
                        <div className="font-semibold text-foreground">{bloque.fin}</div>
                      </div>

                      {diasSemana.map((dia) => {
                        const clasesEnBloque = filteredClases.filter((clase) => {
                          const horaInicio = formatearHora(clase.HoraInicio)
                          const horaInicioNum =
                            Number.parseInt(horaInicio.split(":")[0]) + Number.parseInt(horaInicio.split(":")[1]) / 60
                          const bloqueInicioNum =
                            Number.parseInt(bloque.inicio.split(":")[0]) +
                            Number.parseInt(bloque.inicio.split(":")[1]) / 60
                          const bloqueFinNum =
                            Number.parseInt(bloque.fin.split(":")[0]) + Number.parseInt(bloque.fin.split(":")[1]) / 60

                          return clase.DiaSemana === dia && horaInicioNum >= bloqueInicioNum && horaInicioNum < bloqueFinNum
                        })

                        return (
                          <div
                            key={dia}
                            className="border border-border/60 p-1 min-h-[104px] bg-card/40 hover:bg-muted/30 transition-colors cursor-pointer relative group"
                            onClick={() => {
                              if (clasesEnBloque.length === 0) handleOpenDialogFromCalendar(dia, bloque.inicio)
                            }}
                          >
                            {clasesEnBloque.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Plus className="h-5 w-5" />
                                  <span className="text-xs">Agregar</span>
                                </div>
                              </div>
                            )}

                            {clasesEnBloque.map((clase) => {
                              const info = obtenerCategoriaInfo(clase.NombreClase, clase.Categoria)
                              const s = toneStyles[info.tone]
                              const cuposDisponibles = clase.CupoMaximo - (clase.CuposOcupados || 0)
                              const porcentajeDisponible = (cuposDisponibles / clase.CupoMaximo) * 100

                              return (
                                <div
                                  key={clase.ClaseID}
                                  className={[
                                    "relative mb-1 rounded-lg border p-2 text-xs",
                                    "shadow-sm hover:shadow transition-shadow",
                                    "bg-background/30 dark:bg-background/20",
                                    s.tile,
                                  ].join(" ")}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleClaseClick(clase.ClaseID)
                                  }}
                                >
                                  {porcentajeDisponible <= 20 && cuposDisponibles > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse z-20">
                                      ¡{cuposDisponibles} cupos!
                                    </div>
                                  )}
                                  {cuposDisponibles === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20">
                                      LLENO
                                    </div>
                                  )}

                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={["h-2 w-2 rounded-full", s.dot].join(" ")} />
                                        <div className="font-semibold truncate text-foreground">{clase.NombreClase}</div>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                        {clase.NombreEntrenador}
                                      </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenDialog(clase)
                                        }}
                                        className="rounded-md border border-border/60 bg-background/60 hover:bg-muted/40 p-1"
                                        title="Editar clase"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-foreground" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(clase.ClaseID)
                                        }}
                                        className="rounded-md border border-border/60 bg-background/60 hover:bg-muted/40 p-1"
                                        title="Eliminar clase"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-2 grid gap-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-foreground/90">
                                        {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Users className="h-3.5 w-3.5" />
                                      <span className="text-foreground/90">
                                        {cuposDisponibles}/{clase.CupoMaximo}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Clases Programadas</CardTitle>
                  <CardDescription>Total: {filteredClases.length} clases</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clase..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="border border-border/60 rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 font-medium text-foreground">Clase</th>
                      <th className="text-left p-3 font-medium text-foreground">Categoría</th>
                      <th className="text-left p-3 font-medium text-foreground">Entrenador</th>
                      <th className="text-left p-3 font-medium text-foreground">Días</th>
                      <th className="text-left p-3 font-medium text-foreground">Horario</th>
                      <th className="text-left p-3 font-medium text-foreground">Cupo</th>
                      <th className="text-left p-3 font-medium text-foreground">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No se encontraron clases
                        </td>
                      </tr>
                    ) : (
                      filteredClases.map((clase) => {
                        const info = obtenerCategoriaInfo(clase.NombreClase, clase.Categoria)
                        const Icon = info.icon
                        const s = toneStyles[info.tone]

                        return (
                          <tr
                            key={clase.ClaseID}
                            className="border-t border-border/60 hover:bg-muted/30 cursor-pointer"
                            onClick={() => handleClaseClick(clase.ClaseID)}
                          >
                            <td className="p-3 font-medium text-foreground">{clase.NombreClase}</td>
                            <td className="p-3">
                              <span
                                className={[
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
                                  s.chip,
                                ].join(" ")}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {info.nombre}
                              </span>
                            </td>
                            <td className="p-3 text-foreground">{clase.NombreEntrenador}</td>
                            <td className="p-3 text-foreground">
                              {Array.isArray(clase.DiasSemana) ? clase.DiasSemana.join(", ") : clase.DiaSemana || "N/A"}
                            </td>
                            <td className="p-3 text-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                              </div>
                            </td>
                            <td className="p-3 text-foreground">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {clase.CupoMaximo - (clase.CuposOcupados || 0)}/{clase.CupoMaximo}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenDialog(clase)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(clase.ClaseID)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingClase ? "Editar Clase" : "Nueva Clase Grupal"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="NombreClase">Nombre de la Clase *</Label>
                  <Input
                    id="NombreClase"
                    value={formData.NombreClase}
                    onChange={(e) => setFormData({ ...formData, NombreClase: e.target.value })}
                    placeholder="Ej: Yoga Matutino, Spinning Avanzado"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="Descripcion">Descripción</Label>
                  <textarea
                    id="Descripcion"
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                    className="w-full rounded-md border border-input bg-background text-foreground p-2 min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe la clase, nivel requerido, beneficios..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="Categoria">Categoría *</Label>
                  <select
                    id="Categoria"
                    value={formData.Categoria}
                    onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
                    className="w-full rounded-md border border-input bg-background text-foreground p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    {categorias.map((cat) => (
                      <option key={cat.nombre} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">Define la categoría para organizar en el calendario</p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="EntrenadorID">Entrenador *</Label>
                  <select
                    id="EntrenadorID"
                    value={formData.EntrenadorID}
                    onChange={(e) => setFormData({ ...formData, EntrenadorID: e.target.value })}
                    className="w-full rounded-md border border-input bg-background text-foreground p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Seleccionar entrenador</option>
                    {entrenadores.map((entrenador) => (
                      <option key={entrenador.EntrenadorID} value={entrenador.EntrenadorID}>
                        {entrenador.Nombre} {entrenador.Apellido}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label>Días de la Semana * (selecciona uno o más)</Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {diasSemana.map((dia) => (
                      <div key={dia} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`dia-${dia}`}
                          checked={formData.DiasSemana.includes(dia)}
                          onChange={() => toggleDia(dia)}
                          className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                        />
                        <label
                          htmlFor={`dia-${dia}`}
                          className="text-sm font-medium leading-none cursor-pointer text-foreground"
                        >
                          {dia}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="HoraInicio">Hora de Inicio *</Label>
                  <Input
                    id="HoraInicio"
                    type="time"
                    value={formData.HoraInicio}
                    onChange={(e) => setFormData({ ...formData, HoraInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="HoraFin">Hora de Fin *</Label>
                  <Input
                    id="HoraFin"
                    type="time"
                    value={formData.HoraFin}
                    onChange={(e) => setFormData({ ...formData, HoraFin: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="CupoMaximo">Cupo Máximo *</Label>
                  <Input
                    id="CupoMaximo"
                    type="number"
                    min="1"
                    value={formData.CupoMaximo}
                    onChange={(e) => setFormData({ ...formData, CupoMaximo: e.target.value })}
                    placeholder="Ej: 20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="FechaInicio">Fecha de Inicio *</Label>
                  <Input
                    id="FechaInicio"
                    type="date"
                    value={formData.FechaInicio}
                    onChange={(e) => setFormData({ ...formData, FechaInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="FechaFin">Fecha de Fin *</Label>
                  <Input
                    id="FechaFin"
                    type="date"
                    value={formData.FechaFin}
                    onChange={(e) => setFormData({ ...formData, FechaFin: e.target.value })}
                    required
                    min={formData.FechaInicio}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingClase ? "Actualizar Clase" : "Crear Clase"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}