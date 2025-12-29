"use client"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Cookie,
  Droplet,
  Edit,
  Package,
  Pill,
  Plus,
  Search,
  Trash2,
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

  // Crear/Editar producto
  const [showDialog, setShowDialog] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)

  // Reponer stock (movimiento entrada)
  const [movDialogOpen, setMovDialogOpen] = useState(false)
  const [movLoading, setMovLoading] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [movData, setMovData] = useState({
    cantidad: "",
    motivo: "",
  })

  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        fetch("/api/admin/inventario", { cache: "no-store" }),
        fetch("/api/admin/categorias", { cache: "no-store" }),
      ])

      if (productosRes.ok) {
        const data = await productosRes.json()
        setProductos(Array.isArray(data) ? data : [])
      } else {
        const err = await productosRes.json().catch(() => ({}))
        throw new Error(err?.error || "Error al cargar inventario")
      }

      if (categoriasRes.ok) {
        const data = await categoriasRes.json()
        const categoriasFiltradas = (Array.isArray(data) ? data : []).filter(
          (cat: Categoria) =>
            cat?.NombreCategoria?.toLowerCase() !== "equipamiento" &&
            cat?.NombreCategoria?.toLowerCase() !== "mantenimiento",
        )
        setCategorias(categoriasFiltradas)
        if (categoriasFiltradas.length > 0 && !formData.categoriaID) {
          setFormData((prev) => ({ ...prev, categoriaID: categoriasFiltradas[0].CategoriaID.toString() }))
        }
      } else {
        const err = await categoriasRes.json().catch(() => ({}))
        throw new Error(err?.error || "Error al cargar categorías")
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (producto?: Producto) => {
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
        estado: producto.Estado || "Disponible",
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "Error al guardar producto")
      }

      toast({
        title: "Éxito",
        description: editingProducto ? "Producto actualizado" : "Producto creado",
        variant: "success",
      })

      setShowDialog(false)
      await fetchData()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.message || "Error al guardar producto",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      const response = await fetch(`/api/admin/inventario?productoID=${id}`, { method: "DELETE" })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "Error al eliminar")
      }

      toast({ title: "Éxito", description: "Producto eliminado", variant: "success" })
      await fetchData()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.message || "Error al eliminar producto",
        variant: "destructive",
      })
    }
  }

  const openReponerDialog = (producto: Producto) => {
    setSelectedProducto(producto)
    setMovData({ cantidad: "", motivo: "" })
    setMovDialogOpen(true)
  }

  const handleReponer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProducto) return

    const cantidadInt = Number.parseInt(movData.cantidad, 10)
    if (!Number.isFinite(cantidadInt) || cantidadInt <= 0) {
      toast({
        title: "Validación",
        description: "La cantidad debe ser un número mayor a 0.",
        variant: "destructive",
      })
      return
    }

    setMovLoading(true)
    try {
      const res = await fetch("/api/admin/inventario/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoID: selectedProducto.ProductoID,
          tipoMovimiento: "Entrada",
          cantidad: cantidadInt,
          motivo: movData.motivo?.trim() || "Reposición de stock",
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "No se pudo registrar el ingreso")
      }

      toast({
        title: "Ingreso registrado",
        description: `Se sumaron ${cantidadInt} ${selectedProducto.UnidadMedida || "unid."} a "${selectedProducto.NombreProducto}".`,
        variant: "success",
      })

      setMovDialogOpen(false)
      setSelectedProducto(null)
      await fetchData()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo registrar el ingreso",
        variant: "destructive",
      })
    } finally {
      setMovLoading(false)
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.StockActual <= producto.StockMinimo) {
      return { tone: "destructive" as const, label: "Stock Crítico", icon: AlertTriangle }
    } else if (producto.StockActual <= producto.StockMinimo * 1.5) {
      return { tone: "warning" as const, label: "Stock Bajo", icon: AlertTriangle }
    }
    return { tone: "success" as const, label: "Stock Normal", icon: Package }
  }

  const getCategoryIcon = (nombreCategoria: string) => {
    switch ((nombreCategoria || "").toLowerCase()) {
      case "bebidas":
        return Droplet
      case "suplementos":
        return Pill
      case "snacks":
        return Cookie
      default:
        return Package
    }
  }

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
      const nombreCat = producto?.NombreCategoria?.toLowerCase() || ""
      const isExcludedCategory = nombreCat === "equipamiento" || nombreCat === "mantenimiento"
      if (isExcludedCategory) return false

      const matchSearch = (producto?.NombreProducto || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategoria = categoriaActiva === "todas" || nombreCat === categoriaActiva.toLowerCase()
      return matchSearch && matchCategoria
    })

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number
        let valB: string | number

        if (sortKey === "NombreProducto" || sortKey === "NombreCategoria") {
          valA = (a[sortKey] || "").toLowerCase()
          valB = (b[sortKey] || "").toLowerCase()
        } else {
          valA = a[sortKey] ?? 0
          valB = b[sortKey] ?? 0
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1
        if (valA > valB) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [productos, searchTerm, categoriaActiva, sortKey, sortDirection])

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary" />
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 animate-pulse text-primary" />
            <p className="text-muted-foreground">Cargando inventario...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
            <p className="text-muted-foreground mt-1">Administra productos y control de stock</p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Producto
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="border-b bg-muted/30 dark:bg-muted/40">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Listado de Productos
            </CardTitle>
            <CardDescription>
              Mostrando {sortedAndFilteredProducts.length} de {productos.length} productos
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 dark:bg-muted/40 border-border"
                  />
                </div>

                <Tabs value={categoriaActiva} onValueChange={setCategoriaActiva} className="w-full lg:w-auto">
                  <TabsList className="w-full lg:w-auto h-11 bg-muted/60 dark:bg-muted/50">
                    <TabsTrigger value="todas" className="data-[state=active]:bg-background">
                      Todas
                    </TabsTrigger>
                    {categorias.map((cat) => (
                      <TabsTrigger
                        key={cat.CategoriaID}
                        value={cat.NombreCategoria.toLowerCase()}
                        className="data-[state=active]:bg-background"
                      >
                        {cat.NombreCategoria}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground py-3 px-4 border rounded-lg bg-muted/20 dark:bg-muted/30">
                <span className="font-medium">Ordenar por:</span>
                <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleSort("NombreProducto")}>
                  Nombre
                  {getSortIcon("NombreProducto")}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleSort("NombreCategoria")}>
                  Categoría
                  {getSortIcon("NombreCategoria")}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleSort("StockActual")}>
                  Stock
                  {getSortIcon("StockActual")}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleSort("PrecioVenta")}>
                  Precio
                  {getSortIcon("PrecioVenta")}
                </Button>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedAndFilteredProducts.length > 0 ? (
                  sortedAndFilteredProducts.map((producto) => {
                    const status = getStockStatus(producto)
                    const StatusIcon = status.icon
                    const CategoryIcon = getCategoryIcon(producto.NombreCategoria)

                    const stockToneClasses =
                      status.tone === "destructive"
                        ? "text-red-600 dark:text-red-400"
                        : status.tone === "warning"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"

                    return (
                      <Card
                        key={producto.ProductoID}
                        className="relative border-2 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                      >
                        {producto.StockActual <= producto.StockMinimo && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="destructive" className="gap-1.5 px-2 py-1 shadow-sm">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="font-medium">Crítico</span>
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="pb-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CategoryIcon className="h-4 w-4 text-primary" />
                            </div>
                            <CardDescription className="text-xs font-semibold uppercase tracking-wide">
                              {producto.NombreCategoria}
                            </CardDescription>
                          </div>

                          <CardTitle className="text-base font-bold leading-tight pr-12 group-hover:text-primary transition-colors">
                            {producto.NombreProducto}
                          </CardTitle>

                          {producto.Descripcion && (
                            <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                              {producto.Descripcion}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 dark:bg-muted/35 border border-border">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${stockToneClasses}`} />
                              <span className="text-sm font-bold">
                                {producto.StockActual}{" "}
                                <span className="text-muted-foreground font-normal">{producto.UnidadMedida}</span>
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">Mín: {producto.StockMinimo}</span>
                          </div>

                          {producto.PrecioVenta > 0 && (
                            <div className="text-xl font-bold text-primary">
                              ${producto.PrecioVenta.toLocaleString("es-CL")}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 bg-transparent"
                              onClick={() => openReponerDialog(producto)}
                              title="Ingresar stock (reposición)"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                              Reponer
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/40 bg-transparent"
                              onClick={() => handleOpenDialog(producto)}
                              title="Editar producto"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 bg-transparent"
                              onClick={() => handleDelete(producto.ProductoID)}
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-16">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-lg font-medium">No se encontraron productos</p>
                    <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog: Crear / Editar producto */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-2">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {editingProducto ? (
                  <>
                    <Edit className="h-5 w-5 text-primary" />
                    Editar Producto
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    Nuevo Producto
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <Label htmlFor="nombreProducto" className="text-sm font-semibold">
                    Nombre del Producto *
                  </Label>
                  <Input
                    id="nombreProducto"
                    value={formData.nombreProducto}
                    onChange={(e) => setFormData({ ...formData, nombreProducto: e.target.value })}
                    required
                    className="mt-2 h-11"
                    placeholder="Ej: Proteína Whey 1kg"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descripcion" className="text-sm font-semibold">
                    Descripción
                  </Label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full border-2 rounded-lg p-3 min-h-[100px] mt-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Describe el producto..."
                  />
                </div>

                <div>
                  <Label htmlFor="categoriaID" className="text-sm font-semibold">
                    Categoría *
                  </Label>
                  <select
                    id="categoriaID"
                    value={formData.categoriaID}
                    onChange={(e) => setFormData({ ...formData, categoriaID: e.target.value })}
                    className="w-full border-2 rounded-lg p-2.5 mt-2 h-11 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  >
                    {categorias.map((cat) => (
                      <option key={cat.CategoriaID} value={cat.CategoriaID}>
                        {cat.NombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="precioVenta" className="text-sm font-semibold">
                    Precio de Venta
                  </Label>
                  <Input
                    id="precioVenta"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    className="mt-2 h-11"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="stockActual" className="text-sm font-semibold">
                    Stock Actual *
                  </Label>
                  <Input
                    id="stockActual"
                    type="number"
                    min="0"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                    required
                    className="mt-2 h-11"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="stockMinimo" className="text-sm font-semibold">
                    Stock Mínimo *
                  </Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    min="0"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    required
                    className="mt-2 h-11"
                    placeholder="5"
                  />
                </div>

                <div>
                  <Label htmlFor="unidadMedida" className="text-sm font-semibold">
                    Unidad de Medida *
                  </Label>
                  <select
                    id="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    className="w-full border-2 rounded-lg p-2.5 mt-2 h-11 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramo</option>
                    <option value="L">Litro</option>
                    <option value="mL">Mililitro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="estado" className="text-sm font-semibold">
                    Estado *
                  </Label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full border-2 rounded-lg p-2.5 mt-2 h-11 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="No Disponible">No Disponible</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1 h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-11 gap-2">
                  {editingProducto ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Actualizar
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Producto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Reponer / Ingreso de stock */}
        <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
          <DialogContent className="max-w-lg bg-card border-2">
            <DialogHeader>
              <DialogTitle className="text-xl">Ingreso de Inventario (Reposición)</DialogTitle>
              <DialogDescription>
                {selectedProducto ? (
                  <>
                    Producto: <span className="font-semibold text-foreground">{selectedProducto.NombreProducto}</span>{" "}
                    <span className="text-muted-foreground">({selectedProducto.UnidadMedida})</span>
                  </>
                ) : (
                  "Selecciona un producto"
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReponer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad a sumar *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  value={movData.cantidad}
                  onChange={(e) => setMovData((prev) => ({ ...prev, cantidad: e.target.value }))}
                  placeholder="Ej: 10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Input
                  id="motivo"
                  value={movData.motivo}
                  onChange={(e) => setMovData((prev) => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ej: Compra a proveedor / reposición mensual"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setMovDialogOpen(false)} disabled={movLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={movLoading} className="gap-2">
                  <ArrowUp className="h-4 w-4" />
                  {movLoading ? "Guardando..." : "Registrar ingreso"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}