"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, CreditCard, Download, FileText, ShieldCheck, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

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

const container = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, duration: 0.35 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
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
        if (!response.ok) throw new Error("No se pudo cargar el comprobante")
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

  const fechaLarga = useMemo(() => {
    if (!comprobante?.FechaPago) return ""
    return new Date(comprobante.FechaPago).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [comprobante?.FechaPago])

  const vigencia = useMemo(() => {
    if (!comprobante?.FechaInicio || !comprobante?.FechaVencimiento) return null
    return `${new Date(comprobante.FechaInicio).toLocaleDateString("es-CL")} - ${new Date(
      comprobante.FechaVencimiento
    ).toLocaleDateString("es-CL")}`
  }, [comprobante?.FechaInicio, comprobante?.FechaVencimiento])

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.18),transparent_55%)]" />
          <div className="relative flex min-h-[320px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-red-600 dark:border-slate-800 dark:border-t-red-500" />
              <p className="text-sm text-slate-600 dark:text-slate-300">Cargando comprobante...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !comprobante) {
    return (
      <DashboardLayout role="Socio">
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/60 dark:bg-red-950/30">
              <p className="mb-4 text-sm font-semibold text-red-700 dark:text-red-300">
                {error || "Comprobante no encontrado"}
              </p>
              <Button onClick={() => router.push("/socio/pagos")} variant="outline" className="border-slate-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 sm:space-y-7">
        {/* HEADER / HERO */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.16),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.22),transparent_55%)]" />
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-red-600/25 to-fuchsia-600/10 blur-2xl dark:from-red-500/25 dark:to-fuchsia-500/10" />
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/socio/pagos")}
                  className="mt-0.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                    COMPROBANTE #{comprobante.PagoID}
                  </p>
                  <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    Detalle del comprobante
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Información completa del pago y vigencia del plan
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      {fechaLarga}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Pagado
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={handleDownloadPDF}
                  className="h-11 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-semibold text-white shadow-sm hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* GRID */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Información del Comprobante */}
          <motion.div variants={item}>
            <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="h-1 w-full bg-gradient-to-r from-red-600 to-fuchsia-600 dark:from-red-500 dark:to-fuchsia-500" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                  <div className="rounded-xl bg-red-600/10 p-2 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  Información del comprobante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Número de comprobante</p>
                  <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                    {comprobante.NumeroComprobante}
                  </p>
                </div>

                <Separator className="dark:bg-slate-800" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fecha de emisión</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{fechaLarga}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Monto total</p>
                    <p className="mt-1 text-lg font-black tracking-tight text-red-700 dark:text-red-300 sm:text-xl">
                      {Number(comprobante.Monto).toLocaleString("es-CL", { style: "currency", currency: "CLP" })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Información del Socio */}
          <motion.div variants={item}>
            <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="h-1 w-full bg-gradient-to-r from-slate-700 to-red-600 dark:from-slate-300/40 dark:to-red-500" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                  <div className="rounded-xl bg-slate-900/10 p-2 text-slate-800 dark:bg-slate-100/10 dark:text-slate-200">
                    <User className="h-5 w-5" />
                  </div>
                  Información del socio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nombre completo</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                    {comprobante.Nombre} {comprobante.Apellido}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">RUT</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {comprobante.RUT}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">ID de pago</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                      #{comprobante.PagoID}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Método de pago */}
          <motion.div variants={item}>
            <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-500 dark:to-red-500" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                  <div className="rounded-xl bg-indigo-600/10 p-2 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  Método de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Método</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                    {comprobante.MetodoPago}
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-200">Estado</p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-extrabold text-indigo-700 dark:border-indigo-900/50 dark:bg-slate-950 dark:text-indigo-200">
                    <ShieldCheck className="h-4 w-4" />
                    Pagado
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detalle del plan */}
          {comprobante.NombrePlan && (
            <motion.div variants={item}>
              <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                <div className="h-1 w-full bg-gradient-to-r from-fuchsia-600 to-red-600 dark:from-fuchsia-500 dark:to-red-500" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                    <div className="rounded-xl bg-fuchsia-600/10 p-2 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
                      <Calendar className="h-5 w-5" />
                    </div>
                    Detalle del plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Plan</p>
                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100 sm:text-base">
                      {comprobante.NombrePlan}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Duración: <span className="font-semibold">{comprobante.DuracionDias} días</span>
                    </p>
                  </div>

                  {vigencia && (
                    <>
                      <Separator className="dark:bg-slate-800" />
                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vigencia</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{vigencia}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Concepto */}
        {comprobante.Concepto && (
          <motion.div variants={item}>
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="h-1 w-full bg-gradient-to-r from-red-600 to-slate-700 dark:from-red-500 dark:to-slate-300/40" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                  Concepto del pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                  {comprobante.Concepto}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}