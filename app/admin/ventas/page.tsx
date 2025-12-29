// /admin/ventas/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

import {
  ShoppingCart,
  Zap,
  Loader2,
  Minus,
  Plus,
  Banknote,
  List,
  FileText,
  Download,
  Search,
  Trash2,
} from "lucide-react"
import { X } from "lucide-react"

// --- Interfaces Reutilizadas del TPV ---
interface ProductoVenta {
  ProductoID: number
  NombreProducto: string
  PrecioVenta: number
  StockActual: number
  UnidadMedida: string
}

interface CarritoItem extends ProductoVenta {
  cantidad: number
  subtotal: number
}

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"] as const

// --- Interfaces para el Historial ---
interface VentaHistorial {
  VentaID: number
  FechaVenta: string
  MontoTotal: number
  MetodoPago: "Efectivo" | "Tarjeta" | "Transferencia"
  NombreUsuarioRegistro: string
  ComprobantePath: string | null
  SocioNombre: string | null
}

const formatMoney = (m: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(m)

const HistorialVentasTab = () => {
  const [ventas, setVentas] = useState<VentaHistorial[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/ventas/historial")
      if (response.ok) {
        const data = await response.json()
        setVentas(data)
      } else {
        console.error("Fallo al cargar historial de ventas:", response.statusText)
      }
    } catch (error) {
      console.error("Error de red al cargar historial:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Cargando historial de ventas...</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-semibold">Historial de ventas</p>
            <p className="text-xs text-muted-foreground">Revisa comprobantes y detalle por venta.</p>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {ventas.length} registros
          </Badge>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Venta</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Comprobante</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.length > 0 ? (
            ventas.map((venta) => {
              const date = new Date(venta.FechaVenta)
              return (
                <TableRow key={venta.VentaID}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/ventas/${venta.VentaID}`} className="text-primary hover:underline">
                      #{venta.VentaID}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {date.toLocaleDateString("es-CL")}{" "}
                    <span className="text-muted-foreground ml-1">
                      {date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={venta.SocioNombre ? "font-medium" : "text-muted-foreground"}>
                      {venta.SocioNombre || "Público General"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-base">{formatMoney(venta.MontoTotal)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      {venta.MetodoPago}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {venta.ComprobantePath ? (
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                        <a
                          href={venta.ComprobantePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary"
                        >
                          <Download className="h-4 w-4" /> PDF
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="destructive">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/admin/ventas/${venta.VentaID}`}>
                        <FileText className="h-4 w-4 mr-2" /> Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No se encontraron ventas registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// =============================================================================
//                              PÁGINA PRINCIPAL (TPV + TABS)
// =============================================================================

export default function AdminVentasPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tpv")

  // --- LÓGICA TPV (MISMA) ---
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoVenta[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [totalVenta, setTotalVenta] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<string | null>(null)

  // UI (no cambia lógica)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchProductos = useCallback(async () => {
    try {
      setLoadingProductos(true)
      const response = await fetch("/api/admin/productos")
      if (response.ok) {
        const data = await response.json()
        setProductosDisponibles(data)
      } else {
        console.error("Fallo al cargar productos:", response.statusText)
      }
    } catch (error) {
      console.error("Error de red al cargar productos:", error)
    } finally {
      setLoadingProductos(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  useEffect(() => {
    const newTotal = carrito.reduce((sum, item) => sum + item.subtotal, 0)
    setTotalVenta(newTotal)
  }, [carrito])

  // --- FILTRO UI (no cambia tu lógica de negocio) ---
  const productosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return productosDisponibles
    return productosDisponibles.filter((p) => p.NombreProducto.toLowerCase().includes(term))
  }, [productosDisponibles, searchTerm])

  // Lógica del Carrito - MISMA
  const handleAgregarProducto = (producto: ProductoVenta) => {
    setCarrito((prevCarrito) => {
      const itemIndex = prevCarrito.findIndex((item) => item.ProductoID === producto.ProductoID)
      const stockDisponible = producto.StockActual

      if (itemIndex > -1) {
        const currentItem = prevCarrito[itemIndex]
        const newCantidad = currentItem.cantidad + 1

        if (newCantidad > stockDisponible) {
          alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${producto.NombreProducto}.`)
          return prevCarrito
        }

        return prevCarrito.map((item, index) =>
          index === itemIndex ? { ...item, cantidad: newCantidad, subtotal: newCantidad * item.PrecioVenta } : item,
        )
      } else {
        if (stockDisponible <= 0) return prevCarrito
        const newItem: CarritoItem = { ...producto, cantidad: 1, subtotal: producto.PrecioVenta }
        return [...prevCarrito, newItem]
      }
    })
  }

  const handleUpdateCantidad = (productoID: number, delta: number) => {
    setCarrito((prevCarrito) => {
      const itemIndex = prevCarrito.findIndex((item) => item.ProductoID === productoID)
      if (itemIndex === -1) return prevCarrito

      const currentItem = prevCarrito[itemIndex]
      const productoBase = productosDisponibles.find((p) => p.ProductoID === productoID)
      const stockDisponible = productoBase?.StockActual ?? 0

      const newCantidad = currentItem.cantidad + delta

      if (newCantidad <= 0) {
        return prevCarrito.filter((item) => item.ProductoID !== productoID)
      }

      if (newCantidad > stockDisponible) {
        alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${currentItem.NombreProducto}.`)
        return prevCarrito
      }

      return prevCarrito.map((item, index) =>
        index === itemIndex ? { ...item, cantidad: newCantidad, subtotal: newCantidad * item.PrecioVenta } : item,
      )
    })
  }

  // Lógica de Procesamiento de Venta - MISMA
  const handleProcesarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío.")
    if (totalVenta <= 0) return alert("El monto total debe ser positivo.")
    if (!metodoPago) return alert("Por favor, selecciona un método de pago.")

    setIsProcessing(true)

    try {
      const ventaData = {
        socioID: null, // ✅ venta al público
        montoTotal: totalVenta,
        metodoPago: metodoPago,
        carrito: carrito.map((item) => ({
          productoID: item.ProductoID,
          cantidad: item.cantidad,
          precioUnitario: item.PrecioVenta,
          subtotal: item.subtotal,
        })),
      }

      const response = await fetch("/api/admin/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ventaData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Error al procesar la venta en el servidor.")
      }

      const result = await response.json()

      setCarrito([])
      setMetodoPago(null)

      router.push(`/admin/ventas/${result.ventaID}`)
    } catch (err: any) {
      alert(`Error de Venta: ${err.message}`)
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearCart = () => {
    if (carrito.length === 0) return
    const ok = confirm("¿Vaciar carrito?")
    if (!ok) return
    setCarrito([])
    setMetodoPago(null)
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7" /> Gestión de ventas
          </h1>
          <p className="text-muted-foreground">
            Procesa <span className="font-medium">ventas al público</span> y revisa el historial de pagos de productos.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full lg:w-96 grid-cols-2">
            <TabsTrigger value="tpv" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Nueva venta
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <List className="h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          {/* ===================== NUEVA VENTA ===================== */}
          <TabsContent value="tpv" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* IZQUIERDA: Productos (siempre listados) */}
              <Card className="lg:col-span-8 overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <CardTitle className="text-xl">Productos</CardTitle>
                      <p className="text-sm text-muted-foreground">Haz clic para agregar al carrito.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {productosDisponibles.length} en catálogo
                      </Badge>
                      <Badge variant="outline" className="font-semibold">
                        {productosDisponibles.filter((p) => p.StockActual > 0).length} con stock
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar producto..."
                      className="pl-10 h-11"
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {loadingProductos ? (
                    <div className="h-56 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-2">
                      {productosFiltrados.map((p) => {
                        const sinStock = p.StockActual <= 0
                        return (
                          <button
                            key={p.ProductoID}
                            type="button"
                            onClick={() => handleAgregarProducto(p)}
                            disabled={sinStock}
                            className={[
                              "group text-left rounded-xl border bg-background p-4 transition-all",
                              "hover:shadow-md hover:border-primary/40",
                              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold leading-tight truncate">{p.NombreProducto}</p>
                                <p className="text-sm text-primary font-bold mt-1">{formatMoney(p.PrecioVenta)}</p>
                              </div>

                              {sinStock ? (
                                <Badge variant="destructive" className="shrink-0">
                                  Sin stock
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="shrink-0">
                                  Stock: {p.StockActual}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Unidad: {p.UnidadMedida}</span>
                              <span className="group-hover:text-primary transition-colors">Agregar →</span>
                            </div>
                          </button>
                        )
                      })}

                      {productosFiltrados.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                          <p className="text-muted-foreground font-medium">No se encontraron productos</p>
                          <p className="text-sm text-muted-foreground mt-1">Prueba con otro término.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DERECHA: Carrito + Pago (tipo checkout) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Venta al público */}
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Venta al público</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Esta venta se registrará como <span className="font-medium">Público General</span> (sin Socio).
                  </CardContent>
                </Card>

                {/* Checkout */}
                <Card className="border-2 overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Carrito
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCart}
                        disabled={carrito.length === 0 || isProcessing}
                        className="gap-2"
                        title="Vaciar carrito"
                      >
                        <Trash2 className="h-4 w-4" />
                        Vaciar
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Items */}
                    <div className="max-h-[42vh] overflow-y-auto pr-1 space-y-3">
                      {carrito.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">Carrito vacío.</p>
                          <p className="text-xs text-muted-foreground mt-1">Selecciona productos para comenzar.</p>
                        </div>
                      ) : (
                        carrito.map((item) => {
                          const stock = productosDisponibles.find((p) => p.ProductoID === item.ProductoID)?.StockActual ?? 0
                          const disablePlus = item.cantidad >= stock

                          return (
                            <div key={item.ProductoID} className="rounded-xl border p-3 bg-background">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{item.NombreProducto}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatMoney(item.PrecioVenta)} c/u • Stock: {stock} {item.UnidadMedida}
                                  </p>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateCantidad(item.ProductoID, -item.cantidad)}
                                  title="Eliminar"
                                  disabled={isProcessing}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                {/* Cantidad */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleUpdateCantidad(item.ProductoID, -1)}
                                    disabled={isProcessing}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>

                                  <div className="h-8 min-w-[44px] px-3 rounded-lg border flex items-center justify-center font-bold">
                                    {item.cantidad}
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleUpdateCantidad(item.ProductoID, 1)}
                                    disabled={disablePlus || isProcessing}
                                    title={disablePlus ? "Sin stock disponible" : "Aumentar"}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Subtotal */}
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Subtotal</p>
                                  <p className="font-bold">{formatMoney(item.subtotal)}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <Separator />

                    {/* Método de pago */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Banknote className="h-4 w-4" /> Método de Pago
                      </label>
                      <Select onValueChange={setMetodoPago} value={metodoPago || ""} disabled={isProcessing}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          {METODOS_PAGO.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Total */}
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total a pagar</span>
                        <Badge variant="secondary" className="font-semibold">
                          {carrito.length} item(s)
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-extrabold">TOTAL</span>
                        <span className="text-2xl font-extrabold text-primary">{formatMoney(totalVenta)}</span>
                      </div>
                    </div>

                    {/* Botón finalizar */}
                    <Button
                      className="w-full h-12 text-base font-extrabold gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleProcesarVenta}
                      disabled={carrito.length === 0 || isProcessing || !metodoPago || totalVenta <= 0}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" /> Procesando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="h-5 w-5" /> Finalizar Venta
                        </span>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Al finalizar, se registrará la venta y podrás descargar/ver el comprobante.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===================== HISTORIAL ===================== */}
          <TabsContent value="historial" className="pt-4">
            <HistorialVentasTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}