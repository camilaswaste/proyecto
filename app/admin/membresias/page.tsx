"use client"

import type React from "react"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  History,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Plan {
  PlanID: number
  NombrePlan: string
  Descripcion: string
  Precio: number
  PrecioOriginal?: number
  DuracionDias: number
  TipoPlan: string
  Descuento?: number
  FechaInicioOferta?: string
  FechaFinOferta?: string
  Activo: boolean
}

type SortField = "NombrePlan" | "Precio" | "DuracionDias" | "TipoPlan" | "Activo"
type SortDirection = "asc" | "desc"

export default function AdminMembresiasPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("Todos")
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [sortField, setSortField] = useState<SortField>("NombrePlan")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [formData, setFormData] = useState({
    nombrePlan: "",
    descripcion: "",
    precioOriginal: "",
    descuento: "",
    duracionDias: "",
    tipoPlan: "Normal",
    fechaInicioOferta: "",
    fechaFinOferta: "",
    beneficios: "",
    activo: true,
  })

  useEffect(() => {
    fetchPlanes()

    const interval = setInterval(() => {
      checkExpiredOffers()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/admin/membresias")
      if (response.ok) {
        const data = await response.json()
        setPlanes(data)
      }
    } catch (error) {
      console.error("Error al cargar membresías:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkExpiredOffers = () => {
    const now = new Date()
    setPlanes((prevPlanes) =>
      prevPlanes.map((plan) => {
        if (plan.TipoPlan === "Oferta" && plan.FechaFinOferta) {
          const fechaFin = new Date(plan.FechaFinOferta)
          if (now > fechaFin) {
            fetch("/api/admin/membresias/expire-offer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planID: plan.PlanID }),
            }).catch((err) => console.error("Error al expirar oferta:", err))

            return { ...plan, TipoPlan: "Normal", Precio: plan.PrecioOriginal || plan.Precio }
          }
        }
        return plan
      }),
    )
  }

  const calcularPrecioConDescuento = (precioOriginal: number, descuento: number): number => {
    return Math.round(precioOriginal * (1 - descuento / 100))
  }

  const calcularTiempoRestante = (fechaFin: string) => {
    const now = new Date()
    const fin = new Date(fechaFin)
    const diff = fin.getTime() - now.getTime()

    if (diff <= 0) return "Expirada"

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (dias > 0) return `${dias}d ${horas}h`
    if (horas > 0) return `${horas}h ${minutos}m`
    return `${minutos}m`
  }

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        nombrePlan: plan.NombrePlan,
        descripcion: plan.Descripcion || "",
        precioOriginal: (plan.PrecioOriginal || plan.Precio).toString(),
        descuento: plan.Descuento?.toString() || "",
        duracionDias: plan.DuracionDias.toString(),
        tipoPlan: plan.TipoPlan,
        fechaInicioOferta: plan.FechaInicioOferta?.split("T")[0] || "",
        fechaFinOferta: plan.FechaFinOferta?.split("T")[0] || "",
        beneficios: "",
        activo: plan.Activo,
      })
    } else {
      setEditingPlan(null)
      setFormData({
        nombrePlan: "",
        descripcion: "",
        precioOriginal: "",
        descuento: "",
        duracionDias: "",
        tipoPlan: "Normal",
        fechaInicioOferta: "",
        fechaFinOferta: "",
        beneficios: "",
        activo: true,
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = editingPlan ? { ...formData, planID: editingPlan.PlanID } : formData

      const url = "/api/admin/membresias"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchPlanes()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar plan")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar plan")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return

    try {
      const response = await fetch(`/api/admin/membresias?planID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchPlanes()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredPlanes = planes
    .filter((plan) => {
      const matchesSearch = plan.NombrePlan.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTipo = tipoFilter === "Todos" || plan.TipoPlan === tipoFilter
      return matchesSearch && matchesTipo
    })
    .sort((a, b) => {
      let compareA: any = a[sortField]
      let compareB: any = b[sortField]

      if (sortField === "Activo") {
        compareA = a.Activo ? 1 : 0
        compareB = b.Activo ? 1 : 0
      }

      if (typeof compareA === "string") {
        compareA = compareA.toLowerCase()
        compareB = compareB.toLowerCase()
      }

      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })

  const totalPages = Math.ceil(filteredPlanes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPlanes = filteredPlanes.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFilter])

  const stats = {
    total: planes.length,
    activos: planes.filter((p) => p.Activo).length,
    ofertas: planes.filter((p) => p.TipoPlan === "Oferta").length,
    precioPromedio: planes.length > 0 ? Math.round(planes.reduce((sum, p) => sum + p.Precio, 0) / planes.length) : 0,
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    )
  }

  const precioCalculado =
    formData.tipoPlan === "Oferta" && formData.precioOriginal && formData.descuento
      ? calcularPrecioConDescuento(Number(formData.precioOriginal), Number(formData.descuento))
      : Number(formData.precioOriginal) || 0

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando membresías...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Membresías</h1>
            <p className="text-muted-foreground">Administra los planes de membresía</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/membresias/historial")}>
              <History className="h-4 w-4 mr-2" />
              Historial Membresías
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Membresía
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Planes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Planes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
              <p className="text-xs text-muted-foreground">Disponibles para asignar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ofertas Especiales</CardTitle>
              <Sparkles className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.ofertas}</div>
              <p className="text-xs text-muted-foreground">Promociones activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.precioPromedio.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Promedio general</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planes de Membresía</CardTitle>
            <CardDescription>Total: {filteredPlanes.length} planes encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    placeholder="Buscar por nombre de plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="border rounded-md px-4 py-2 bg-background min-w-[180px]"
                >
                  <option value="Todos">Todos los tipos</option>
                  <option value="Normal">Normal</option>
                  <option value="Oferta">🎉 Oferta Especial</option>
                </select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">
                          <Button
                            variant="ghost"
                            className="h-auto p-0 hover:bg-transparent font-medium"
                            onClick={() => handleSort("NombrePlan")}
                          >
                            Nombre del Plan
                            <SortIcon field="NombrePlan" />
                          </Button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <Button
                            variant="ghost"
                            className="h-auto p-0 hover:bg-transparent font-medium"
                            onClick={() => handleSort("Precio")}
                          >
                            Precio
                            <SortIcon field="Precio" />
                          </Button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <Button
                            variant="ghost"
                            className="h-auto p-0 hover:bg-transparent font-medium"
                            onClick={() => handleSort("DuracionDias")}
                          >
                            Duración
                            <SortIcon field="DuracionDias" />
                          </Button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <Button
                            variant="ghost"
                            className="h-auto p-0 hover:bg-transparent font-medium"
                            onClick={() => handleSort("TipoPlan")}
                          >
                            Tipo
                            <SortIcon field="TipoPlan" />
                          </Button>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <Button
                            variant="ghost"
                            className="h-auto p-0 hover:bg-transparent font-medium"
                            onClick={() => handleSort("Activo")}
                          >
                            Estado
                            <SortIcon field="Activo" />
                          </Button>
                        </th>
                        <th className="text-left p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPlanes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No se encontraron planes de membresía
                          </td>
                        </tr>
                      ) : (
                        paginatedPlanes.map((plan) => (
                          <tr
                            key={plan.PlanID}
                            className={`border-t hover:bg-muted/50 transition-colors ${
                              plan.TipoPlan === "Oferta" ? "bg-gradient-to-r from-amber-50/50 to-transparent" : ""
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{plan.NombrePlan}</span>
                                {plan.TipoPlan === "Oferta" && plan.FechaFinOferta && (
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                                      <Sparkles className="h-3 w-3" />
                                      OFERTA
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <Clock className="h-3 w-3" />
                                      {calcularTiempoRestante(plan.FechaFinOferta)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {plan.TipoPlan === "Oferta" && plan.PrecioOriginal ? (
                                <div className="flex flex-col">
                                  <span className="text-sm text-muted-foreground line-through">
                                    ${plan.PrecioOriginal.toLocaleString()}
                                  </span>
                                  <span className="font-bold text-orange-600">${plan.Precio.toLocaleString()}</span>
                                  <span className="text-xs text-green-600 font-medium">-{plan.Descuento}% OFF</span>
                                </div>
                              ) : (
                                <span>${plan.Precio.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3">{plan.DuracionDias} días</td>
                            <td className="p-3">
                              <span
                                className={`text-sm ${plan.TipoPlan === "Oferta" ? "text-orange-600 font-medium" : "text-muted-foreground"}`}
                              >
                                {plan.TipoPlan}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  plan.Activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {plan.Activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.PlanID)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredPlanes.length)} de {filteredPlanes.length}{" "}
                    planes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 py-1 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingPlan ? "Editar Plan de Membresía" : "Nuevo Plan de Membresía"}
              </DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nombrePlan" className="text-base">
                    Nombre del Plan *
                  </Label>
                  <Input
                    id="nombrePlan"
                    value={formData.nombrePlan}
                    onChange={(e) => setFormData({ ...formData, nombrePlan: e.target.value })}
                    required
                    className="mt-1.5"
                    placeholder="Ej: Plan Mensual Premium"
                  />
                </div>

                <div>
                  <Label htmlFor="precioOriginal" className="text-base">
                    Precio Original (CLP) *
                  </Label>
                  <Input
                    id="precioOriginal"
                    type="number"
                    value={formData.precioOriginal}
                    onChange={(e) => setFormData({ ...formData, precioOriginal: e.target.value })}
                    required
                    className="mt-1.5"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label htmlFor="duracionDias" className="text-base">
                    Duración (días) *
                  </Label>
                  <Input
                    id="duracionDias"
                    type="number"
                    value={formData.duracionDias}
                    onChange={(e) => setFormData({ ...formData, duracionDias: e.target.value })}
                    required
                    className="mt-1.5"
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="tipoPlan" className="text-base">
                    Tipo de Plan *
                  </Label>
                  <select
                    id="tipoPlan"
                    value={formData.tipoPlan}
                    onChange={(e) => setFormData({ ...formData, tipoPlan: e.target.value })}
                    className="w-full border rounded-md p-2 mt-1.5 bg-background"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Oferta">🎉 Oferta Especial</option>
                  </select>
                  {formData.tipoPlan === "Oferta" && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Este plan se mostrará como oferta especial
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo" className="text-base font-medium">
                      Estado del Plan
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.activo ? "Plan disponible para asignar" : "Plan deshabilitado"}
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>

                {formData.tipoPlan === "Oferta" && (
                  <>
                    <div className="md:col-span-2">
                      <div className="p-4 border-2 border-amber-200 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 space-y-4">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold">
                          <Sparkles className="h-5 w-5" />
                          <span>Configuración de Oferta Especial</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="descuento" className="text-base">
                              Descuento (%) *
                            </Label>
                            <Input
                              id="descuento"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.descuento}
                              onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                              required={formData.tipoPlan === "Oferta"}
                              className="mt-1.5"
                              placeholder="30"
                            />
                          </div>

                          <div>
                            <Label className="text-base">Precio con Descuento</Label>
                            <div className="mt-1.5 p-2 bg-white border rounded-md">
                              <span className="text-2xl font-bold text-orange-600">
                                ${precioCalculado.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="fechaInicioOferta" className="text-base">
                              Fecha Inicio Oferta *
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                              <Input
                                id="fechaInicioOferta"
                                type="date"
                                value={formData.fechaInicioOferta}
                                onChange={(e) => setFormData({ ...formData, fechaInicioOferta: e.target.value })}
                                required={formData.tipoPlan === "Oferta"}
                                className="mt-1.5 pl-10"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="fechaFinOferta" className="text-base">
                              Fecha Fin Oferta *
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                              <Input
                                id="fechaFinOferta"
                                type="date"
                                value={formData.fechaFinOferta}
                                onChange={(e) => setFormData({ ...formData, fechaFinOferta: e.target.value })}
                                required={formData.tipoPlan === "Oferta"}
                                className="mt-1.5 pl-10"
                                min={formData.fechaInicioOferta}
                              />
                            </div>
                          </div>
                        </div>

                        {formData.descuento && formData.precioOriginal && (
                          <div className="p-3 bg-white rounded-md border border-amber-200">
                            <p className="text-sm text-muted-foreground">Vista previa del ahorro:</p>
                            <p className="text-lg font-semibold text-green-600">
                              Ahorro: ${(Number(formData.precioOriginal) - precioCalculado).toLocaleString()} CLP (
                              {formData.descuento}% OFF)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-base">
                  Descripción
                </Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full border rounded-md p-3 min-h-[100px] mt-1.5 bg-background"
                  placeholder="Describe las características principales de este plan..."
                />
              </div>

              <div>
                <Label htmlFor="beneficios" className="text-base">
                  Beneficios
                </Label>
                <textarea
                  id="beneficios"
                  value={formData.beneficios}
                  onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                  className="w-full border rounded-md p-3 min-h-[120px] mt-1.5 bg-background"
                  placeholder="• Acceso ilimitado al gimnasio&#10;• Clases grupales incluidas&#10;• Nutricionista personalizado"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-[120px]">
                  {editingPlan ? "Actualizar Plan" : "Crear Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
