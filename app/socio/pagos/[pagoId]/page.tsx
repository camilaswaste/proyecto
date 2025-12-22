"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, CreditCard, Download, FileText, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ComprobanteData {
  PagoID: number
  NumeroComprobante: string
  FechaPago: string
  Monto: number
  MetodoPago: string
  Nombre: string
  Apellido: string
  RUT: string
  NombrePlan: string
  DuracionDias: number
  FechaInicio: string | null
  FechaVencimiento: string | null
  Concepto: string
  ComprobantePath: string | null
}

export default function DetalleComprobanteSocioPage() {
  const params = useParams()
  const router = useRouter()
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pagoId = params.pagoId as string

  useEffect(() => {
    const fetchComprobante = async () => {
      try {
        const response = await fetch(`/api/pagos/obtener?id=${pagoId}`)

        if (!response.ok) {
          throw new Error("No se pudo cargar el comprobante")
        }

        const data = await response.json()
        setComprobante(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar comprobante")
      } finally {
        setLoading(false)
      }
    }

    fetchComprobante()
  }, [pagoId])

  const handleDownloadPDF = async () => {
    try {
      if (comprobante?.ComprobantePath) {
        window.open(comprobante.ComprobantePath, "_blank")
      } else {
        const response = await fetch(`/api/pagos/pdf?id=${pagoId}`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `comprobante-${pagoId}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error("Error al descargar PDF:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando comprobante...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !comprobante) {
    return (
      <DashboardLayout role="Socio">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error || "Comprobante no encontrado"}</p>
              <Button onClick={() => router.push("/socio/pagos")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Pagos
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/socio/pagos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Detalle del Comprobante</h1>
              <p className="text-muted-foreground">Información completa del pago</p>
            </div>
          </div>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información del Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Número de Comprobante</p>
                <p className="font-mono font-semibold">{comprobante.NumeroComprobante}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                <p className="font-medium">
                  {new Date(comprobante.FechaPago).toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold text-primary">
                  {Number(comprobante.Monto).toLocaleString("es-CL", {
                    style: "currency",
                    currency: "CLP",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Socio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">
                  {comprobante.Nombre} {comprobante.Apellido}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">RUT</p>
                <p className="font-medium">{comprobante.RUT}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">ID de Pago</p>
                <p className="font-mono text-sm">#{comprobante.PagoID}</p>
              </div>
            </CardContent>
          </Card>

          {/* Método de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Método</p>
                <p className="font-medium">{comprobante.MetodoPago}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pagado
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detalle del Plan */}
          {comprobante.NombrePlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalle del Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{comprobante.NombrePlan}</p>
                </div>
                {comprobante.FechaInicio && comprobante.FechaVencimiento && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Vigencia</p>
                      <p className="text-sm">
                        {new Date(comprobante.FechaInicio).toLocaleDateString("es-CL")} -{" "}
                        {new Date(comprobante.FechaVencimiento).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Concepto */}
        {comprobante.Concepto && (
          <Card>
            <CardHeader>
              <CardTitle>Concepto del Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{comprobante.Concepto}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
