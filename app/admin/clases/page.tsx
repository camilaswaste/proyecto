"use client"

import React, { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CalendarIcon,
  Users,
  Clock,
  Dumbbell,
  Heart,
  Brain,
  Music,
  Sword,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  CuposOcupados?: number // Agregar campo para cupos ocupados
}

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
}

const categorias = [
  { nombre: "Cardiovascular", color: "bg-red-500", icon: Heart, clases: ["Zumba", "Spinning", "Cardio Box"] },
  {
    nombre: "Fuerza",
    color: "bg-orange-500",
    icon: Dumbbell,
    clases: ["Body Pump", "CrossFit", "Funcional", "Body Combat"],
  },
  { nombre: "Mente y Cuerpo", color: "bg-green-500", icon: Brain, clases: ["Yoga", "Pilates"] },
  { nombre: "Baile", color: "bg-purple-500", icon: Music, clases: ["Zumba", "Groove", "Salsa"] },
  { nombre: "Artes Marciales", color: "bg-yellow-500", icon: Sword, clases: ["Cardio Box", "Kickboxing", "Muay Thai"] },
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

const horasDelDia = Array.from({ length: 35 }, (_, i) => {
  const hora = Math.floor(i / 2) + 6
  const minutos = i % 2 === 0 ? "00" : "30"
  return `${String(hora).padStart(2, "0")}:${minutos}`
}).filter((h) => {
  const [hora] = h.split(":")
  return Number.parseInt(hora) <= 23
})

export default function AdminClasesPage() {
  const router = useRouter()
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
  }, [])

  const fetchClases = async () => {
    try {
      const response = await fetch("/api/admin/clases")
      if (response.ok) {
        const data = await response.json()
        setClases(data)
      }
    } catch (error) {
      console.error("Error al cargar clases:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/admin/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    }
  }

  const determinarCategoria = (nombreClase: string): string => {
    const nombre = nombreClase.toLowerCase().trim()

    for (const cat of categorias) {
      for (const claseCategoria of cat.clases) {
        if (nombre === claseCategoria.toLowerCase() || nombre.includes(claseCategoria.toLowerCase())) {
          return cat.nombre
        }
      }
    }

    return "Cardiovascular"
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
        Categoria: clase.Categoria || determinarCategoria(clase.NombreClase),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.DiasSemana.length === 0) {
      alert("Debes seleccionar al menos un día de la semana")
      return
    }

    if (!formData.FechaInicio || !formData.FechaFin) {
      alert("Debes especificar las fechas de inicio y fin de la clase")
      return
    }

    if (new Date(formData.FechaFin) <= new Date(formData.FechaInicio)) {
      alert("La fecha de fin debe ser posterior a la fecha de inicio")
      return
    }

    try {
      const url = editingClase ? `/api/admin/clases?id=${editingClase.ClaseID}` : "/api/admin/clases"
      const method = editingClase ? "PUT" : "POST"

      console.log("[v0] Guardando clase con categoría:", formData)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchClases()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar clase")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar clase")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta clase?")) return

    try {
      const response = await fetch(`/api/admin/clases?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchClases()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      DiasSemana: prev.DiasSemana.includes(dia) ? prev.DiasSemana.filter((d) => d !== dia) : [...prev.DiasSemana, dia],
    }))
  }

  const getCategoriaColor = (nombreClase: string, categoria?: string): string => {
    const cat = categoria || determinarCategoria(nombreClase)
    const categoriaInfo = categorias.find((c) => c.nombre === cat)
    return categoriaInfo?.color || "bg-gray-500"
  }

  const obtenerSemanaActual = () => {
    const hoy = new Date()
    const primerDia = new Date(hoy)
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1 + semanaOffset * 7) // Lunes

    const fechasSemana = []
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(primerDia)
      fecha.setDate(primerDia.getDate() + i)
      fechasSemana.push(fecha)
    }

    return fechasSemana
  }

  const fechasSemana = obtenerSemanaActual()

  const formatearHora = (hora: string): string => {
    if (!hora) return "00:00"

    // Si la hora viene como timestamp completo (1970-01-01T08:00:00)
    if (hora.includes("T")) {
      return hora.split("T")[1].substring(0, 5)
    }

    // Si ya viene en formato HH:MM:SS
    if (hora.length >= 5) {
      return hora.substring(0, 5)
    }

    return hora
  }

  const formatearRangoSemana = () => {
    const primerDia = fechasSemana[0]
    const ultimoDia = fechasSemana[6]

    const opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    return `${primerDia.toLocaleDateString("es-ES", opciones)} - ${ultimoDia.toLocaleDateString("es-ES", opciones)}`
  }

  const obtenerCategoria = (nombreClase: string, categoriaGuardada?: string) => {
    if (categoriaGuardada) {
      const cat = categorias.find((c) => c.nombre === categoriaGuardada)
      if (cat) return cat
    }

    const nombreCat = determinarCategoria(nombreClase)
    const cat = categorias.find((c) => c.nombre === nombreCat)
    return cat || categorias[0]
  }

  const clasesFiltradas = useMemo(() => {
    let resultado = clases

    if (categoriaFiltro !== "Todas") {
      resultado = resultado.filter((clase) => {
        const categoriaClase = clase.Categoria || determinarCategoria(clase.NombreClase)
        console.log(
          `[v0] Filtrando clase "${clase.NombreClase}" - Categoría DB: "${clase.Categoria}" - Categoría detectada: "${categoriaClase}" - Filtro: "${categoriaFiltro}"`,
        )
        return categoriaClase === categoriaFiltro
      })
    }

    if (searchTerm) {
      resultado = resultado.filter(
        (clase) =>
          clase.NombreClase.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clase.NombreEntrenador.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return resultado
  }, [clases, categoriaFiltro, searchTerm])

  const filteredClases = useMemo(() => {
    return clasesFiltradas.filter((clase) => {
      const primerDiaSemana = fechasSemana[0]
      const ultimoDiaSemana = fechasSemana[6]
      const fechaInicio = clase.FechaInicio ? new Date(clase.FechaInicio) : null
      const fechaFin = clase.FechaFin ? new Date(clase.FechaFin) : null

      let matchFecha = true
      if (fechaInicio && fechaFin) {
        matchFecha = fechaInicio <= ultimoDiaSemana && fechaFin >= primerDiaSemana
      }

      return matchFecha
    })
  }, [clasesFiltradas, fechasSemana])

  const stats = {
    totalClases: clases.length,
    clasesActivas: clases.filter((c) => c.Estado).length,
    cupoTotal: clases.reduce((sum, c) => sum + c.CupoMaximo, 0),
    entrenadores: new Set(clases.map((c) => c.EntrenadorID)).size,
  }

  const handleClaseClick = (claseId: number) => {
    router.push(`/admin/clases/${claseId}`)
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Clases Grupales</h1>
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Clases</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalClases}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clases Activas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.clasesActivas}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cupo Total</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.cupoTotal}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entrenadores</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.entrenadores}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categorías */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías de Clases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={categoriaFiltro === "Todas" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategoriaFiltro("Todas")}
              >
                Todas
              </Badge>
              {categorias.map((cat) => {
                const Icon = cat.icon
                return (
                  <Badge
                    key={cat.nombre}
                    variant={categoriaFiltro === cat.nombre ? "default" : "outline"}
                    className={`cursor-pointer ${categoriaFiltro === cat.nombre ? cat.color : ""} ${categoriaFiltro === cat.nombre ? "text-white" : ""}`}
                    onClick={() => setCategoriaFiltro(cat.nombre)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cat.nombre}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vista de Calendario Semanal */}
        {vistaActual === "calendario" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Calendario Semanal</CardTitle>
                  <CardDescription>{formatearRangoSemana()}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSemanaOffset(semanaOffset - 1)}>
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSemanaOffset(0)}
                      disabled={semanaOffset === 0}
                    >
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
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[100px_repeat(7,minmax(150px,1fr))] gap-0 min-w-[1200px]">
                  <div className="font-semibold p-2 text-center sticky left-0 bg-background">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    Hora
                  </div>
                  {diasSemana.map((dia, index) => {
                    const fecha = fechasSemana[index]
                    const esHoy = fecha.toDateString() === new Date().toDateString()

                    return (
                      <div
                        key={dia}
                        className={`font-semibold p-2 text-center rounded-t-lg ${
                          esHoy ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div>{dia}</div>
                        <div className="text-lg font-bold">{fecha.getDate()}</div>
                        <div className="text-xs opacity-80">
                          {fecha.toLocaleDateString("es-ES", { month: "short" })}
                        </div>
                      </div>
                    )
                  })}

                  {bloquesHorario.map((bloque) => (
                    <React.Fragment key={`${bloque.inicio}-${bloque.fin}`}>
                      <div className="p-2 text-sm text-muted-foreground text-center border-r sticky left-0 bg-background">
                        <div className="font-semibold">{bloque.inicio}</div>
                        <div className="text-xs">-</div>
                        <div className="font-semibold">{bloque.fin}</div>
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

                          return (
                            clase.DiaSemana === dia && horaInicioNum >= bloqueInicioNum && horaInicioNum < bloqueFinNum
                          )
                        })

                        return (
                          <div
                            key={dia}
                            className="border p-1 min-h-[100px] bg-card hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer relative group"
                            onClick={() => {
                              if (clasesEnBloque.length === 0) {
                                handleOpenDialogFromCalendar(dia, bloque.inicio)
                              }
                            }}
                          >
                            {clasesEnBloque.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            {clasesEnBloque.map((clase) => (
                              <div
                                key={clase.ClaseID}
                                className={`${getCategoriaColor(clase.NombreClase, clase.Categoria)} text-white p-2 rounded text-xs mb-1 hover:opacity-90 transition-opacity relative group/card cursor-pointer`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClaseClick(clase.ClaseID)
                                }}
                              >
                                {(() => {
                                  const cuposDisponibles = clase.CupoMaximo - (clase.CuposOcupados || 0)
                                  const porcentajeDisponible = (cuposDisponibles / clase.CupoMaximo) * 100

                                  if (porcentajeDisponible <= 20 && cuposDisponibles > 0) {
                                    return (
                                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse z-20">
                                        ¡{cuposDisponibles} cupos!
                                      </div>
                                    )
                                  }

                                  if (cuposDisponibles === 0) {
                                    return (
                                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20">
                                        LLENO
                                      </div>
                                    )
                                  }

                                  return null
                                })()}

                                <div className="font-semibold truncate">{clase.NombreClase}</div>
                                <div className="text-xs opacity-90">{clase.NombreEntrenador}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {clase.CupoMaximo - (clase.CuposOcupados || 0)}/{clase.CupoMaximo}
                                  </span>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenDialog(clase)
                                    }}
                                    className="bg-white/20 hover:bg-white/30 rounded p-1 transition-colors"
                                    title="Editar clase"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(clase.ClaseID)
                                    }}
                                    className="bg-red-500/80 hover:bg-red-600 rounded p-1 transition-colors"
                                    title="Eliminar clase"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clases Programadas</CardTitle>
                  <CardDescription>Total: {filteredClases.length} clases</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clase..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Clase</th>
                      <th className="text-left p-3 font-medium">Categoría</th>
                      <th className="text-left p-3 font-medium">Entrenador</th>
                      <th className="text-left p-3 font-medium">Días</th>
                      <th className="text-left p-3 font-medium">Horario</th>
                      <th className="text-left p-3 font-medium">Cupo</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
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
                        const categoria = determinarCategoria(clase.NombreClase)
                        const categoriaInfo = categorias.find((c) => c.nombre === categoria)
                        const Icon = categoriaInfo?.icon || Heart

                        return (
                          <tr
                            key={clase.ClaseID}
                            className="border-t hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleClaseClick(clase.ClaseID)}
                          >
                            <td className="p-3 font-medium">{clase.NombreClase}</td>
                            <td className="p-3">
                              <Badge className={`${categoriaInfo?.color} text-white`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {clase.Categoria || categoria}
                              </Badge>
                            </td>
                            <td className="p-3">{clase.NombreEntrenador}</td>
                            <td className="p-3">
                              {Array.isArray(clase.DiasSemana) ? clase.DiasSemana.join(", ") : clase.DiaSemana || "N/A"}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
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

        {/* Dialog para Crear/Editar Clase */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClase ? "Editar Clase" : "Nueva Clase Grupal"}</DialogTitle>
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
                    className="w-full border rounded-md p-2 min-h-[80px]"
                    placeholder="Describe la clase, nivel requerido, beneficios..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="Categoria">Categoría *</Label>
                  <select
                    id="Categoria"
                    value={formData.Categoria}
                    onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    {categorias.map((cat) => {
                      const Icon = cat.icon
                      return (
                        <option key={cat.nombre} value={cat.nombre}>
                          {cat.nombre}
                        </option>
                      )
                    })}
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define la categoría de la clase para organizarla en el calendario
                  </p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="EntrenadorID">Entrenador *</Label>
                  <select
                    id="EntrenadorID"
                    value={formData.EntrenadorID}
                    onChange={(e) => setFormData({ ...formData, EntrenadorID: e.target.value })}
                    className="w-full border rounded-md p-2"
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
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor={`dia-${dia}`} className="text-sm font-medium leading-none cursor-pointer">
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

              <div className="flex justify-end gap-2 pt-4 border-t">
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
