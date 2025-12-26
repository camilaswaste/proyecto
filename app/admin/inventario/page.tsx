"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 'TabsContent' se usará de forma diferente
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Cookie,
  Droplet,
  Dumbbell,
  Edit,
  Package,
  Pill,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useState } from "react"

interface Categoria {
  CategoriaID: number
  NombreCategoria: string
  TipoCategoria: string
  Descripcion: string
}

interface Producto {
  ProductoID: number
  NombreProducto: string
  Descripcion: string
  CategoriaID: number
  NombreCategoria: string
  TipoCategoria: string
  StockActual: number
  StockMinimo: number
  PrecioVenta: number
  UnidadMedida: string
  Estado: string
  FechaCreacion: string
}

type SortKey = "NombreProducto" | "StockActual" | "PrecioVenta" | "NombreCategoria" | null
type SortDirection = "asc" | "desc"

export default function AdminInventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas") // Para el filtro de pestañas
  const [sortKey, setSortKey] = useState<SortKey>("NombreProducto")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const [formData, setFormData] = useState({
    nombreProducto: "",
    descripcion: "",
    categoriaID: "",
    precioVenta: "",
    stockActual: "",
    stockMinimo: "5",
    unidadMedida: "unidad",
    estado: "Disponible",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // ... (Tu función fetchData se mantiene igual)
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        fetch("/api/admin/inventario"),
        fetch("/api/admin/categorias"),
      ])

      if (productosRes.ok) {
        const data = await productosRes.json()
        setProductos(data)
      }

      if (categoriasRes.ok) {
        const data = await categoriasRes.json()
        setCategorias(data)
        if (data.length > 0 && !formData.categoriaID) {
          setFormData((prev) => ({ ...prev, categoriaID: data[0].CategoriaID.toString() }))
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (producto?: Producto) => {
    // ... (Tu función handleOpenDialog se mantiene igual)
    if (producto) {
      setEditingProducto(producto)
      setFormData({
        nombreProducto: producto.NombreProducto,
        descripcion: producto.Descripcion || "",
        categoriaID: producto.CategoriaID.toString(),
        precioVenta: producto.PrecioVenta?.toString() || "",
        stockActual: producto.StockActual.toString(),
        stockMinimo: producto.StockMinimo.toString(),
        unidadMedida: producto.UnidadMedida || "unidad",
        estado: producto.Estado,
      })
    } else {
      setEditingProducto(null)
      setFormData({
        nombreProducto: "",
        descripcion: "",
        categoriaID: categorias.length > 0 ? categorias[0].CategoriaID.toString() : "",
        precioVenta: "",
        stockActual: "",
        stockMinimo: "5",
        unidadMedida: "unidad",
        estado: "Disponible",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (Tu función handleSubmit se mantiene igual)
    e.preventDefault()
    try {
      const body = editingProducto ? { ...formData, productoID: editingProducto.ProductoID } : formData

      const url = "/api/admin/inventario"
      const method = editingProducto ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar producto")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar producto")
    }
  }

  const handleDelete = async (id: number) => {
    // ... (Tu función handleDelete se mantiene igual)
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      const response = await fetch(`/api/admin/inventario?productoID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const getStockStatus = (producto: Producto) => {
    // ... (Tu función getStockStatus se mantiene igual)
    if (producto.StockActual <= producto.StockMinimo) {
      return { color: "destructive", label: "Stock Crítico", icon: AlertTriangle }
    } else if (producto.StockActual <= producto.StockMinimo * 1.5) {
      return { color: "warning", label: "Stock Bajo", icon: AlertTriangle }
    }
    return { color: "success", label: "Stock Normal", icon: Package }
  }

  const getCategoryColor = (nombreCategoria: string) => {
    // ... (Tu función getCategoryColor se mantiene igual)
    const colors: Record<string, string> = {
      bebidas: "border-l-blue-500",
      suplementos: "border-l-purple-500",
      snacks: "border-l-orange-500",
      equipamiento: "border-l-emerald-500",
      mantenimiento: "border-l-slate-500",
    }
    return colors[nombreCategoria.toLowerCase()] || "border-l-gray-500"
  }

  const getCategoryIcon = (nombreCategoria: string) => {
    // ... (Tu función getCategoryIcon se mantiene igual)
    switch (nombreCategoria.toLowerCase()) {
      case "bebidas":
        return Droplet
      case "suplementos":
        return Pill
      case "snacks":
        return Cookie
      case "equipamiento":
        return Dumbbell
      case "mantenimiento":
        return Wrench
      default:
        return Package
    }
  }

  // Lógica de Filtrado y Ordenamiento
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sortedAndFilteredProducts = useMemo(() => {
    let result = productos.filter((producto) => {
      const matchSearch = producto.NombreProducto.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategoria =
        categoriaActiva === "todas" || producto.NombreCategoria.toLowerCase() === categoriaActiva.toLowerCase()
      return matchSearch && matchCategoria
    })

    if (sortKey) {
      result = result.sort((a, b) => {
        let valA: string | number
        let valB: string | number

        // Manejar tipos de datos para la comparación
        if (sortKey === "NombreProducto" || sortKey === "NombreCategoria") {
          valA = a[sortKey].toLowerCase()
          valB = b[sortKey].toLowerCase()
        } else {
          // StockActual o PrecioVenta
          valA = a[sortKey]
          valB = b[sortKey]
        }

        if (valA < valB) {
          return sortDirection === "asc" ? -1 : 1
        }
        if (valA > valB) {
          return sortDirection === "asc" ? 1 : -1
        }
        return 0
      })
    }

    return result
  }, [productos, searchTerm, categoriaActiva, sortKey, sortDirection])

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Administra productos y control de stock</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Productos</CardTitle>
            <CardDescription>
              Mostrando {sortedAndFilteredProducts.length} de {productos.length} productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filtro de Búsqueda y Pestañas de Categoría */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                <div className="flex-shrink-0">
                  <Tabs value={categoriaActiva} onValueChange={setCategoriaActiva}>
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="todas">Todas</TabsTrigger>
                      {categorias.map((cat) => (
                        <TabsTrigger key={cat.CategoriaID} value={cat.NombreCategoria.toLowerCase()}>
                          {cat.NombreCategoria}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Controles de Ordenamiento */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <span>Ordenar por:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("NombreProducto")}
                >
                  Nombre
                  {getSortIcon("NombreProducto")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("NombreCategoria")}
                >
                  Categoría
                  {getSortIcon("NombreCategoria")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("StockActual")}
                >
                  Stock
                  {getSortIcon("StockActual")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("PrecioVenta")}
                >
                  Precio
                  {getSortIcon("PrecioVenta")}
                </Button>
              </div>

              {/* Lista Unificada de Productos */}
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedAndFilteredProducts.length > 0 ? (
                  sortedAndFilteredProducts.map((producto) => {
                    const status = getStockStatus(producto)
                    const StatusIcon = status.icon
                    const CategoryIcon = getCategoryIcon(producto.NombreCategoria)

                    return (
                      <Card
                        key={producto.ProductoID}
                        className={`relative border-l-4 ${getCategoryColor(
                          producto.NombreCategoria,
                        )} hover:shadow-lg transition-shadow duration-200`}
                      >
                        {producto.StockActual <= producto.StockMinimo && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge variant="destructive" className="gap-1 text-xs px-1.5 py-0.5">
                              <AlertTriangle className="h-3 w-3" />
                              Pocos
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <CardDescription className="text-xs font-medium">
                              {producto.NombreCategoria}
                            </CardDescription>
                          </div>
                          <CardTitle className="text-sm font-semibold leading-tight pr-12">
                            {producto.NombreProducto}
                          </CardTitle>
                          {producto.Descripcion && (
                            <CardDescription className="text-xs line-clamp-2 mt-1">
                              {producto.Descripcion}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2 px-3 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon
                                className={`h-3.5 w-3.5 ${
                                  status.color === "destructive"
                                    ? "text-red-500"
                                    : status.color === "warning"
                                      ? "text-amber-500"
                                      : "text-emerald-500"
                                }`}
                              />
                              <span className="text-xs font-medium">
                                {producto.StockActual} {producto.UnidadMedida}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">Min: {producto.StockMinimo}</span>
                          </div>
                          {producto.PrecioVenta > 0 && (
                            <div className="text-base font-bold text-primary">
                              ${producto.PrecioVenta.toLocaleString("es-CL")}
                            </div>
                          )}
                          <div className="flex gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-7 text-xs bg-transparent"
                              onClick={() => handleOpenDialog(producto)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 bg-transparent"
                              onClick={() => handleDelete(producto.ProductoID)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No se encontraron productos que coincidan con los filtros.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo de Producto (se mantiene igual) */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogClose onClose={function (): void {
                throw new Error("Function not implemented.")
              } } />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nombreProducto">Nombre del Producto *</Label>
                  <Input
                    id="nombreProducto"
                    value={formData.nombreProducto}
                    onChange={(e) => setFormData({ ...formData, nombreProducto: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full border rounded-md p-2 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label htmlFor="categoriaID">Categoría *</Label>
                  <select
                    id="categoriaID"
                    value={formData.categoriaID}
                    onChange={(e) => setFormData({ ...formData, categoriaID: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    {categorias.map((cat) => (
                      <option key={cat.CategoriaID} value={cat.CategoriaID}>
                        {cat.NombreCategoria} ({cat.TipoCategoria})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="precioVenta">Precio de Venta</Label>
                  <Input
                    id="precioVenta"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stockActual">Stock Actual *</Label>
                  <Input
                    id="stockActual"
                    type="number"
                    min="0"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    min="0"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                  <select
                    id="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramos</option>
                    <option value="litro">Litros</option>
                    <option value="caja">Cajas</option>
                    <option value="paquete">Paquetes</option>
                  </select>
                </div>
                {editingProducto && (
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <select
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Agotado">Agotado</option>
                      <option value="Descontinuado">Descontinuado</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingProducto ? "Actualizar" : "Crear"} Producto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}