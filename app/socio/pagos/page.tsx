"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Download, Eye, FileText, CreditCard, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

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

const container = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, duration: 0.35, ease: "easeOut" },
  },
}

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
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
        window.open(comprobantePath, "_blank")
      } else {
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

  const totalPagos = useMemo(() => pagos.reduce((acc, p) => acc + Number(p.Monto || 0), 0), [pagos])

  return (
    <DashboardLayout role="Socio">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-5 sm:space-y-6"
      >
        {/* HERO / HEADER */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950">
          {/* Fondo con degradados */}
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-red-600/15 blur-3xl dark:bg-red-500/20" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-fuchsia-600/10 blur-3xl dark:bg-fuchsia-500/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900" />
          </div>

          <div className="relative p-4 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-zinc-700 bg-white/70 backdrop-blur dark:text-zinc-200 dark:bg-zinc-950/60 dark:border-zinc-800">
                  <Sparkles className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  Pagos & comprobantes
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  Mis Comprobantes
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
                  Consulta, revisa y descarga tus comprobantes de pago cuando quieras.
                </p>
              </div>

              {/* Mini KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border bg-white/70 p-3 backdrop-blur dark:bg-zinc-950/60 dark:border-zinc-800">
                  <p className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300">Total pagos</p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-white">
                    {totalPagos.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}
                  </p>
                </div>
                <div className="rounded-xl border bg-white/70 p-3 backdrop-blur dark:bg-zinc-950/60 dark:border-zinc-800">
                  <p className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300">Comprobantes</p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-white">{pagos.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-2 rounded-lg border bg-white/70 px-3 py-2 backdrop-blur dark:bg-zinc-950/60 dark:border-zinc-800">
                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                Historial en orden cronológico
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border bg-white/70 px-3 py-2 backdrop-blur dark:bg-zinc-950/60 dark:border-zinc-800">
                <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                Descarga inmediata (PDF)
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD PRINCIPAL */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-fuchsia-600/10 dark:from-red-500/10 dark:to-fuchsia-500/10" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-zinc-950 dark:text-white">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    Historial de Comprobantes
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Todos tus pagos registrados en el sistema.
                  </CardDescription>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 dark:border-zinc-800">
                    {pagos.length} registros
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="rounded-xl border bg-zinc-50 p-10 text-center text-sm text-zinc-600 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-300">
                  Cargando comprobantes...
                </div>
              ) : pagos.length === 0 ? (
                <div className="rounded-xl border bg-zinc-50 p-10 text-center text-sm text-zinc-600 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-300">
                  No tienes comprobantes registrados.
                </div>
              ) : (
                <>
                  {/* MOBILE: cards */}
                  <div className="grid gap-3 md:hidden">
                    {pagos.map((pago) => (
                      <motion.div
                        key={pago.PagoID}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950 dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">
                              #{pago.NumeroComprobante}
                            </p>
                            <p className="mt-1 text-sm font-bold text-zinc-950 dark:text-white truncate">
                              {pago.Concepto || pago.NombrePlan || "Sin concepto"}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                              {new Date(pago.FechaPago).toLocaleDateString("es-CL", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>

                          <span className="shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
                            {pago.MetodoPago}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-base font-extrabold text-zinc-950 dark:text-white">
                            {Number(pago.Monto).toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </p>

                          <div className="flex items-center gap-2">
                            <Link href={`/socio/pagos/${pago.PagoID}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Ver
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              className="h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDownloadPDF(pago.PagoID, pago.ComprobantePath)}
                            >
                              <Download className="h-4 w-4 mr-1.5" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* DESKTOP: tabla */}
                  <div className="hidden md:block">
                    <div className="overflow-hidden rounded-2xl border dark:border-zinc-800">
                      <div className="max-h-[520px] overflow-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-zinc-50/80 backdrop-blur dark:bg-zinc-900/60">
                              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                N° Comprobante
                              </th>
                              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                Fecha
                              </th>
                              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                Concepto
                              </th>
                              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                Monto
                              </th>
                              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                Método
                              </th>
                              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                                Acciones
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {pagos.map((pago) => (
                              <motion.tr
                                key={pago.PagoID}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="border-t hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 dark:border-zinc-800 transition-colors"
                              >
                                <td className="px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-200">
                                  {pago.NumeroComprobante}
                                </td>

                                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                                  {new Date(pago.FechaPago).toLocaleDateString("es-CL", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </td>

                                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 max-w-[360px]">
                                  <span className="block truncate">
                                    {pago.Concepto || pago.NombrePlan || "Sin concepto"}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm font-extrabold text-zinc-950 dark:text-white">
                                  {Number(pago.Monto).toLocaleString("es-CL", {
                                    style: "currency",
                                    currency: "CLP",
                                  })}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
                                    {pago.MetodoPago}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link href={`/socio/pagos/${pago.PagoID}`}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
                                      onClick={() => handleDownloadPDF(pago.PagoID, pago.ComprobantePath)}
                                    >
                                      <Download className="h-4 w-4 text-red-600 dark:text-red-300" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                      Tip: En computador puedes desplazarte dentro del historial si tienes muchos comprobantes.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}