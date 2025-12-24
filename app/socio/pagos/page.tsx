"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Download, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Pago {
  PagoID: number
  NumeroComprobante: string
  Monto: number
  FechaPago: string
  MetodoPago: string
  Concepto: string
  NombrePlan: string | null
  ComprobantePath: string | null
  Nombre: string
  Apellido: string
}

export default function SocioPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const user = getUser()
        if (!user?.socioID) return

        const response = await fetch(`/api/socio/pagos?socioID=${user.socioID}`)
        if (response.ok) {
          const data = await response.json()
          setPagos(data)
        }
      } catch (error) {
        console.error("Error al cargar pagos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPagos()
  }, [])

  const handleDownloadPDF = async (pagoID: number, comprobantePath: string | null) => {
    try {
      if (comprobantePath) {
        // Si ya existe el PDF en S3, abrir la URL directamente
        window.open(comprobantePath, "_blank")
      } else {
        // Si no existe, generar el PDF
        const response = await fetch(`/api/pagos/pdf?id=${pagoID}`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `comprobante-${pagoID}.pdf`
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

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm border-l-8 border-[#6712B1]">
          <h1 className="text-3xl font-bold text-[#450B75]">Mis Comprobantes</h1>
          <p className="text-[#450B75]">Consulta y descarga tus comprobantes de pago</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Comprobantes
            </CardTitle>
            <CardDescription>Todos tus comprobantes de pago registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando comprobantes...</div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tienes comprobantes registrados</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">N° Comprobante</th>
                        <th className="text-left p-3 font-medium text-sm">Fecha</th>
                        <th className="text-left p-3 font-medium text-sm">Concepto</th>
                        <th className="text-left p-3 font-medium text-sm">Monto</th>
                        <th className="text-left p-3 font-medium text-sm">Método</th>
                        <th className="text-right p-3 font-medium text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr key={pago.PagoID} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-sm">{pago.NumeroComprobante}</td>
                          <td className="p-3 text-sm">
                            {new Date(pago.FechaPago).toLocaleDateString("es-CL", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="p-3 text-sm">{pago.Concepto || pago.NombrePlan || "Sin concepto"}</td>
                          <td className="p-3 font-semibold text-sm">
                            {Number(pago.Monto).toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </td>
                          <td className="p-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {pago.MetodoPago}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/socio/pagos/${pago.PagoID}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(pago.PagoID, pago.ComprobantePath)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
