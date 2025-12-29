"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/ui/toast" // ✅ CAMBIO: desde components/ui/toast
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
  NombreSocio?: string
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

const CATEGORIAS = [
  {
    nombre: "Cardiovascular",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50/70 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-900/40",
    icon: Heart,
    clases: ["Zumba", "Spinning", "Cardio Box"],
  },
  {
    nombre: "Fuerza",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50/70 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-900/40",
    icon: Dumbbell,
    clases: ["Body Pump", "CrossFit", "Funcional", "Body Combat"],
  },
  {
    nombre: "Mente y Cuerpo",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50/70 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-900/40",
    icon: Brain,
    clases: ["Yoga", "Pilates"],
  },
  {
    nombre: "Baile",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50/70 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-900/40",
    icon: Music,
    clases: ["Zumba", "Groove", "Salsa"],
  },
  {
    nombre: "Artes Marciales",
    color: "text-yellow-800 dark:text-yellow-200",
    bgColor: "bg-yellow-50/70 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-900/40",
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
    ) {
      return cat
    }
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
        setSearchResults(Array.isArray(data) ? data : [])
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
        <div className="absolute z-30 w-full bg-popover text-popover-foreground border border-border p-2 text-xs text-muted-foreground mt-1 rounded-md shadow-md">
          Buscando...
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <ul className="absolute z-30 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-xl mt-1 max-h-52 overflow-y-auto">
          {searchResults.map((socio) => (
            <li
              key={socio.SocioID}
              className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center text-sm border-b border-border last:border-0"
              onMouseDown={() => handleSelectSocio(socio)}
            >
              <div className="flex flex-col">
                <span className="font-semibold">
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
        <div className="mt-2 p-2 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-md flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
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

  const handleHoraInicioChange = (hora: string) => {
    setFormData({ ...formData, HoraInicio: hora })
    if (formData.HoraFin && hora >= formData.HoraFin) {
      setFormData({ ...formData, HoraInicio: hora, HoraFin: sumarUnaHora(hora) })
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-popover text-popover-foreground border-border">
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
              className="justify-start border border-border p-1 rounded-lg bg-muted/50"
            >
              <ToggleGroupItem
                value="Grupal"
                className="flex-1 rounded-md data-[state=on]:bg-background data-[state=on]:text-foreground"
              >
                <Users className="h-4 w-4 mr-2" /> Grupal
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Personal"
                className="flex-1 rounded-md data-[state=on]:bg-background data-[state=on]:text-foreground"
              >
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

            <div className="md:col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={formData.Descripcion}
                onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                placeholder="Descripción breve de la clase (opcional)"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select
                value={formData.Categoria}
                onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
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
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
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
              <div className="md:col-span-2 p-4 bg-muted/30 border border-border rounded-lg border-dashed">
                <SocioSearch
                  SocioID={formData.SocioID}
                  SocioNombreCompleto={formData.SocioNombreCompleto}
                  setSocio={(id, n) => setFormData({ ...formData, SocioID: id, SocioNombreCompleto: n })}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div className="space-y-1.5">
                <Label>Hora Inicio *</Label>
                <Input
                  type="time"
                  value={formData.HoraInicio}
                  onChange={(e) => handleHoraInicioChange(e.target.value)}
                  min="06:00"
                  max="22:00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Hora Fin *</Label>
                <Input
                  type="time"
                  value={formData.HoraFin}
                  onChange={(e) => setFormData({ ...formData, HoraFin: e.target.value })}
                  min="07:00"
                  max="23:00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Cupo Máx. *</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.CupoMaximo}
                  onChange={(e) => setFormData({ ...formData, CupoMaximo: e.target.value })}
                  disabled={formData.TipoClase === "Personal"}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha Inicio *</Label>
              <Input
                type="date"
                value={formData.FechaInicio}
                onChange={(e) => setFormData({ ...formData, FechaInicio: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha Fin *</Label>
              <Input
                type="date"
                value={formData.FechaFin}
                onChange={(e) => setFormData({ ...formData, FechaFin: e.target.value })}
                min={formData.FechaInicio || new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
  const { toast } = useToast() // ✅ toast desde components/ui/toast

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

  const user = getUser()

  const cargarClases = useCallback(async () => {
    if (!user?.usuarioID) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await fetch(`/api/entrenador/clases?usuarioID=${user.usuarioID}`)
      if (response.ok) {
        const data = await response.json()
        setClases(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Error de conexión al cargar clases.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }, [user?.usuarioID, toast])

  useEffect(() => {
    if (user?.usuarioID) {
      setUsuarioID(user.usuarioID.toString())
      cargarClases()
    } else {
      setLoading(false)
    }
  }, [user?.usuarioID, cargarClases])

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingClase(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioID) return

    if (formData.HoraFin <= formData.HoraInicio) {
      toast({
        title: "Error",
        description: "La hora de fin debe ser posterior a la hora de inicio.",
        variant: "error",
      })
      return
    }

    if (formData.FechaFin < formData.FechaInicio) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio.",
        variant: "error",
      })
      return
    }

    if (formData.TipoClase === "Personal" && !formData.SocioID) {
      toast({
        title: "Error",
        description: "Debes seleccionar un socio para la sesión personal.",
        variant: "error",
      })
      return
    }

    try {
      const url = editingClase
        ? `/api/entrenador/clases?id=${editingClase.ClaseID}&usuarioID=${user.usuarioID}&tipo=${formData.TipoClase}`
        : `/api/entrenador/clases?usuarioID=${user.usuarioID}`

      const method = editingClase ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, CupoMaximo: Number.parseInt(formData.CupoMaximo, 10) }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingClase ? "Clase actualizada correctamente." : "Clase creada correctamente.",
          variant: "success",
        })
        setShowDialog(false)
        cargarClases()
        resetForm()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData?.error || "Ocurrió un problema.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Error de conexión.", variant: "error" })
    }
  }

  const handleDelete = async (clase: Clase) => {
    if (!confirm(`¿Seguro que deseas eliminar esta ${clase.TipoClase === "Personal" ? "sesión personal" : "clase grupal"}?`)) {
      return
    }
    if (!usuarioID) return

    try {
      const response = await fetch(
        `/api/entrenador/clases?id=${clase.ClaseID}&usuarioID=${user.usuarioID}&tipo=${clase.TipoClase}`,
        { method: "DELETE" },
      )

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `${clase.TipoClase === "Personal" ? "Sesión personal" : "Clase grupal"} eliminada correctamente.`,
          variant: "success",
        })
        cargarClases()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({ title: "Error", description: errorData?.error || "No se pudo eliminar.", variant: "error" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Error de conexión.", variant: "error" })
    }
  }

  const handleClaseClick = (id: number) => router.push(`/entrenador/clases/${id}`)

  const handleOpenDialog = (clase?: Clase, diaPredefinido?: string, horaPredefinida?: string) => {
    if (clase) {
      setEditingClase(clase)
      setFormData({
        NombreClase: clase.NombreClase,
        Descripcion: clase.Descripcion || "",
        DiaSemana: clase.DiaSemana || (Array.isArray(clase.DiasSemana) ? clase.DiasSemana[0] : ""),
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

  const filteredClases = useMemo(() => {
    const primerDiaSemana = fechasSemana[0]
    const ultimoDiaSemana = fechasSemana[6]

    const inicioSemana = new Date(primerDiaSemana)
    inicioSemana.setHours(0, 0, 0, 0)

    const finSemana = new Date(ultimoDiaSemana)
    finSemana.setHours(23, 59, 59, 999)

    return clases.filter((clase) => {
      if (clase.FechaFin) {
        const fechaFin = new Date(clase.FechaFin)
        fechaFin.setHours(23, 59, 59, 999)
        if (fechaFin < inicioSemana) return false
      }

      if (clase.FechaInicio) {
        const fechaInicio = new Date(clase.FechaInicio)
        fechaInicio.setHours(0, 0, 0, 0)
        if (fechaInicio > finSemana) return false
      }

      const matchesCat =
        categoriaFiltro === "Todas" ||
        (clase.Categoria || getCategoriaInfo(clase.NombreClase).nombre) === categoriaFiltro

      const matchesTipo = tipoFiltro === "Todas" || clase.TipoClase === tipoFiltro

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        clase.NombreClase?.toLowerCase().includes(searchLower) ||
        clase.Descripcion?.toLowerCase().includes(searchLower) ||
        clase.NombreEntrenador?.toLowerCase().includes(searchLower) ||
        (clase.TipoClase === "Personal" && clase.NombreSocio?.toLowerCase().includes(searchLower))

      return matchesCat && matchesTipo && matchesSearch
    })
  }, [clases, searchTerm, categoriaFiltro, tipoFiltro, fechasSemana])

  const calcularAlturaProporcional = (horaInicio: string, horaFin: string, bloqueInicio: string, bloqueFin: string) => {
    const horaInicioMin = Number.parseInt(horaInicio.split(":")[0]) * 60 + Number.parseInt(horaInicio.split(":")[1])
    const horaFinMin = Number.parseInt(horaFin.split(":")[0]) * 60 + Number.parseInt(horaFin.split(":")[1])
    const bloqueInicioMin = Number.parseInt(bloqueInicio.split(":")[0]) * 60 + Number.parseInt(bloqueInicio.split(":")[1])
    const bloqueFinMin = Number.parseInt(bloqueFin.split(":")[0]) * 60 + Number.parseInt(bloqueFin.split(":")[1])

    const duracionClase = horaFinMin - horaInicioMin
    const duracionBloque = bloqueFinMin - bloqueInicioMin
    if (duracionBloque === 0) return 0
    const porcentaje = (duracionClase / duracionBloque) * 100
    return Math.min(porcentaje, 100)
  }

  const calcularPosicionVertical = (horaInicio: string, bloqueInicio: string, bloqueFin: string) => {
    const horaInicioMin = Number.parseInt(horaInicio.split(":")[0]) * 60 + Number.parseInt(horaInicio.split(":")[1])
    const bloqueInicioMin = Number.parseInt(bloqueInicio.split(":")[0]) * 60 + Number.parseInt(bloqueInicio.split(":")[1])
    const bloqueFinMin = Number.parseInt(bloqueFin.split(":")[0]) * 60 + Number.parseInt(bloqueFin.split(":")[1])

    const offsetMinutos = horaInicioMin - bloqueInicioMin
    const duracionBloque = bloqueFinMin - bloqueInicioMin
    if (duracionBloque === 0) return 0
    const porcentaje = (offsetMinutos / duracionBloque) * 100
    return Math.max(porcentaje, 0)
  }

  const estaBloqueCompleto = (clasesEnBloque: any[], bloqueInicio: string, bloqueFin: string) => {
    const bloqueInicioMin = Number.parseInt(bloqueInicio.split(":")[0]) * 60 + Number.parseInt(bloqueInicio.split(":")[1])
    const bloqueFinMin = Number.parseInt(bloqueFin.split(":")[0]) * 60 + Number.parseInt(bloqueFin.split(":")[1])
    const duracionBloque = bloqueFinMin - bloqueInicioMin
    if (duracionBloque <= 0) return true

    let minutosOcupados = 0

    clasesEnBloque.forEach((clase) => {
      const inicio = Number.parseInt(formatearHora(clase.HoraInicio).split(":")[0]) * 60 + Number.parseInt(formatearHora(clase.HoraInicio).split(":")[1])
      const fin = Number.parseInt(formatearHora(clase.HoraFin).split(":")[0]) * 60 + Number.parseInt(formatearHora(clase.HoraFin).split(":")[1])

      const inicioEnBloque = Math.max(inicio, bloqueInicioMin)
      const finEnBloque = Math.min(fin, bloqueFinMin)
      const duracion = Math.max(0, finEnBloque - inicioEnBloque)
      minutosOcupados += duracion
    })

    const porcentajeOcupado = (minutosOcupados / duracionBloque) * 100
    return porcentajeOcupado >= 90
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Clases</h1>
            <p className="text-muted-foreground text-sm">Gestiona tus horarios y sesiones con socios.</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <ToggleGroup
              type="single"
              value={vistaActual}
              onValueChange={(v: any) => v && setVistaActual(v)}
              className="border border-border rounded-lg p-1 bg-muted/40"
            >
              <ToggleGroupItem value="calendario" className="data-[state=on]:bg-background data-[state=on]:text-foreground">
                <CalendarIcon className="h-4 w-4 mr-2" /> Calendario
              </ToggleGroupItem>
              <ToggleGroupItem value="lista" className="data-[state=on]:bg-background data-[state=on]:text-foreground">
                <ListIcon className="h-4 w-4 mr-2" /> Lista
              </ToggleGroupItem>
            </ToggleGroup>

            <Button onClick={() => handleOpenDialog()} className="shadow-md ml-auto">
              <Plus className="h-5 w-5 mr-1" /> Nueva Clase
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4 items-center">
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
          <Card className="rounded-xl overflow-hidden border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/40 py-4 border-b border-border px-4">
              <CardTitle className="text-base font-semibold text-foreground">Semana Actual</CardTitle>

              <div className="flex gap-1 border border-border rounded-md p-1 bg-background shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(semanaOffset - 1)}
                  className="h-7 w-7 p-0 text-foreground hover:bg-accent"
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(0)}
                  className="h-7 px-2 text-[10px] font-bold uppercase text-foreground hover:bg-accent"
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSemanaOffset(semanaOffset + 1)}
                  className="h-7 w-7 p-0 text-foreground hover:bg-accent"
                >
                  →
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <div className="grid grid-cols-[70px_repeat(7,minmax(150px,1fr))] min-w-[1100px] bg-background">
                <div className="bg-muted/60 p-2 text-center border-b border-r border-border font-bold text-[10px] text-foreground uppercase flex items-center justify-center">
                  Hora
                </div>

                {DIAS_SEMANA.map((dia, i) => {
                  const esHoy = fechasSemana[i].toDateString() === new Date().toDateString()
                  return (
                    <div
                      key={dia}
                      className={`p-2 text-center border-b border-r border-border ${esHoy ? "bg-primary/10" : "bg-background"}`}
                    >
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{dia.substring(0, 3)}</div>
                      <div className={`text-xl font-black ${esHoy ? "text-primary" : "text-foreground"}`}>
                        {fechasSemana[i].getDate()}
                      </div>
                    </div>
                  )
                })}

                {BLOQUES_HORARIO.map((bloque) => (
                  <React.Fragment key={bloque.inicio}>
                    <div className="p-2 border-b border-r border-border text-center text-[10px] font-bold bg-muted/60 text-foreground flex flex-col items-center justify-center leading-tight">
                      <div>{bloque.inicio}</div>
                      <div className="text-[8px] opacity-60">-</div>
                      <div>{bloque.fin}</div>
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
                        const b = Number.parseInt(bloque.inicio.split(":")[0]) * 60 + Number.parseInt(bloque.inicio.split(":")[1])
                        const bf = Number.parseInt(bloque.fin.split(":")[0]) * 60 + Number.parseInt(bloque.fin.split(":")[1])

                        return m >= b && m < bf
                      })

                      const bloqueCompleto = estaBloqueCompleto(clasesEnBloque, bloque.inicio, bloque.fin)

                      return (
                        <div
                          key={dia}
                          className={`border-b border-r border-border p-1.5 min-h-[120px] transition-colors relative ${
                            bloqueCompleto ? "bg-muted/70 cursor-not-allowed" : "bg-background hover:bg-accent/40 cursor-pointer group"
                          }`}
                          onClick={() => !bloqueCompleto && handleOpenDialog(undefined, dia, bloque.inicio)}
                        >
                          {clasesEnBloque.length === 0 && !bloqueCompleto && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-primary p-1 rounded-full text-primary-foreground shadow">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                          )}

                          {bloqueCompleto && clasesEnBloque.length > 0 && (
                            <div className="absolute top-2 right-2 opacity-80">
                              <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-[9px] font-bold shadow">
                                LLENO
                              </div>
                            </div>
                          )}

                          <div className="relative h-full">
                            {clasesEnBloque.map((c) => {
                              const cat = getCategoriaInfo(c.NombreClase, c.Categoria)

                              const alturaPorcentaje = calcularAlturaProporcional(
                                formatearHora(c.HoraInicio),
                                formatearHora(c.HoraFin),
                                bloque.inicio,
                                bloque.fin,
                              )
                              const posicionPorcentaje = calcularPosicionVertical(formatearHora(c.HoraInicio), bloque.inicio, bloque.fin)

                              const esPersonal = c.TipoClase === "Personal"

                              return (
                                <div
                                  key={c.ClaseID}
                                  className={[
                                    "p-2.5 rounded-lg text-xs shadow-sm hover:shadow-md transition-all absolute left-0 right-0 overflow-hidden group",
                                    "border",
                                    cat.bgColor,
                                    cat.borderColor,
                                    "text-foreground",
                                    esPersonal ? "border-l-4 border-l-primary" : "border-l-4 border-l-border",
                                  ].join(" ")}
                                  style={{
                                    height: `${alturaPorcentaje}%`,
                                    top: `${posicionPorcentaje}%`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (esPersonal) handleOpenDialog(c)
                                    else handleClaseClick(c.ClaseID)
                                  }}
                                >
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 bg-background/80 hover:bg-background border border-border"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenDialog(c)
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 bg-background/80 hover:bg-background border border-border text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(c)
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <div className={`font-bold truncate pr-2 uppercase text-[10px] tracking-tight ${cat.color}`}>
                                    {esPersonal ? `${c.NombreSocio} - Personal` : c.NombreClase}
                                  </div>

                                  <div className={`flex justify-between mt-1 items-center font-medium ${cat.color}`}>
                                    <span className="flex items-center gap-1 text-[9px]">
                                      <Clock className="h-3 w-3" /> {formatearHora(c.HoraInicio)} - {formatearHora(c.HoraFin)}
                                    </span>

                                    {esPersonal ? (
                                      <span className="flex items-center gap-1 text-[9px]">
                                        <User className="h-3 w-3" /> Personal
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[9px]">
                                        <Users className="h-3 w-3" /> {c.CuposOcupados || 0}/{c.CupoMaximo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl overflow-hidden border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-4 text-left">Clase</th>
                      <th className="p-4 text-left">Modalidad</th>
                      <th className="p-4 text-left">Horario</th>
                      <th className="p-4 text-left">Estado Cupos</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
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
                          className="group hover:bg-accent/30 cursor-pointer transition-colors"
                          onClick={() => handleClaseClick(clase.ClaseID)}
                        >
                          <td className="p-4">
                            <div className="font-black text-base text-foreground">{clase.NombreClase}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] py-0">
                                {cat.nombre}
                              </Badge>
                            </div>
                          </td>

                          <td className="p-4">
                            <Badge
                              variant={clase.TipoClase === "Personal" ? "secondary" : "outline"}
                              className={clase.TipoClase === "Personal" ? "bg-primary/10 text-primary border-primary/20" : ""}
                            >
                              {clase.TipoClase === "Personal" ? <User className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                              {clase.TipoClase}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold flex items-center gap-1 text-foreground">
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
                                  />
                                </div>
                                <span className="font-bold text-xs text-foreground">
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(clase)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(clase)}>
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