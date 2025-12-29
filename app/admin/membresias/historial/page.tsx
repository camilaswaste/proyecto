"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Filter,
  Plus,
  Power,
  PowerOff,
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface HistorialEntry {
  AuditoriaID: number
  PlanID: number | null
  NombrePlan: string
  TipoAccion: "CREAR" | "MODIFICAR" | "ACTIVAR" | "DESACTIVAR"
  FechaAccion: string
  CamposModificados: string | null
  ValoresAnteriores: string | null
  ValoresNuevos: string | null
  Descripcion: string
}

export default function HistorialMembresiasPage() {
  const router = useRouter()
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [filteredHistorial, setFilteredHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const [filters, setFilters] = useState({
    tipoAccion: "TODAS",
    busqueda: "",
    fechaDesde: "",
    fechaHasta: "",
  })

  useEffect(() => {
    fetchHistorial()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, historial])

  const fetchHistorial = async () => {
    try {
      const response = await fetch("/api/admin/membresias/historial")
      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
        setFilteredHistorial(data)
      }
    } catch (error) {
      console.error("Error al cargar historial:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...historial]

    if (filters.tipoAccion !== "TODAS") {
      filtered = filtered.filter((entry) => entry.TipoAccion === filters.tipoAccion)
    }

    if (filters.busqueda) {
      const search = filters.busqueda.toLowerCase()
      filtered = filtered.filter(
        (entry) => entry.NombrePlan.toLowerCase().includes(search) || entry.Descripcion.toLowerCase().includes(search),
      )
    }

    if (filters.fechaDesde) {
      filtered = filtered.filter((entry) => new Date(entry.FechaAccion) >= new Date(filters.fechaDesde))
    }

    if (filters.fechaHasta) {
      const fechaHastaFin = new Date(filters.fechaHasta)
      fechaHastaFin.setHours(23, 59, 59, 999)
      filtered = filtered.filter((entry) => new Date(entry.FechaAccion) <= fechaHastaFin)
    }

    setFilteredHistorial(filtered)
  }

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getActionIcon = (tipo: string) => {
    switch (tipo) {
      case "CREAR":
        return <Plus className="h-4 w-4" />
      case "MODIFICAR":
        return <Edit className="h-4 w-4" />
      case "ACTIVAR":
        return <Power className="h-4 w-4" />
      case "DESACTIVAR":
        return <PowerOff className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActionBadge = (tipo: string) => {
    const styles = {
      CREAR: "bg-green-100 text-green-800 border-green-200",
      MODIFICAR: "bg-blue-100 text-blue-800 border-blue-200",
      ACTIVAR: "bg-emerald-100 text-emerald-800 border-emerald-200",
      DESACTIVAR: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return (
      <Badge variant="outline" className={styles[tipo as keyof typeof styles]}>
        {getActionIcon(tipo)}
        <span className="ml-1">{tipo}</span>
      </Badge>
    )
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderDetalles = (entry: HistorialEntry) => {
    if (!expandedRows.has(entry.AuditoriaID)) return null

    try {
      const camposModificados = entry.CamposModificados ? JSON.parse(entry.CamposModificados) : []
      const valoresAnteriores = entry.ValoresAnteriores ? JSON.parse(entry.ValoresAnteriores) : {}
      const valoresNuevos = entry.ValoresNuevos ? JSON.parse(entry.ValoresNuevos) : {}

      if (entry.TipoAccion === "CREAR") {
        return (
          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-green-900">Valores iniciales:</p>
            {Object.entries(valoresNuevos).map(([key, value]) => (
              <div key={key} className="text-sm text-green-800">
                <span className="font-medium">{key}:</span> {JSON.stringify(value)}
              </div>
            ))}
          </div>
        )
      }

      if (camposModificados.length > 0) {
        return (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-blue-900">Cambios realizados:</p>
            {camposModificados.map((campo: string) => (
              <div key={campo} className="flex items-start gap-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-blue-900">{campo}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                      {JSON.stringify(valoresAnteriores[campo])}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {JSON.stringify(valoresNuevos[campo])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    } catch (error) {
      console.error("Error parsing detalles:", error)
    }

    return null
  }

  const stats = {
    total: historial.length,
    crear: historial.filter((h) => h.TipoAccion === "CREAR").length,
    modificar: historial.filter((h) => h.TipoAccion === "MODIFICAR").length,
    activar: historial.filter((h) => h.TipoAccion === "ACTIVAR").length,
    desactivar: historial.filter((h) => h.TipoAccion === "DESACTIVAR").length,
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando historial...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => router.push("/admin/membresias")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Historial de Membresías</h1>
                <p className="text-muted-foreground">Registro completo de todas las acciones</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Acciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Registros totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Creados</CardTitle>
              <Plus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.crear}</div>
              <p className="text-xs text-muted-foreground">Planes creados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Modificados</CardTitle>
              <Edit className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.modificar}</div>
              <p className="text-xs text-muted-foreground">Cambios realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Activados</CardTitle>
              <Power className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.activar}</div>
              <p className="text-xs text-muted-foreground">Reactivaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Desactivados</CardTitle>
              <PowerOff className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.desactivar}</div>
              <p className="text-xs text-muted-foreground">Planes inactivos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Tipo de Acción</Label>
                <select
                  className="w-full mt-1.5 border rounded-md p-2 bg-background"
                  value={filters.tipoAccion}
                  onChange={(e) => setFilters({ ...filters, tipoAccion: e.target.value })}
                >
                  <option value="TODAS">Todas las acciones</option>
                  <option value="CREAR">Crear</option>
                  <option value="MODIFICAR">Modificar</option>
                  <option value="ACTIVAR">Activar</option>
                  <option value="DESACTIVAR">Desactivar</option>
                </select>
              </div>

              <div>
                <Label>Buscar</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre o descripción..."
                    value={filters.busqueda}
                    onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Fecha Desde</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.fechaDesde}
                    onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Fecha Hasta</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.fechaHasta}
                    onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividades</CardTitle>
            <CardDescription>
              {filteredHistorial.length}{" "}
              {filteredHistorial.length === 1 ? "registro encontrado" : "registros encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredHistorial.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No se encontraron registros con los filtros aplicados</p>
                </div>
              ) : (
                filteredHistorial.map((entry) => (
                  <div key={entry.AuditoriaID} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActionBadge(entry.TipoAccion)}
                          <span className="font-semibold text-lg">{entry.NombrePlan}</span>
                          {entry.PlanID && <span className="text-xs text-muted-foreground">ID: {entry.PlanID}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{entry.Descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatFecha(entry.FechaAccion)}</span>
                        </div>
                        {renderDetalles(entry)}
                      </div>
                      {(entry.CamposModificados || entry.ValoresNuevos) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(entry.AuditoriaID)}
                          className="ml-4"
                        >
                          {expandedRows.has(entry.AuditoriaID) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
