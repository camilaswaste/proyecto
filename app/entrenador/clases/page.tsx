// app/entrenador/clases/page.tsx
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/hooks/use-toast"
import { getUser } from "@/lib/auth-client"
import {
    Brain,
    CalendarIcon,
    Clock,
    Dumbbell,
    Edit,
    Heart,
    ListIcon,
    MapPin,
    Music,
    Plus,
    Search,
    Sword,
    Trash2,
    User,
    Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useState } from "react"

// --- TIPOS DE DATOS ---

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
  TipoClase: "Grupal" | "Personal"
}

interface Socio {
  SocioID: number
  Nombre: string
  Apellido: string
  Email: string
}

interface ClaseFormData {
  NombreClase: string
  Descripcion: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: string
  FechaInicio: string
  FechaFin: string
  Categoria: string
  TipoClase: "Grupal" | "Personal"
  SocioID: string
  SocioNombreCompleto: string
}

// --- CONSTANTES y UTILIDADES ---

const CATEGORIAS = [
  {
    nombre: "Cardiovascular",
    color: "bg-red-600 hover:bg-red-700",
    icon: Heart,
    clases: ["Zumba", "Spinning", "Cardio Box"],
  },
  {
    nombre: "Fuerza",
    color: "bg-orange-600 hover:bg-orange-700",
    icon: Dumbbell,
    clases: ["Body Pump", "CrossFit", "Funcional", "Body Combat"],
  },
  { nombre: "Mente y Cuerpo", color: "bg-green-600 hover:bg-green-700", icon: Brain, clases: ["Yoga", "Pilates"] },
  { nombre: "Baile", color: "bg-purple-600 hover:bg-purple-700", icon: Music, clases: ["Zumba", "Groove", "Salsa"] },
  {
    nombre: "Artes Marciales",
    color: "bg-yellow-600 hover:bg-yellow-700",
    icon: Sword,
    clases: ["Cardio Box", "Kickboxing", "Muay Thai"],
  },
]

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const BLOQUES_HORARIO = [
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

const getCategoriaInfo = (nombreClase: string, categoria?: string) => {
  const nombre = (categoria || nombreClase).toLowerCase().trim()
  for (const cat of CATEGORIAS) {
    if (
      nombre === cat.nombre.toLowerCase() ||
      cat.clases.some((c) => nombreClase.toLowerCase().includes(c.toLowerCase()))
    )
      return cat
  }
  return CATEGORIAS[0]
}

const formatearHora = (hora: string): string => {
  if (!hora) return "00:00"
  if (hora.includes("T")) return hora.split("T")[1].substring(0, 5)
  return hora.substring(0, 5)
}

const sumarUnaHora = (horaStr: string): string => {
  const [h, m] = horaStr.split(":").map(Number)
  const nuevaH = (h + 1) % 24
  return `${nuevaH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

const normalizeDay = (day: any): string => {
  if (typeof day !== "string" || !day) return ""
  return day
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// --- COMPONENTE DE BÚSQUEDA DE SOCIOS ---
interface SocioSearchProps {
  SocioID: string
  SocioNombreCompleto: string
  setSocio: (id: string, nombre: string) => void
}

const SocioSearch: React.FC<SocioSearchProps> = ({ SocioID, SocioNombreCompleto, setSocio }) => {
  const [searchText, setSearchText] = useState(SocioNombreCompleto || "")
  const [searchResults, setSearchResults] = useState<Socio[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchText.length < 3) {
      setSearchResults([])
      return
    }
    const delayDebounceFn = setTimeout(() => {
      fetchSocios(searchText)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchText])

  const fetchSocios = async (search: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/entrenador/socios?search=${encodeURIComponent(search)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSocio = (socio: Socio) => {
    const nombreCompleto = `${socio.Nombre} ${socio.Apellido}`
    setSocio(socio.SocioID.toString(), nombreCompleto)
    setSearchText(nombreCompleto)
    setShowResults(false)
  }

  return (
    <div className="relative">
      <Label className="text-sm font-medium mb-1.5 block">Buscar Socio para Clase Personal *</Label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Escribe nombre o email del socio..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value)
            if (SocioID && e.target.value !== SocioNombreCompleto) setSocio("", "")
          }}
          onFocus={() => searchText.length >= 3 && setShowResults(true)}
          className="pl-9"
        />
      </div>
      {isSearching && (
        <div className="absolute z-30 w-full bg-background border p-2 text-xs text-muted-foreground mt-1 rounded-md shadow-md">
          Buscando...
        </div>
      )}
      {showResults && searchResults.length > 0 && (
        <ul className="absolute z-30 w-full bg-background border rounded-md shadow-xl mt-1 max-h-52 overflow-y-auto border-primary/20">
          {searchResults.map((socio) => (
            <li
              key={socio.SocioID}
              className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center text-sm border-b last:border-0"
              onMouseDown={() => handleSelectSocio(socio)}
            >
              <div className="flex flex-col">
                <span className="font-bold">
                  {socio.Nombre} {socio.Apellido}
                </span>
                <span className="text-xs text-muted-foreground">{socio.Email}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-tighter">
                Seleccionar
              </Button>
            </li>
          ))}
        </ul>
      )}
      {SocioID && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2 text-green-700 dark:text-green-400 text-xs">
          <User className="h-3 w-3" /> Socio vinculado: <strong>{SocioNombreCompleto}</strong>
        </div>
      )}
    </div>
  )
}

// --- DIÁLOGO DE FORMULARIO ---
interface ClaseFormDialogProps {
  showDialog: boolean
  setShowDialog: (show: boolean) => void
  editingClase: Clase | null
  formData: ClaseFormData
  setFormData: React.Dispatch<React.SetStateAction<ClaseFormData>>
  handleSubmit: (e: React.FormEvent) => void
}

const ClaseFormDialog: React.FC<ClaseFormDialogProps> = ({
  showDialog,
  setShowDialog,
  editingClase,
  formData,
  setFormData,
  handleSubmit,
}) => {
  const handleTipoClaseChange = (tipo: "Grupal" | "Personal") => {
    setFormData((prev) => ({
      ...prev,
      TipoClase: tipo,
      CupoMaximo: tipo === "Personal" ? "1" : prev.CupoMaximo === "1" ? "15" : prev.CupoMaximo,
      SocioID: "",
      SocioNombreCompleto: "",
    }))
  }
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClase ? "Editar Clase" : "Programar Nueva Clase"}</DialogTitle>
          <DialogDescription>Completa los campos para organizar tu sesión.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Modalidad</Label>
            <ToggleGroup
              type="single"
              value={formData.TipoClase}
              onValueChange={(v: any) => v && handleTipoClaseChange(v)}
              className="justify-start border p-1 rounded-lg bg-muted/50"
            >
              <ToggleGroupItem value="Grupal" className="flex-1 rounded-md">
                <Users className="h-4 w-4 mr-2" /> Grupal
              </ToggleGroupItem>
              <ToggleGroupItem value="Personal" className="flex-1 rounded-md">
                <User className="h-4 w-4 mr-2" /> Personal
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Nombre de la Clase *</Label>
              <Input
                value={formData.NombreClase}
                onChange={(e) => setFormData({ ...formData, NombreClase: e.target.value })}
                required
                placeholder="Ej: Entrenamiento Funcional Pro"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select
                value={formData.Categoria}
                onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
                className="w-full border rounded-md p-2 bg-background h-10 text-sm"
                required
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.nombre} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Día de la Semana *</Label>
              <select
                value={formData.DiaSemana}
                onChange={(e) => setFormData({ ...formData, DiaSemana: e.target.value })}
                className="w-full border rounded-md p-2 bg-background h-10 text-sm"
                required
              >
                <option value="">Seleccionar Día</option>
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>

            {formData.TipoClase === "Personal" && (
              <div className="md:col-span-2 p-4 bg-muted/30 border rounded-lg border-dashed">
                <SocioSearch
                  SocioID={formData.SocioID}
                  SocioNombreCompleto={formData.SocioNombreCompleto}
                  setSocio={(id, n) => setFormData({ ...formData, SocioID: id, SocioNombreCompleto: n })}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div className="space-y-1.5">
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={formData.HoraInicio}
                  onChange={(e) => setFormData({ ...formData, HoraInicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={formData.HoraFin}
                  onChange={(e) => setFormData({ ...formData, HoraFin: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cupo Máx.</Label>
                <Input
                  type="number"
                  value={formData.CupoMaximo}
                  onChange={(e) => setFormData({ ...formData, CupoMaximo: e.target.value })}
                  disabled={formData.TipoClase === "Personal"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={formData.FechaInicio}
                onChange={(e) => setFormData({ ...formData, FechaInicio: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={formData.FechaFin}
                onChange={(e) => setFormData({ ...formData, FechaFin: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="min-w-[120px]">
              {editingClase ? "Actualizar" : "Crear Clase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- COMPONENTE PRINCIPAL ---
export default function EntrenadorClasesPage() {
  const router = useRouter()
  const [usuarioID, setUsuarioID] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [clases, setClases] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClase, setEditingClase] = useState<Clase | null>(null)
  const [vistaActual, setVistaActual] = useState<"calendario" | "lista">("calendario")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas")
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todas")
  const [semanaOffset, setSemanaOffset] = useState(0)

  const defaultFormData: ClaseFormData = {
    NombreClase: "",
    Descripcion: "",
    DiaSemana: "",
    HoraInicio: "08:00",
    HoraFin: "09:00",
    CupoMaximo: "15",
    FechaInicio: new Date().toISOString().split("T")[0],
    FechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    Categoria: CATEGORIAS[0].nombre,
    TipoClase: "Grupal",
    SocioID: "",
    SocioNombreCompleto: "",
  }
  const [formData, setFormData] = useState<ClaseFormData>(defaultFormData)

  useEffect(() => {
    const user = getUser()
    if (user?.usuarioID) {
      setUsuarioID(user.usuarioID.toString())
      fetchClases(user.usuarioID.toString())
    } else setLoading(false)
  }, [])

  const fetchClases = useCallback(async (uID: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/entrenador/clases?usuarioID=${uID}`)
      if (response.ok) setClases(await response.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpenDialog = (clase?: Clase, diaPredefinido?: string, horaPredefinida?: string) => {
    if (clase) {
      setEditingClase(clase)
      setFormData({
        NombreClase: clase.NombreClase,
        Descripcion: clase.Descripcion || "",
        DiaSemana: clase.DiaSemana || clase.DiasSemana?.[0] || "",
        HoraInicio: formatearHora(clase.HoraInicio),
        HoraFin: formatearHora(clase.HoraFin),
        CupoMaximo: clase.CupoMaximo.toString(),
        FechaInicio: clase.FechaInicio ? new Date(clase.FechaInicio).toISOString().split("T")[0] : "",
        FechaFin: clase.FechaFin ? new Date(clase.FechaFin).toISOString().split("T")[0] : "",
        Categoria: clase.Categoria || getCategoriaInfo(clase.NombreClase).nombre,
        TipoClase: clase.CupoMaximo === 1 ? "Personal" : "Grupal",
        SocioID: "",
        SocioNombreCompleto: "",
      })
    } else {
      setEditingClase(null)
      setFormData({
        ...defaultFormData,
        DiaSemana: diaPredefinido || "",
        HoraInicio: horaPredefinida || "08:00",
        HoraFin: horaPredefinida ? sumarUnaHora(horaPredefinida) : "09:00",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioID) return
    try {
      const isEditing = !!editingClase
      const url = isEditing
        ? `/api/entrenador/clases?id=${editingClase.ClaseID}&usuarioID=${usuarioID}`
        : `/api/entrenador/clases?usuarioID=${usuarioID}`
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, CupoMaximo: Number.parseInt(formData.CupoMaximo) }),
      })
      if (response.ok) {
        setShowDialog(false)
        fetchClases(usuarioID)
        toast({ title: "Cambios guardados" })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar clase?") || !usuarioID) return
    const response = await fetch(`/api/entrenador/clases?id=${id}&usuarioID=${usuarioID}`, { method: "DELETE" })
    if (response.ok) fetchClases(usuarioID)
  }

  const handleClaseClick = (id: number) => router.push(`/entrenador/clases/${id}`)

  const fechasSemana = useMemo(() => {
    const hoy = new Date()
    const p = new Date(hoy)
    const d = hoy.getDay()
    const diff = hoy.getDate() - d + (d === 0 ? -6 : 1)
    p.setDate(diff + semanaOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(p)
      f.setDate(p.getDate() + i)
      return f
    })
  }, [semanaOffset])

  const clasesFiltradas = useMemo(() => {
    return clases.filter((c) => {
      const matchesBusqueda = c.NombreClase.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCat =
        categoriaFiltro === "Todas" || (c.Categoria || getCategoriaInfo(c.NombreClase).nombre) === categoriaFiltro
      const matchesTipo = tipoFiltro === "Todas" || c.TipoClase === tipoFiltro
      return matchesBusqueda && matchesCat && matchesTipo
    })
  }, [clases, searchTerm, categoriaFiltro, tipoFiltro])

  const filteredClases = useMemo(() => {
    const inicioS = new Date(fechasSemana[0].setHours(0, 0, 0, 0))
    const finS = new Date(fechasSemana[6].setHours(23, 59, 59, 999))
    return clasesFiltradas.filter((c) => {
      const fi = c.FechaInicio ? new Date(c.FechaInicio) : null
      const ff = c.FechaFin ? new Date(c.FechaFin) : null
      return (!fi || fi <= finS) && (!ff || ff >= inicioS)
    })
  }, [clasesFiltradas, fechasSemana])

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Clases</h1>
            <p className="text-muted-foreground text-sm">Gestiona tus horarios y sesiones con socios.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <ToggleGroup
              type="single"
              value={vistaActual}
              onValueChange={(v: any) => v && setVistaActual(v)}
              className="border rounded-lg p-1 bg-muted/40"
            >
              <ToggleGroupItem value="calendario" className="data-[state=on]:bg-background">
                <CalendarIcon className="h-4 w-4 mr-2" /> Calendario
              </ToggleGroupItem>
              <ToggleGroupItem value="lista" className="data-[state=on]:bg-background">
                <ListIcon className="h-4 w-4 mr-2" /> Lista
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => handleOpenDialog()} className="shadow-md ml-auto">
              <Plus className="h-5 w-5 mr-1" /> Nueva Clase
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-muted/30 p-4 rounded-xl border flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 flex gap-2 overflow-x-auto w-full pb-2 lg:pb-0">
            {["Todas", "Cardiovascular", "Fuerza", "Mente y Cuerpo", "Baile", "Artes Marciales"].map((cat) => (
              <Badge
                key={cat}
                variant={categoriaFiltro === cat ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-3 py-1"
                onClick={() => setCategoriaFiltro(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <Separator orientation="vertical" className="hidden lg:block h-6" />
          <div className="flex gap-2 w-full lg:w-auto">
            {["Todas", "Grupal", "Personal"].map((t) => (
              <Badge
                key={t}
                variant={tipoFiltro === t ? "secondary" : "outline"}
                className="cursor-pointer px-4"
                onClick={() => setTipoFiltro(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {vistaActual === "calendario" ? (
          <Card className="rounded-xl overflow-hidden border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 py-3 border-b px-4">
              <CardTitle className="text-base font-semibold">Semana Actual</CardTitle>
              <div className="flex gap-1 border rounded-md p-1 bg-background shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(semanaOffset - 1)}
                  className="h-7 w-7 p-0"
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(0)}
                  className="h-7 px-2 text-[10px] font-bold uppercase"
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(semanaOffset + 1)}
                  className="h-7 w-7 p-0"
                >
                  →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="grid grid-cols-[70px_repeat(7,minmax(150px,1fr))] min-w-[1100px] bg-background">
                <div className="bg-muted/10 p-2 text-center border-b border-r font-bold text-[10px] text-muted-foreground uppercase flex items-center justify-center">
                  Hora
                </div>
                {DIAS_SEMANA.map((dia, i) => (
                  <div
                    key={dia}
                    className={`p-2 text-center border-b border-r bg-muted/5 ${fechasSemana[i].toDateString() === new Date().toDateString() ? "bg-primary/5" : ""}`}
                  >
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{dia.substring(0, 3)}</div>
                    <div
                      className={`text-xl font-black ${fechasSemana[i].toDateString() === new Date().toDateString() ? "text-primary" : ""}`}
                    >
                      {fechasSemana[i].getDate()}
                    </div>
                  </div>
                ))}
                {BLOQUES_HORARIO.map((bloque) => (
                  <React.Fragment key={bloque.inicio}>
                    <div className="p-2 border-b border-r text-center text-[10px] font-bold bg-muted/5 text-muted-foreground flex items-center justify-center">
                      {bloque.inicio}
                    </div>
                    {DIAS_SEMANA.map((dia) => {
                      const normalizedHeader = normalizeDay(dia)
                      const clasesEnBloque = filteredClases.filter((clase) => {
                        const diasClase = Array.from(
                          new Set([
                            ...(clase.DiaSemana ? clase.DiaSemana.split(",").map((d) => normalizeDay(d.trim())) : []),
                            ...(Array.isArray(clase.DiasSemana) ? clase.DiasSemana.map((d) => normalizeDay(d)) : []),
                          ]),
                        ).filter(Boolean)
                        if (!diasClase.includes(normalizedHeader)) return false
                        const h = formatearHora(clase.HoraInicio)
                        const m = Number.parseInt(h.split(":")[0]) * 60 + Number.parseInt(h.split(":")[1])
                        const b =
                          Number.parseInt(bloque.inicio.split(":")[0]) * 60 +
                          Number.parseInt(bloque.inicio.split(":")[1])
                        const bf =
                          Number.parseInt(bloque.fin.split(":")[0]) * 60 + Number.parseInt(bloque.fin.split(":")[1])
                        return m >= b && m < bf
                      })
                      return (
                        <div
                          key={dia}
                          className="border-b border-r p-1.5 min-h-[120px] bg-background hover:bg-primary/5 transition-colors cursor-pointer group relative"
                          onClick={() => handleOpenDialog(undefined, dia, bloque.inicio)}
                        >
                          {clasesEnBloque.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-primary/10 p-1 rounded-full text-primary">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                          {clasesEnBloque.map((c) => {
                            const cat = getCategoriaInfo(c.NombreClase, c.Categoria)
                            return (
                              <div
                                key={c.ClaseID}
                                className={`${cat.color} text-white p-2.5 rounded-lg text-xs mb-1.5 shadow-sm hover:brightness-110 transition-all border-l-4 border-black/20`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClaseClick(c.ClaseID)
                                }}
                              >
                                <div className="font-bold truncate pr-2 uppercase text-[10px] tracking-tight">
                                  {c.NombreClase}
                                </div>
                                <div className="flex justify-between mt-2 items-center opacity-90 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {formatearHora(c.HoraInicio)}
                                  </span>
                                  {c.TipoClase === "Personal" ? (
                                    <User className="h-3 w-3" />
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {c.CuposOcupados || 0}/{c.CupoMaximo}
                                    </span>
                                  )}
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
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl overflow-hidden border-muted/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-4 text-left">Clase</th>
                      <th className="p-4 text-left">Modalidad</th>
                      <th className="p-4 text-left">Horario</th>
                      <th className="p-4 text-left">Estado Cupos</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClases.map((clase) => {
                      const diasUnicos = Array.from(
                        new Set([
                          ...(clase.DiaSemana ? clase.DiaSemana.split(",").map((d) => d.trim()) : []),
                          ...(Array.isArray(clase.DiasSemana) ? clase.DiasSemana : []),
                        ]),
                      ).filter(Boolean)
                      const diaTexto = diasUnicos.join(", ") || "N/A"
                      const cat = getCategoriaInfo(clase.NombreClase, clase.Categoria)
                      return (
                        <tr
                          key={clase.ClaseID}
                          className="group hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => handleClaseClick(clase.ClaseID)}
                        >
                          <td className="p-4">
                            <div className="font-black text-base">{clase.NombreClase}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] py-0">
                                {cat.nombre}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={clase.TipoClase === "Personal" ? "secondary" : "outline"}
                              className={
                                clase.TipoClase === "Personal" ? "bg-indigo-100 text-indigo-700 border-indigo-200" : ""
                              }
                            >
                              {clase.TipoClase === "Personal" ? (
                                <User className="h-3 w-3 mr-1" />
                              ) : (
                                <Users className="h-3 w-3 mr-1" />
                              )}
                              {clase.TipoClase}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {diaTexto}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatearHora(clase.HoraInicio)} - {formatearHora(clase.HoraFin)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {clase.TipoClase === "Personal" ? (
                              <span className="text-muted-foreground italic text-xs">Cupo único</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-muted h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-primary h-full"
                                    style={{
                                      width: `${Math.min(((clase.CuposOcupados || 0) / clase.CupoMaximo) * 100, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="font-bold text-xs">
                                  {clase.CuposOcupados || 0}/{clase.CupoMaximo}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div
                              className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenDialog(clase)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(clase.ClaseID)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ClaseFormDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        editingClase={editingClase}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
      />
    </DashboardLayout>
  )
}
