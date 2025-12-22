// /admin/ventas/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// *** Reemplaza estas rutas con las reales de tus componentes ***
import { DashboardLayout } from "@/components/dashboard-layout" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { Badge } from "@/components/ui/badge"
// NUEVOS REQUERIDOS: Componentes base de tabla
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" 
// *************************************************************

// Lucide Icons
import { ShoppingCart, Zap, Loader2, Minus, Plus, Banknote, List, FileText, Download } from "lucide-react" 
import { X } from "lucide-react"
import Link from "next/link"

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

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"]

// --- Interfaces para el Historial ---
interface VentaHistorial {
    VentaID: number;
    FechaVenta: string; 
    MontoTotal: number;
    MetodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
    NombreUsuarioRegistro: string;
    ComprobantePath: string | null; 
    SocioNombre: string | null; 
}

// Función para formatear el dinero (Asumiendo CLP)
const formatMoney = (m: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(m)
}


const HistorialVentasTab = () => {
    const [ventas, setVentas] = useState<VentaHistorial[]>([])
    const [loading, setLoading] = useState(true)

    const fetchVentas = useCallback(async () => {
        try {
            setLoading(true);
            // Este endpoint debe devolver la lista de ventas
            const response = await fetch("/api/admin/ventas/historial") 
            
            if (response.ok) {
                const data = await response.json()
                setVentas(data)
            } else {
                console.error("Fallo al cargar historial de ventas:", response.statusText);
            }
        } catch (error) {
            console.error("Error de red al cargar historial:", error);
        } finally {
            setLoading(false);
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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID Venta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ventas.length > 0 ? (
                        ventas.map((venta) => {
                            const date = new Date(venta.FechaVenta);
                            return (
                                <TableRow key={venta.VentaID}>
                                    <TableCell className="font-medium">
                                        <Link 
                                            href={`/admin/ventas/${venta.VentaID}`} 
                                            className="text-primary hover:underline"
                                        >
                                            #{venta.VentaID}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {date.toLocaleDateString('es-CL')} 
                                        <span className="text-muted-foreground ml-1">
                                            {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={venta.SocioNombre ? "font-medium" : "text-muted-foreground"}>
                                            {venta.SocioNombre || "Público General"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-base text-green-700">
                                        {formatMoney(venta.MontoTotal)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{venta.MetodoPago}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {venta.ComprobantePath ? (
                                            <Button asChild size="sm" variant="ghost" className="p-0 h-8">
                                                <a href={venta.ComprobantePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary">
                                                    <Download className="h-4 w-4" /> PDF
                                                </a>
                                            </Button>
                                        ) : (
                                            <Badge variant="destructive">Pendiente</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild size="sm" variant="outline">
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
    // Estado para controlar qué pestaña está activa
    const [activeTab, setActiveTab] = useState("tpv");
    
    // --- LÓGICA TPV (se mantiene igual) ---
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoVenta[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false) 
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [totalVenta, setTotalVenta] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<string | null>(null) 
    

    const fetchProductos = useCallback(async () => {
    try {
      setLoadingProductos(true);
      const response = await fetch("/api/admin/productos")
      if (response.ok) {
        const data = await response.json()
        setProductosDisponibles(data)
      } else {
        console.error("Fallo al cargar productos:", response.statusText);
      }
    } catch (error) {
      console.error("Error de red al cargar productos:", error);
    } finally {
      setLoadingProductos(false);
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])
  
  useEffect(() => {
      const newTotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
      setTotalVenta(newTotal);
  }, [carrito])
    
    // Lógica del Carrito (handleAgregarProducto, handleUpdateCantidad) - Se mantiene igual
    const handleAgregarProducto = (producto: ProductoVenta) => {
        setCarrito((prevCarrito) => {
            const itemIndex = prevCarrito.findIndex((item) => item.ProductoID === producto.ProductoID);
            const stockDisponible = producto.StockActual;

            if (itemIndex > -1) {
                const currentItem = prevCarrito[itemIndex];
                const newCantidad = currentItem.cantidad + 1;
                
                if (newCantidad > stockDisponible) {
                    alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${producto.NombreProducto}.`);
                    return prevCarrito;
                }

                return prevCarrito.map((item, index) => 
                    index === itemIndex
                        ? { ...item, cantidad: newCantidad, subtotal: newCantidad * item.PrecioVenta }
                        : item
                );
            } else {
                if (stockDisponible <= 0) return prevCarrito;

                const newItem: CarritoItem = { ...producto, cantidad: 1, subtotal: producto.PrecioVenta };
                return [...prevCarrito, newItem];
            }
        });
    };

    const handleUpdateCantidad = (productoID: number, delta: number) => {
        setCarrito((prevCarrito) => {
            const itemIndex = prevCarrito.findIndex((item) => item.ProductoID === productoID);
            if (itemIndex === -1) return prevCarrito;

            const currentItem = prevCarrito[itemIndex];
            const productoBase = productosDisponibles.find(p => p.ProductoID === productoID);
            const stockDisponible = productoBase?.StockActual ?? 0;
            
            const newCantidad = currentItem.cantidad + delta;

            if (newCantidad <= 0) {
                return prevCarrito.filter(item => item.ProductoID !== productoID);
            }
            
            if (newCantidad > stockDisponible) {
                alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${currentItem.NombreProducto}.`);
                return prevCarrito;
            }
            
            return prevCarrito.map((item, index) => 
                index === itemIndex
                    ? { ...item, cantidad: newCantidad, subtotal: newCantidad * item.PrecioVenta }
                    : item
            );
        });
    };

    // Lógica de Procesamiento de Venta (handleProcesarVenta) - Se mantiene igual
    const handleProcesarVenta = async () => {
        if (carrito.length === 0) return alert("El carrito está vacío.")
        if (totalVenta <= 0) return alert("El monto total debe ser positivo.")
        if (!metodoPago) return alert("Por favor, selecciona un método de pago.")

        setIsProcessing(true)

        try {
            const ventaData = {
                socioID: null, 
                montoTotal: totalVenta,
                metodoPago: metodoPago, 
                carrito: carrito.map(item => ({
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
            
            // Si la venta fue exitosa, limpiamos el carrito y redireccionamos/actualizamos
            setCarrito([]);
            setMetodoPago(null);

            // Redirigir al comprobante
            router.push(`/admin/ventas/${result.ventaID}`) 

        } catch (err: any) {
            alert(`Error de Venta: ${err.message}`)
            console.error(err)
        } finally {
            setIsProcessing(false)
        }
    };
    
  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-7 w-7" /> Gestión de ventas 
        </h1>
        <p className="text-muted-foreground">Procesa nuevas ventas y revisa el historial de pagos de productos.</p>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full lg:w-96 grid-cols-2">
                <TabsTrigger value="tpv" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Nueva venta
                </TabsTrigger>
                <TabsTrigger value="historial" className="flex items-center gap-2">
                    <List className="h-4 w-4" /> Historial de Pagos
                </TabsTrigger>
            </TabsList>

            {/* --- CONTENIDO PESTAÑA 1: PUNTO DE VENTA (TPV) --- */}
            <TabsContent value="tpv">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    
                    {/* Columna 1: Búsqueda y Selección de Productos */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl">Productos Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingProductos ? (
                                <div className="h-48 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                    {productosDisponibles.map((p) => (
                                        <Button 
                                            key={p.ProductoID} 
                                            variant="outline" 
                                            className="flex flex-col h-auto p-3 text-left items-start disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 hover:bg-slate-50"
                                            onClick={() => handleAgregarProducto(p)}
                                            disabled={p.StockActual <= 0}
                                        >
                                            <span className="text-sm font-semibold truncate w-full">{p.NombreProducto}</span>
                                            <span className="text-sm text-primary font-bold">
                                                {formatMoney(p.PrecioVenta)}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                Stock: {p.StockActual} {p.UnidadMedida}
                                            </span>
                                        </Button>
                                    ))}
                                    {productosDisponibles.length === 0 && !loadingProductos && (
                                        <p className="text-muted-foreground text-center col-span-4 py-8">No hay productos con stock para la venta.</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Columna 2: Carrito y Resumen */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Tarjeta de Cliente (Venta al público) */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Venta al público</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">La venta se registrará sin asociación a un Socio.</p>
                            </CardContent>
                        </Card>

                        {/* Tarjeta de Carrito y Pago */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" /> Resumen de Venta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                
                                {/* Visualización de items del carrito */}
                                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                                    {carrito.length === 0 ? (
                                        <p className="text-muted-foreground text-sm text-center py-4">Carrito vacío. Agrega un producto.</p>
                                    ) : (
                                        carrito.map((item) => (
                                            <div key={item.ProductoID} className="flex justify-between items-center text-sm border-b pb-2 last:border-b-0 gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-semibold truncate block">{item.NombreProducto}</span>
                                                    <span className="text-xs text-muted-foreground block">{formatMoney(item.PrecioVenta)} x {item.cantidad} {item.UnidadMedida}</span>
                                                </div>
                                                
                                                {/* Control de Cantidad */}
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="outline" size="sm" className="h-7 w-7 p-0" 
                                                        onClick={() => handleUpdateCantidad(item.ProductoID, -1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="font-bold text-slate-700 w-4 text-center">{item.cantidad}</span>
                                                    <Button 
                                                        variant="outline" size="sm" className="h-7 w-7 p-0" 
                                                        onClick={() => handleUpdateCantidad(item.ProductoID, 1)}
                                                        disabled={item.cantidad >= (productosDisponibles.find(p => p.ProductoID === item.ProductoID)?.StockActual ?? Infinity)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                
                                                {/* Subtotal */}
                                                <span className="font-bold text-base text-right w-16 min-w-min">{formatMoney(item.subtotal)}</span>
                                                
                                                <Button variant="ghost" size="sm" className="p-0 h-7 w-7" onClick={() => handleUpdateCantidad(item.ProductoID, -item.cantidad)} title="Eliminar">
                                                    <X className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                {/* Selector de Método de Pago */}
                                <div className="border-t pt-3 space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                                        <Banknote className="h-4 w-4" /> Método de Pago
                                    </label>
                                    <Select onValueChange={setMetodoPago} value={metodoPago || ""}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {METODOS_PAGO.map(metodo => (
                                                <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Total */}
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>TOTAL:</span>
                                        <span className="text-primary">{formatMoney(totalVenta)}</span>
                                    </div>
                                </div>

                                {/* Botón de Pago */}
                                <Button 
                                    className="w-full h-12 text-lg font-extrabold gap-2 bg-green-600 hover:bg-green-700"
                                    onClick={handleProcesarVenta} 
                                    disabled={carrito.length === 0 || isProcessing || !metodoPago || totalVenta <= 0} 
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" /> Procesando Venta...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Zap className="h-5 w-5" /> Finalizar Venta
                                        </span>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            {/* --- CONTENIDO PESTAÑA 2: HISTORIAL DE PAGOS --- */}
            <TabsContent value="historial" className="pt-4">
                <HistorialVentasTab />
            </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  )
}