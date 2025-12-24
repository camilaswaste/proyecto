"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Calendar, CheckCircle2, Edit, FileText, Plus, Search, Trash2, Wrench } from "lucide-react"
import { useEffect, useState } from "react"

interface Implemento {
  ImplementoID: number
  Nombre: string
  Categoria: string
  CodigoInterno: string
  Descripcion?: string
  Ubicacion?: string
  Estado: string
  FechaAdquisicion?: string
  VidaUtilMeses?: number
  CostoAdquisicion?: number
  UltimaRevision?: string
  ProximaRevision?: string
  FrecuenciaRevision?: number
  Observaciones?: string
}

export default function ImplementosPage() {
  const [implementos, setImplementos] = useState<Implemento[]>([])
  const [filteredImplementos, setFilteredImplementos] = useState<Implemento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [filterCategoria, setFilterCategoria] = useState<string>("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mantenimientoDialogOpen, setMantenimientoDialogOpen] = useState(false)
  const [editingImplemento, setEditingImplemento] = useState<Implemento | null>(null)
  const [selectedImplemento, setSelectedImplemento] = useState<Implemento | null>(null)

  const [formData, setFormData] = useState({
    Nombre: "",
    Categoria: "Maquina",
    CodigoInterno: "",
    Descripcion: "",
    Ubicacion: "",
    Estado: "Operativo",
    FechaAdquisicion: "",
    VidaUtilMeses: "",
    CostoAdquisicion: "",
    FrecuenciaRevision: "30",
    Observaciones: "",
  })

  const [mantenimientoData, setMantenimientoData] = useState({
    TipoMantenimiento: "Preventivo",
    Descripcion: "",
    Costo: "",
    EstadoAntes: "",
    EstadoDespues: "Operativo",
    ResponsableNombre: "",
  })

  useEffect(() => {
    fetchImplementos()
  }, [])

  useEffect(() => {
    filterImplementos()
  }, [searchTerm, filterEstado, filterCategoria, implementos])

  const fetchImplementos = async () => {
    try {
      const response = await fetch("/api/admin/implementos")
      if (!response.ok) throw new Error("Error al cargar implementos")
      const data = await response.json()
      setImplementos(data.implementos || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los implementos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterImplementos = () => {
    let filtered = implementos

    if (searchTerm) {
      filtered = filtered.filter(
        (imp) =>
          imp.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          imp.CodigoInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
          imp.Ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((imp) => imp.Estado === filterEstado)
    }

    if (filterCategoria !== "todos") {
      filtered = filtered.filter((imp) => imp.Categoria === filterCategoria)
    }

    setFilteredImplementos(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingImplemento
        ? `/api/admin/implementos/${editingImplemento.ImplementoID}`
        : "/api/admin/implementos"

      const method = editingImplemento ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Error al guardar")

      toast({
        title: "Éxito",
        description: editingImplemento ? "Implemento actualizado correctamente" : "Implemento creado correctamente",
      })

      setDialogOpen(false)
      resetForm()
      fetchImplementos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el implemento",
        variant: "destructive",
      })
    }
  }

  const handleMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedImplemento) return

    try {
      const response = await fetch("/api/admin/implementos/mantenimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mantenimientoData,
          ImplementoID: selectedImplemento.ImplementoID,
          EstadoAntes: selectedImplemento.Estado,
        }),
      })

      if (!response.ok) throw new Error("Error al registrar mantenimiento")

      toast({
        title: "Éxito",
        description: "Mantenimiento registrado correctamente",
      })

      setMantenimientoDialogOpen(false)
      resetMantenimientoForm()
      fetchImplementos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el mantenimiento",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este implemento?")) return

    try {
      const response = await fetch(`/api/admin/implementos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar")

      toast({
        title: "Éxito",
        description: "Implemento eliminado correctamente",
      })

      fetchImplementos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el implemento",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (implemento: Implemento) => {
    setEditingImplemento(implemento)
    setFormData({
      Nombre: implemento.Nombre,
      Categoria: implemento.Categoria,
      CodigoInterno: implemento.CodigoInterno,
      Descripcion: implemento.Descripcion || "",
      Ubicacion: implemento.Ubicacion || "",
      Estado: implemento.Estado,
      FechaAdquisicion: implemento.FechaAdquisicion?.split("T")[0] || "",
      VidaUtilMeses: implemento.VidaUtilMeses?.toString() || "",
      CostoAdquisicion: implemento.CostoAdquisicion?.toString() || "",
      FrecuenciaRevision: implemento.FrecuenciaRevision?.toString() || "30",
      Observaciones: implemento.Observaciones || "",
    })
    setDialogOpen(true)
  }

  const openMantenimientoDialog = (implemento: Implemento) => {
    setSelectedImplemento(implemento)
    setMantenimientoData({
      TipoMantenimiento: "Preventivo",
      Descripcion: "",
      Costo: "",
      EstadoAntes: implemento.Estado,
      EstadoDespues: "Operativo",
      ResponsableNombre: "",
    })
    setMantenimientoDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      Nombre: "",
      Categoria: "Maquina",
      CodigoInterno: "",
      Descripcion: "",
      Ubicacion: "",
      Estado: "Operativo",
      FechaAdquisicion: "",
      VidaUtilMeses: "",
      CostoAdquisicion: "",
      FrecuenciaRevision: "30",
      Observaciones: "",
    })
    setEditingImplemento(null)
  }

  const resetMantenimientoForm = () => {
    setMantenimientoData({
      TipoMantenimiento: "Preventivo",
      Descripcion: "",
      Costo: "",
      EstadoAntes: "",
      EstadoDespues: "Operativo",
      ResponsableNombre: "",
    })
    setSelectedImplemento(null)
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      Operativo: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      EnMantencion: { variant: "secondary", icon: <Wrench className="h-3 w-3" /> },
      Dañado: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
      FueraDeServicio: { variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
    }

    const config = variants[estado] || variants.Operativo

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {estado}
      </Badge>
    )
  }

  const stats = {
    total: implementos.length,
    operativos: implementos.filter((i) => i.Estado === "Operativo").length,
    enMantencion: implementos.filter((i) => i.Estado === "EnMantencion").length,
    dañados: implementos.filter((i) => i.Estado === "Dañado").length,
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Control de Implementos</h1>
            <p className="text-muted-foreground">Gestión de equipos y maquinaria del gimnasio</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Implemento
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/implementos/reportes">
                <FileText className="h-4 w-4 mr-2" />
                Reportes
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Implementos</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Operativos</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.operativos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>En Mantenimiento</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.enMantencion}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Dañados</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.dañados}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Operativo">Operativo</SelectItem>
                  <SelectItem value="EnMantencion">En Mantenimiento</SelectItem>
                  <SelectItem value="Dañado">Dañado</SelectItem>
                  <SelectItem value="FueraDeServicio">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="Maquina">Máquina</SelectItem>
                  <SelectItem value="Accesorio">Accesorio</SelectItem>
                  <SelectItem value="Equipo">Equipo</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Implementos</CardTitle>
            <CardDescription>{filteredImplementos.length} implemento(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próxima Revisión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredImplementos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron implementos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredImplementos.map((implemento) => (
                      <TableRow key={implemento.ImplementoID}>
                        <TableCell className="font-mono text-sm">{implemento.CodigoInterno}</TableCell>
                        <TableCell className="font-medium">{implemento.Nombre}</TableCell>
                        <TableCell>{implemento.Categoria}</TableCell>
                        <TableCell>{implemento.Ubicacion || "—"}</TableCell>
                        <TableCell>{getEstadoBadge(implemento.Estado)}</TableCell>
                        <TableCell>
                          {implemento.ProximaRevision ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(implemento.ProximaRevision).toLocaleDateString()}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openMantenimientoDialog(implemento)}
                              title="Registrar Mantenimiento"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(implemento)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(implemento.ImplementoID)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Create/Edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingImplemento ? "Editar Implemento" : "Nuevo Implemento"}</DialogTitle>
              <DialogDescription>Completa la información del implemento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.Nombre}
                      onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código Interno *</Label>
                    <Input
                      id="codigo"
                      value={formData.CodigoInterno}
                      onChange={(e) => setFormData({ ...formData, CodigoInterno: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={formData.Categoria}
                      onValueChange={(value) => setFormData({ ...formData, Categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Maquina">Máquina</SelectItem>
                        <SelectItem value="Accesorio">Accesorio</SelectItem>
                        <SelectItem value="Equipo">Equipo</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      placeholder="Ej: Sala de Pesas"
                      value={formData.Ubicacion}
                      onChange={(e) => setFormData({ ...formData, Ubicacion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.Estado}
                      onValueChange={(value) => setFormData({ ...formData, Estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operativo">Operativo</SelectItem>
                        <SelectItem value="EnMantencion">En Mantenimiento</SelectItem>
                        <SelectItem value="Dañado">Dañado</SelectItem>
                        <SelectItem value="FueraDeServicio">Fuera de Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha de Adquisición</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.FechaAdquisicion}
                      onChange={(e) => setFormData({ ...formData, FechaAdquisicion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vida">Vida Útil (meses)</Label>
                    <Input
                      id="vida"
                      type="number"
                      value={formData.VidaUtilMeses}
                      onChange={(e) => setFormData({ ...formData, VidaUtilMeses: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costo">Costo Adquisición</Label>
                    <Input
                      id="costo"
                      type="number"
                      step="0.01"
                      value={formData.CostoAdquisicion}
                      onChange={(e) => setFormData({ ...formData, CostoAdquisicion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia Revisión (días)</Label>
                    <Input
                      id="frecuencia"
                      type="number"
                      value={formData.FrecuenciaRevision}
                      onChange={(e) => setFormData({ ...formData, FrecuenciaRevision: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.Observaciones}
                    onChange={(e) => setFormData({ ...formData, Observaciones: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingImplemento ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Mantenimiento */}
        <Dialog open={mantenimientoDialogOpen} onOpenChange={setMantenimientoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Mantenimiento</DialogTitle>
              <DialogDescription>
                {selectedImplemento?.Nombre} - {selectedImplemento?.CodigoInterno}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleMantenimiento}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Mantenimiento</Label>
                  <Select
                    value={mantenimientoData.TipoMantenimiento}
                    onValueChange={(value) => setMantenimientoData({ ...mantenimientoData, TipoMantenimiento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventivo">Preventivo</SelectItem>
                      <SelectItem value="Correctivo">Correctivo</SelectItem>
                      <SelectItem value="Revision">Revisión</SelectItem>
                      <SelectItem value="Reparacion">Reparación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc-mant">Descripción *</Label>
                  <Textarea
                    id="desc-mant"
                    value={mantenimientoData.Descripcion}
                    onChange={(e) => setMantenimientoData({ ...mantenimientoData, Descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costo-mant">Costo</Label>
                    <Input
                      id="costo-mant"
                      type="number"
                      step="0.01"
                      value={mantenimientoData.Costo}
                      onChange={(e) => setMantenimientoData({ ...mantenimientoData, Costo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      value={mantenimientoData.ResponsableNombre}
                      onChange={(e) =>
                        setMantenimientoData({ ...mantenimientoData, ResponsableNombre: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado-despues">Estado Después</Label>
                  <Select
                    value={mantenimientoData.EstadoDespues}
                    onValueChange={(value) => setMantenimientoData({ ...mantenimientoData, EstadoDespues: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operativo">Operativo</SelectItem>
                      <SelectItem value="EnMantencion">En Mantenimiento</SelectItem>
                      <SelectItem value="Dañado">Dañado</SelectItem>
                      <SelectItem value="FueraDeServicio">Fuera de Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMantenimientoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}