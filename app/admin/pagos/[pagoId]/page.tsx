//admin/pagos/[pagoId]/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft,ArrowRight, Printer, CheckCircle2, Download } from "lucide-react"

// Interfaz que coincide con tu API real (/api/pagos/obtener)
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

  // Recuperación robusta del ID (soporta [pagoId], [pagold] o [id])
  const rawId = (params as any)?.pagoId || (params as any)?.pagold || (params as any)?.id
  const pagoID = Array.isArray(rawId) ? rawId[0] : rawId

  const [data, setData] = useState<ComprobanteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Ref al contenido que queremos convertir en PDF
  const comprobanteRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchComprobante = async () => {
      if (!pagoID) return

      try {
        const response = await fetch(`/api/pagos/obtener?id=${pagoID}`)

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || "No se pudo cargar el comprobante")
        }

        const jsonData = await response.json()
        setData(jsonData)
      } catch (err: any) {
        console.error("Error cargando comprobante:", err)
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchComprobante()
  }, [pagoID])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!pagoID) return

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
    } catch (error) {
      console.error("Error descargando PDF:", error)
      alert("Ocurrió un error al generar el PDF")
    }
  }



  // Utilidades de formato
  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatMoney = (m: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP"
    }).format(m)
  }

  if (loading) return (
    <DashboardLayout role="Administrador">
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="text-slate-500">Generando documento...</p>
      </div>
    </DashboardLayout>
  )

  if (error || !data) return (
    <DashboardLayout role="Administrador">
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-red-800 font-bold mb-2">No se encontró el documento</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link href="/admin/pagos">
          <Button variant="outline" className="bg-white hover:bg-red-100 border-red-200 text-red-700">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al historial
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="Administrador">
      {/* 1. BARRA DE HERRAMIENTAS (Visible solo en pantalla) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium text-sm">Transacción Exitosa</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Comprobante #{data.PagoID}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pagos">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Nuevo Pago
            </Button>
          </Link>

          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Descargar PDF
          </Button>

               <Link href="/admin/socios">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" /> Socios
            </Button>
          </Link>



        </div>
      </div>

      {/* 2. DISEÑO DEL DOCUMENTO (Papel A4 visual) */}
      <div className="flex justify-center print:block print:w-full print:m-0">
        <div
          ref={comprobanteRef}
          className="bg-white shadow-xl print:shadow-none w-full max-w-[21cm] min-h-[14cm] p-8 md:p-12 border border-slate-200 print:border-none relative"
        >
          {/* Encabezado */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
            <div className="flex items-center gap-4">
              {/* Logo / Icono */}
              <div className="h-16 w-16 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <span className="font-bold text-2xl tracking-tighter">MF</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">MUNDO FITNESS</h2>
                <p className="text-sm text-slate-500">Chimbarongo, Región de O&apos;Higgins</p>
                <p className="text-sm text-slate-500">RUT: 76.XXX.XXX-X</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">RECIBO DE PAGO</p>
              <p className="text-lg font-mono font-medium text-slate-700">{data.NumeroComprobante || `REF-${data.PagoID}`}</p>
              <p className="text-sm text-slate-500 mt-1">{formatDate(data.FechaPago)}</p>
            </div>
          </div>

          {/* Información Principal */}
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cliente</h3>
              <div className="space-y-1">
                <p className="font-bold text-lg text-slate-900">{data.Nombre} {data.Apellido}</p>
                <p className="text-slate-600">RUT: {data.RUT}</p>
                <p className="text-slate-600 text-sm">ID Socio: #{data.PagoID /* Usar SocioID si está disponible */}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumen de Pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-50 pb-1">
                  <span className="text-slate-600">Método:</span>
                  <span className="font-medium capitalize text-slate-900">{data.MetodoPago}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-1">
                  <span className="text-slate-600">Estado:</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Pagado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-3 px-4 font-semibold text-slate-600 text-xs uppercase rounded-l-md">Concepto</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 text-xs uppercase text-right rounded-r-md">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">{data.NombrePlan}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{data.Concepto || `Servicio de Gimnasio - ${data.DuracionDias} días`}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Vigencia: {data.FechaInicio ? new Date(data.FechaInicio).toLocaleDateString() : "-"} al {data.FechaVencimiento ? new Date(data.FechaVencimiento).toLocaleDateString() : "-"}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right align-top">
                    <span className="font-bold text-slate-800">{formatMoney(data.Monto)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end border-t border-slate-200 pt-6">
            <div className="w-64">
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold text-slate-900">Total Pagado</span>
                <span className="text-2xl font-bold text-slate-900">{formatMoney(data.Monto)}</span>
              </div>
              <p className="text-right text-xs text-slate-400 mt-1">Pesos Chilenos (CLP)</p>
            </div>
          </div>

          {/* Footer del Documento */}
          <div className="mt-16 pt-8 border-t border-dashed border-slate-300 text-center">
            <p className="text-xs text-slate-400 mb-2">Gracias por su preferencia</p>
            <p className="text-[10px] text-slate-300 uppercase">
              Documento generado electrónicamente el {new Date().toLocaleDateString()}
            </p>
          </div>

        </div>
      </div>

      {/* Estilos de impresión para ocultar el dashboard al imprimir */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          nav, aside, header, footer, .print\\:hidden { display: none !important; }
          main, body > div { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}