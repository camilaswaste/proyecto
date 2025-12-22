"use client"

import { useState, useEffect, useCallback } from "react"
// Importamos 'useParams' para obtener el ID y 'useRouter' para la navegación
import { useParams, useRouter } from "next/navigation" 

// *** Reemplaza estas rutas con las reales de tus componentes ***
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
// *************************************************************

// Importamos 'ArrowLeft' para el icono del botón de retroceso
import { Loader2, FileText, Download, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react" 

// --- Interfaces para la Venta (Debe coincidir con la respuesta de tu API) ---
interface DetalleProducto {
    NombreProducto: string
    Cantidad: number
    PrecioUnitario: number
    Subtotal: number
    UnidadMedida: string
}

interface VentaDetalle {
    VentaID: number
    NumeroComprobante: string
    FechaVenta: string
    MontoTotal: number
    MetodoPago: string
    NombreCliente: string // Socio o 'Venta al Público'
    RUTCliente: string // RUT o 'N/A'
    ComprobantePath: string | null // URL del PDF en S3
    Detalle: DetalleProducto[]
}

// Función para formatear el dinero (igual que en el TPV)
const formatMoney = (m: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(m)
}

type VentaPageParams = {
    ventaId: string | string[] | undefined;
}

export default function VentaDetallePage() {
    const params = useParams() as VentaPageParams;
    // Inicializamos el router para poder navegar
    const router = useRouter(); 


    // Extracción robusta del ID
    const rawVentaId = Array.isArray(params.ventaId) ? params.ventaId[0] : params.ventaId
    // Aseguramos que solo usamos el valor si es una cadena no vacía.
    const ventaId = (rawVentaId && typeof rawVentaId === 'string' && rawVentaId.trim() !== '') ? rawVentaId : null

    // LÍNEAS DE DIAGNÓSTICO (Revísalas en la consola del navegador)
    console.log("URL Params:", params);
    console.log("Extracted ventaId:", ventaId);
    // -------------------------------------------------------------------

    const [venta, setVenta] = useState<VentaDetalle | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pdfGenerating, setPdfGenerating] = useState(false) // Estado para el botón de PDF

    const fetchVentaDetails = useCallback(async () => {
        // CAMBIO: Ya no establecemos 'loading(false)' ni 'error' inmediatamente
        // si el ID no está. Simplemente salimos del fetch si no hay ID.
        // El componente principal se encarga del 'loading' inicial.

        if (!ventaId) {
            // Si no hay ID, salimos. El useEffect se volverá a disparar cuando el ID aparezca.
            // Si después de la primera carga (loading = false) aún no hay ID, establecemos el error.
            return
        }

        try {
            setLoading(true) // Importante: Volver a poner en true si el ID cambia

            const idNumerico = parseInt(ventaId, 10);
            if (Number.isNaN(idNumerico)) {
                throw new Error("ID de Venta Inválido: El valor en la URL no es un número.")
            }

            // Llama a la API
            const response = await fetch(`/api/admin/ventas/${idNumerico}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Error al obtener los detalles de la venta.")
            }
            const data: VentaDetalle = await response.json()
            setVenta(data)

            // ... (resto de la lógica de fetch, throw new Error, setVenta) ...

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [ventaId])
    useEffect(() => {
        fetchVentaDetails()
    }, [fetchVentaDetails])


    // 2. LÓGICA PARA GENERAR Y DESCARGAR EL PDF
    const handleDownloadPDF = async () => {
        if (!ventaId) return

        // Si ya tenemos el path del comprobante, lo abrimos directamente
        if (venta?.ComprobantePath) {
            window.open(venta.ComprobantePath, "_blank");
            return;
        }

        setPdfGenerating(true)
        try {
            // 1. Llamamos a la API que creamos para generar el PDF
            // Nota: Se corrigió la ruta para usar 'comprobante/pdf' según lo acordado.
            const response = await fetch(`/api/admin/ventas/comprobante/pdf?id=${ventaId}`) 

            // 2. Manejo de Errores (CORECCIÓN: CLONAR LA RESPUESTA PARA PODER LEERLA DOS VECES)
            if (!response.ok) {

                // CLONAMOS la respuesta antes de intentar leer el cuerpo la primera vez
                const errorResponseClone = response.clone();

                let errorText = "Error desconocido al generar el PDF (Error 500 o 4xx).";

                // Intentamos leer el cuerpo como JSON (usa la respuesta original)
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || errorData.message || errorText;
                } catch (e) {
                    // Si el JSON.parse falla, leemos el CLON como texto simple.
                    const rawText = await errorResponseClone.text();

                    errorText = rawText.length > 200
                        ? "Error interno del servidor. Ver consola para el HTML de error."
                        : rawText;
                }

                throw new Error(errorText);
            }

            // 3. Si la respuesta fue exitosa (response.ok es true):

            // IMPORTANTE: Si la respuesta es OK, el cuerpo se lee como BLOB, lo cual es correcto.
            const pdfBlob = await response.blob()

            // Obtener la URL actualizada del comprobante del header (si la API lo envía)
            const pdfUrlFromHeader = response.headers.get("x-comprobante-url");

            // Actualizar el estado para que el botón muestre 'Ver Comprobante' la próxima vez
            if (pdfUrlFromHeader && venta) {
                setVenta(prevVenta => prevVenta ? { ...prevVenta, ComprobantePath: pdfUrlFromHeader } : null);
            }

            // Crear y abrir el PDF
            const url = window.URL.createObjectURL(pdfBlob)
            window.open(url, "_blank")
            window.URL.revokeObjectURL(url)

        } catch (err: any) {
            alert(`Error al generar PDF: ${err.message}`)
            console.error("Error completo en la descarga del PDF:", err)
        } finally {
            setPdfGenerating(false)
        }
    }


    if (loading || (!ventaId && loading)) {
        return (
            <DashboardLayout role="Administrador">
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Cargando detalles de la venta...</span>
                </div>
            </DashboardLayout>
        )
    }

    if (error || !venta || !ventaId) {
        return (
            <DashboardLayout role="Administrador">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Error al Cargar la Venta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg">
                            {error || "Error de Carga."}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {ventaId
                                ? `Detalle: Venta con ID ${ventaId} no existe o error de API.`
                                : `Detalle: La URL debe contener un ID de venta válido (ej: /admin/ventas/10).`}
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => router.push("/admin/ventas")}
                            className="mt-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Ventas
                        </Button>
                    </CardContent>
                </Card>
            </DashboardLayout>
        )
    }

    const fechaHoraVenta = new Date(venta.FechaVenta).toLocaleString("es-CL")


    return (
        <DashboardLayout role="Administrador">
            <div className="space-y-6">
                
                {/* 1. Botón de Retroceso y Título Principal */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin/ventas")}
                        className="h-10 w-10 text-gray-600 hover:bg-gray-100"
                        title="Volver al Historial de Ventas"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CheckCircle className="h-7 w-7 text-green-600" /> Venta Procesada #{venta.VentaID}
                    </h1>
                </div>

                <div className="flex justify-between items-start">
                    
                    <div>
                        <p className="text-muted-foreground mt-1">Comprobante de la transacción de productos.</p>
                    </div>

                    {/* Botón de PDF */}
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={pdfGenerating}
                        className="h-10 px-6 bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        {pdfGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : venta.ComprobantePath ? (
                            <FileText className="h-4 w-4" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        {pdfGenerating ? "Generando..." : venta.ComprobantePath ? "Ver Comprobante" : "Descargar Comprobante"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Tarjeta de Resumen */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-xl">Resumen de Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Fecha y Hora</span>
                                <span className="font-medium">{fechaHoraVenta}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Comprobante Interno</span>
                                <span className="font-medium">{venta.NumeroComprobante}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Método de Pago</span>
                                <Badge variant="secondary" className="font-semibold">{venta.MetodoPago}</Badge>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-2xl font-bold">TOTAL</span>
                                <span className="text-2xl font-bold text-green-600">{formatMoney(venta.MontoTotal)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de Detalles del Cliente */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-xl">Detalle del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nombre</span>
                                <span className="font-medium">{venta.NombreCliente}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">RUT/Identificación</span>
                                <span className="font-medium">{venta.RUTCliente}</span>
                            </div>
                            <Separator className="my-4" />
                            <h3 className="text-lg font-semibold mb-3">Productos Vendidos</h3>

                            {/* Lista de Productos */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-4 font-bold text-sm text-gray-500 border-b pb-2">
                                    <span className="col-span-2">Producto</span>
                                    <span className="text-center">Cant.</span>
                                    <span className="text-right">Subtotal</span>
                                </div>
                                {venta.Detalle.map((item, index) => (
                                    <div key={index} className="grid grid-cols-4 text-sm border-b last:border-b-0 pb-2">
                                        <div className="col-span-2">
                                            <p className="font-medium">{item.NombreProducto}</p>
                                            <p className="text-xs text-muted-foreground">{formatMoney(item.PrecioUnitario)} c/u</p>
                                        </div>
                                        <span className="text-center">{item.Cantidad} {item.UnidadMedida}</span>
                                        <span className="font-semibold text-right">{formatMoney(item.Subtotal)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Aviso si el comprobante no se ha generado */}
                {!venta.ComprobantePath && (
                    <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">El comprobante PDF aún no ha sido generado o subido a S3. Presiona el botón "Descargar Comprobante" para crearlo.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}