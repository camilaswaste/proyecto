"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { Loader2, FileText, Download, CheckCircle, AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react"

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
  NombreCliente: string
  RUTCliente: string
  ComprobantePath: string | null
  Detalle: DetalleProducto[]
}

const formatMoney = (m: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(m || 0))

type VentaPageParams = {
  ventaId: string | string[] | undefined
}

function getFirstParam(p: string | string[] | undefined) {
  if (!p) return null
  if (Array.isArray(p)) return p[0] ?? null
  return p
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function VentaDetallePage() {
  const params = useParams() as VentaPageParams
  const router = useRouter()

  const rawVentaId = getFirstParam(params.ventaId)
  const ventaId = useMemo(() => {
    const v = (rawVentaId ?? "").toString().trim()
    if (!v) return null
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) ? String(n) : null
  }, [rawVentaId])

  const [venta, setVenta] = useState<VentaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pdfGenerating, setPdfGenerating] = useState(false)

  const fetchVentaDetails = useCallback(async () => {
    if (!ventaId) {
      setLoading(false)
      setError("La URL debe contener un ID de venta válido (ej: /admin/ventas/10).")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/ventas/${ventaId}`, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Error al obtener los detalles de la venta.")
      }
      const data: VentaDetalle = await res.json()
      setVenta(data)
    } catch (e: any) {
      setError(e?.message || "Error desconocido al cargar la venta.")
    } finally {
      setLoading(false)
    }
  }, [ventaId])

  useEffect(() => {
    fetchVentaDetails()
  }, [fetchVentaDetails])

  // ✅ Descarga real (no depende de S3). Usa el route /api/admin/ventas/comprobante?id=xx
  const downloadPdfFromApi = async () => {
    if (!ventaId) return

    setPdfGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/ventas/comprobante?id=${ventaId}`, {
        method: "GET",
        headers: {
          // ayuda a evitar intermediarios raros
          Accept: "application/pdf,application/json",
        },
        cache: "no-store",
      })

      // Si NO OK: intentar leer como JSON/text
      if (!res.ok) {
        const ct = res.headers.get("content-type") || ""
        const raw = await res.text()

        if (ct.includes("application/json")) {
          const json = safeParseJson(raw)
          throw new Error(json?.error || json?.message || `Error al generar PDF (HTTP ${res.status}).`)
        }

        // Si Next devolvió HTML de error u otro texto
        const brief = raw.length > 250 ? "Error interno del servidor al generar PDF (revisa logs)." : raw
        throw new Error(brief || `Error al generar PDF (HTTP ${res.status}).`)
      }

      // OK: si viene PDF, lo bajamos igual
      const ctOk = res.headers.get("content-type") || ""
      if (!ctOk.includes("application/pdf")) {
        // a veces el server puede devolver JSON “success” por error -> mostramos contenido
        const raw = await res.text()
        const json = safeParseJson(raw)
        throw new Error(json?.error || json?.message || "La API no devolvió un PDF válido.")
      }

      const pdfBlob = await res.blob()

      // Si el server logró subir a S3, nos manda el header -> actualizamos estado
      const pdfUrlFromHeader = res.headers.get("x-comprobante-url")
      if (pdfUrlFromHeader) {
        setVenta((prev) => (prev ? { ...prev, ComprobantePath: pdfUrlFromHeader } : prev))
      }

      // ✅ Descargar SIEMPRE (no depender de window.open)
      const objectUrl = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `comprobante-venta-${ventaId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()

      // ✅ Importante: NO revocar inmediatamente (rompe en algunos navegadores)
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2500)
    } catch (e: any) {
      alert(`Error al generar/descargar PDF: ${e?.message || "Error desconocido"}`)
      console.error("PDF error:", e)
    } finally {
      setPdfGenerating(false)
    }
  }

  const handleOpenS3 = () => {
    if (!venta?.ComprobantePath) return
    window.open(venta.ComprobantePath, "_blank", "noopener,noreferrer")
  }

  if (loading) {
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
            <p className="font-semibold text-lg">{error || "Error de carga."}</p>
            <Button variant="secondary" onClick={() => router.push("/admin/ventas")} className="mt-4">
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
        {/* Header */}
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

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <p className="text-muted-foreground mt-1">Comprobante de la transacción de productos.</p>
          </div>

          <div className="flex gap-2">
            {/* Ver (si existe en S3) */}
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenS3}
              disabled={!venta.ComprobantePath}
              className="h-10 gap-2"
              title={venta.ComprobantePath ? "Abrir comprobante en S3" : "Aún no hay URL en S3"}
            >
              <ExternalLink className="h-4 w-4" />
              Ver
            </Button>

            {/* Descargar SIEMPRE (regenera/descarga desde API) */}
            <Button onClick={downloadPdfFromApi} disabled={pdfGenerating} className="h-10 px-6 gap-2">
              {pdfGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {pdfGenerating ? "Generando..." : "Descargar PDF"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumen */}
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
                <Badge variant="secondary" className="font-semibold">
                  {venta.MetodoPago}
                </Badge>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-2xl font-bold">TOTAL</span>
                <span className="text-2xl font-bold text-green-600">{formatMoney(venta.MontoTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cliente + detalle */}
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
                    <span className="text-center">
                      {item.Cantidad} {item.UnidadMedida}
                    </span>
                    <span className="font-semibold text-right">{formatMoney(item.Subtotal)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {!venta.ComprobantePath && (
          <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Aún no hay URL del comprobante en S3. Igual puedes descargar el PDF con “Descargar PDF” (se genera desde el
              servidor aunque S3 falle).
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}