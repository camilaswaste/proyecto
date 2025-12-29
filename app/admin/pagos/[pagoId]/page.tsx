// /admin/pagos/[pagoId]/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

import { ArrowLeft, ArrowRight, Printer, CheckCircle2, Download } from "lucide-react"

interface ComprobanteData {
  PagoID: number
  NumeroComprobante?: string
  ComprobantePath?: string | null
  FechaPago: string
  Monto: number
  MetodoPago: string
  Nombre: string
  Apellido: string
  RUT: string
  NombrePlan: string
  DuracionDias: number
  FechaInicio: string
  FechaVencimiento: string
  Concepto?: string
}

export default function ComprobantePage() {
  const params = useParams()
  const { toast } = useToast()

  // Recuperación robusta del ID (soporta [pagoId], [pagold] o [id])
  const rawId = (params as any)?.pagoId || (params as any)?.pagold || (params as any)?.id
  const pagoID = Array.isArray(rawId) ? rawId[0] : rawId

  const [data, setData] = useState<ComprobanteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const comprobanteRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchComprobante = async () => {
      if (!pagoID) {
        setLoading(false)
        setError("Falta el ID del pago en la URL.")
        toast({
          variant: "warning",
          title: "Atención",
          description: "No se detectó el ID del pago en la URL.",
        })
        return
      }

      try {
        const response = await fetch(`/api/pagos/obtener?id=${pagoID}`)

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || "No se pudo cargar el comprobante")
        }

        const jsonData = await response.json()
        setData(jsonData)

        toast({
          variant: "success",
          title: "Listo",
          description: "Comprobante cargado correctamente.",
        })
      } catch (err: any) {
        console.error("Error cargando comprobante:", err)
        const msg = err?.message || "Error desconocido"
        setError(msg)

        toast({
          variant: "error",
          title: "Error",
          description: msg,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchComprobante()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagoID])

  const handlePrint = () => {
    toast({
      variant: "info",
      title: "Información",
      description: "Abriendo diálogo de impresión...",
    })
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!pagoID) {
      toast({
        variant: "warning",
        title: "Atención",
        description: "No se pudo descargar: falta el ID del pago.",
      })
      return
    }

    toast({
      variant: "info",
      title: "Información",
      description: "Procesando solicitud...",
    })

    try {
      const res = await fetch(`/api/pagos/pdf?id=${pagoID}`)
      if (!res.ok) throw new Error("No se pudo generar el PDF")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `comprobante-${pagoID}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast({
        variant: "success",
        title: "Descargado",
        description: "PDF generado y descargado correctamente.",
      })
    } catch (error: any) {
      console.error("Error descargando PDF:", error)
      toast({
        variant: "error",
        title: "Error",
        description: error?.message || "Ocurrió un error al generar el PDF",
      })
    }
  }

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatMoney = (m: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(m)
  }

  if (loading)
    return (
      <DashboardLayout role="Administrador">
        <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-b-2 dark:border-emerald-400" />
          <p className="text-slate-500 dark:text-slate-300">Generando documento...</p>
        </div>
      </DashboardLayout>
    )

  if (error || !data)
    return (
      <DashboardLayout role="Administrador">
        <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl border text-center bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-200">
          <h3 className="font-bold mb-2">No se encontró el documento</h3>
          <p className="text-sm mb-4 text-red-700 dark:text-red-200/80">{error}</p>
          <Link href="/admin/pagos">
            <Button
              variant="outline"
              className="bg-white hover:bg-red-100 border-red-200 text-red-700 dark:bg-transparent dark:hover:bg-red-950/40 dark:border-red-900/60 dark:text-red-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al historial
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout role="Administrador">
      {/* Fondo general (solo estética) */}
      <div className="min-h-[calc(100vh-64px)] py-2 sm:py-4 bg-gradient-to-b from-transparent to-slate-50/60 dark:to-slate-950/40">
        {/* 1) Toolbar */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden px-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium text-sm">Transacción Exitosa</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Comprobante #{data.PagoID}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{formatDate(data.FechaPago)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/pagos">
              <Button
                variant="outline"
                className="border-slate-200 bg-white/70 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/70 dark:border-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Nuevo Pago
              </Button>
            </Link>

            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="border-slate-200 bg-white/70 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/70 dark:border-slate-800"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar PDF
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-slate-200 bg-white/70 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/70 dark:border-slate-800"
            >
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>

            <Link href="/admin/socios">
              <Button
                variant="outline"
                className="border-slate-200 bg-white/70 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/70 dark:border-slate-800"
              >
                <ArrowRight className="w-4 h-4 mr-2" /> Socios
              </Button>
            </Link>
          </div>
        </div>

        {/* 2) Documento / Card */}
        <div className="flex justify-center print:block print:w-full print:m-0 px-4">
          <div
            ref={comprobanteRef}
            className={[
              "w-full max-w-[21cm] min-h-[14cm] relative overflow-hidden rounded-2xl",
              "bg-white shadow-xl border border-slate-200",
              "dark:bg-slate-950/70 dark:border-slate-800 dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
              "p-6 sm:p-8 md:p-12",
              "print:shadow-none print:border-none print:rounded-none print:bg-white",
            ].join(" ")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/70 via-indigo-500/60 to-purple-500/60 print:hidden" />

            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl flex items-center justify-center border border-slate-200 bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 dark:border-slate-700 print:border-slate-200">
                  <span className="font-bold text-2xl tracking-tighter">MF</span>
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MUNDO FITNESS</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Chimbarongo, Región de O&apos;Higgins</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">RUT: 76.XXX.XXX-X</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-400">
                  RECIBO DE PAGO
                </p>
                <p className="text-lg font-mono font-medium text-slate-700 dark:text-slate-200">
                  {data.NumeroComprobante || `REF-${data.PagoID}`}
                </p>
                <p className="text-sm mt-1 text-slate-500 dark:text-slate-300">{formatDate(data.FechaPago)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 mb-10">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-400">
                  Cliente
                </h3>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {data.Nombre} {data.Apellido}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">RUT: {data.RUT}</p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    ID Socio: #{data.PagoID /* Usa SocioID si está disponible */}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-400">
                  Resumen de Pago
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                    <span className="text-slate-600 dark:text-slate-300">Método:</span>
                    <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{data.MetodoPago}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                    <span className="text-slate-600 dark:text-slate-300">Estado:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Pagado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4 font-semibold text-xs uppercase rounded-l-md text-slate-600 dark:text-slate-300">
                        Concepto
                      </th>
                      <th className="py-3 px-4 font-semibold text-xs uppercase text-right rounded-r-md text-slate-600 dark:text-slate-300">
                        Importe
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{data.NombrePlan}</p>
                        <p className="text-sm mt-0.5 text-slate-500 dark:text-slate-300">
                          {data.Concepto || `Servicio de Gimnasio - ${data.DuracionDias} días`}
                        </p>
                        <p className="text-xs mt-1 text-slate-400 dark:text-slate-400">
                          Vigencia: {data.FechaInicio ? new Date(data.FechaInicio).toLocaleDateString() : "-"} al{" "}
                          {data.FechaVencimiento ? new Date(data.FechaVencimiento).toLocaleDateString() : "-"}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right align-top">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(data.Monto)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="w-full sm:w-72">
                <div className="flex justify-between items-end">
                  <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Total Pagado</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatMoney(data.Monto)}
                  </span>
                </div>
                <p className="text-right text-xs text-slate-400 dark:text-slate-400 mt-1">Pesos Chilenos (CLP)</p>
              </div>
            </div>

            <div className="mt-14 sm:mt-16 pt-8 border-t border-dashed border-slate-300 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-400 mb-2">Gracias por su preferencia</p>
              <p className="text-[10px] uppercase text-slate-300 dark:text-slate-500">
                Documento generado electrónicamente el {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            body {
              background: white;
            }
            nav,
            aside,
            header,
            footer,
            .print\\:hidden {
              display: none !important;
            }
            main,
            body > div {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}