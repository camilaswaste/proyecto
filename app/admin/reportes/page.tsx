"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
  Sparkles,
  BarChart3,
  Info,
} from "lucide-react"
import { useMemo, useState } from "react"

const reports = [
  {
    id: "ingresos",
    title: "Reporte de Ingresos",
    description: "Detalle de todos los ingresos por membresías, clases y servicios",
    icon: DollarSign,
    theme: "emerald",
  },
  {
    id: "asistencia",
    title: "Reporte de Asistencia",
    description: "Análisis de asistencia a clases grupales y uso del gimnasio",
    icon: Calendar,
    theme: "blue",
  },
  {
    id: "socios",
    title: "Reporte de Socios",
    description: "Estado de membresías, nuevos socios, bajas y renovaciones",
    icon: Users,
    theme: "purple",
  },
  {
    id: "financiero",
    title: "Reporte Financiero Completo",
    description: "Estado financiero detallado: ingresos, balance y proyecciones",
    icon: TrendingUp,
    theme: "rose",
  },
  {
    id: "uso",
    title: "Reporte de Uso del Gimnasio",
    description: "Horarios peak, uso de equipamiento y afluencia por días",
    icon: PieChart,
    theme: "indigo",
  },
] as const

type ReportId = (typeof reports)[number]["id"]
type Theme = (typeof reports)[number]["theme"]

const themeMap: Record<
  Theme,
  {
    ring: string
    softBg: string
    softBorder: string
    iconBg: string
    iconFg: string
    badgeSoft: string
    badgeStrong: string
    tableHead: string
    accentText: string
    accentBorderL: string
    button: string
    buttonOutline: string
  }
> = {
  emerald: {
    ring: "ring-emerald-500/20",
    softBg: "bg-emerald-50",
    softBorder: "border-emerald-200/60",
    iconBg: "bg-emerald-500/10",
    iconFg: "text-emerald-600",
    badgeSoft: "bg-emerald-500/10 text-emerald-700 border-emerald-200/60",
    badgeStrong: "bg-emerald-600 text-white border-emerald-600",
    tableHead: "bg-emerald-50/70",
    accentText: "text-emerald-700",
    accentBorderL: "border-l-emerald-500",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    buttonOutline: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  },
  blue: {
    ring: "ring-blue-500/20",
    softBg: "bg-blue-50",
    softBorder: "border-blue-200/60",
    iconBg: "bg-blue-500/10",
    iconFg: "text-blue-600",
    badgeSoft: "bg-blue-500/10 text-blue-700 border-blue-200/60",
    badgeStrong: "bg-blue-600 text-white border-blue-600",
    tableHead: "bg-blue-50/70",
    accentText: "text-blue-700",
    accentBorderL: "border-l-blue-500",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonOutline: "border-blue-200 text-blue-700 hover:bg-blue-50",
  },
  purple: {
    ring: "ring-purple-500/20",
    softBg: "bg-purple-50",
    softBorder: "border-purple-200/60",
    iconBg: "bg-purple-500/10",
    iconFg: "text-purple-600",
    badgeSoft: "bg-purple-500/10 text-purple-700 border-purple-200/60",
    badgeStrong: "bg-purple-600 text-white border-purple-600",
    tableHead: "bg-purple-50/70",
    accentText: "text-purple-700",
    accentBorderL: "border-l-purple-500",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    buttonOutline: "border-purple-200 text-purple-700 hover:bg-purple-50",
  },
  rose: {
    ring: "ring-rose-500/20",
    softBg: "bg-rose-50",
    softBorder: "border-rose-200/60",
    iconBg: "bg-rose-500/10",
    iconFg: "text-rose-600",
    badgeSoft: "bg-rose-500/10 text-rose-700 border-rose-200/60",
    badgeStrong: "bg-rose-600 text-white border-rose-600",
    tableHead: "bg-rose-50/70",
    accentText: "text-rose-700",
    accentBorderL: "border-l-rose-500",
    button: "bg-rose-600 hover:bg-rose-700 text-white",
    buttonOutline: "border-rose-200 text-rose-700 hover:bg-rose-50",
  },
  indigo: {
    ring: "ring-indigo-500/20",
    softBg: "bg-indigo-50",
    softBorder: "border-indigo-200/60",
    iconBg: "bg-indigo-500/10",
    iconFg: "text-indigo-600",
    badgeSoft: "bg-indigo-500/10 text-indigo-700 border-indigo-200/60",
    badgeStrong: "bg-indigo-600 text-white border-indigo-600",
    tableHead: "bg-indigo-50/70",
    accentText: "text-indigo-700",
    accentBorderL: "border-l-indigo-500",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
    buttonOutline: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
  },
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ")
}

function money(n: number) {
  return `$${Number(n || 0).toLocaleString("es-CL")}`
}

export default function AdminReportesPage() {
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const selectedTheme: Theme = useMemo(() => {
    const rep = reports.find((r) => r.id === selectedReport)
    return rep?.theme ?? "blue"
  }, [selectedReport])

  const T = themeMap[selectedTheme]

  const handleGenerateReport = async (reportId: ReportId) => {
    if (!dateFrom || !dateTo) {
      alert("Por favor selecciona un rango de fechas")
      return
    }

    setLoading(true)
    setSelectedReport(reportId)

    try {
      const fechaDesde = format(dateFrom, "yyyy-MM-dd")
      const fechaHasta = format(dateTo, "yyyy-MM-dd")

      const response = await fetch(`/api/admin/reportes?tipo=${reportId}&desde=${fechaDesde}&hasta=${fechaHasta}`)
      const data = await response.json()

      setReportData(data)
    } catch (error) {
      console.error("[v0] Error al generar reporte:", error)
      alert("Error al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (reportTitle: string) => {
    if (!dateFrom || !dateTo) {
      alert("Por favor selecciona un rango de fechas")
      return
    }

    try {
      const response = await fetch(
        `/api/admin/reportes/pdf?tipo=${selectedReport}&desde=${format(dateFrom, "yyyy-MM-dd")}&hasta=${format(
          dateTo,
          "yyyy-MM-dd",
        )}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          const errorDetails = errorJson.details || errorJson.error || "Error desconocido"
          throw new Error(`Error del servidor: ${errorDetails}`)
        } catch {
          throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`)
        }
      }

      const blob = await response.blob()
      if (blob.size === 0) throw new Error("El PDF generado está vacío")

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportTitle.replace(/\s+/g, "_")}_${format(dateFrom, "yyyyMMdd")}_${format(dateTo, "yyyyMMdd")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Error completo al descargar PDF:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error al generar el PDF:\n\n${errorMessage}\n\nRevisa la consola del navegador para más detalles.`)
    }
  }

  const kpis = useMemo(() => {
    if (!reportData || !selectedReport) return null
    const d = reportData.datos

    switch (selectedReport) {
      case "ingresos": {
        const total = Array.isArray(d.detalle) ? d.detalle.reduce((s: number, x: any) => s + (x.MontoPago || 0), 0) : 0
        const pagos = Array.isArray(d.detalle) ? d.detalle.length : 0
        const medios = Array.isArray(d.resumen) ? d.resumen.length : 0
        return [
          { label: "Total ingresos", value: money(total), icon: DollarSign },
          { label: "Pagos registrados", value: String(pagos), icon: FileText },
          { label: "Métodos usados", value: String(medios), icon: BarChart3 },
        ]
      }
      case "asistencia": {
        const rows = Array.isArray(d.asistenciaClases) ? d.asistenciaClases : []
        const totalReservas = rows.reduce((s: number, x: any) => s + (x.totalReservas || 0), 0)
        const totalAsist = rows.reduce((s: number, x: any) => s + (x.asistieron || 0), 0)
        const pct = totalReservas > 0 ? Math.round((totalAsist / totalReservas) * 100) : 0
        return [
          { label: "Reservas", value: String(totalReservas), icon: FileText },
          { label: "Asistencias", value: String(totalAsist), icon: Calendar },
          { label: "% asistencia", value: `${pct}%`, icon: TrendingUp },
        ]
      }
      case "socios": {
        const rows = Array.isArray(d.resumenSocios) ? d.resumenSocios : []
        const total = rows.reduce((s: number, x: any) => s + (x.cantidad || 0), 0)
        const activos = rows.find((x: any) => String(x.EstadoSocio).toLowerCase() === "activo")?.cantidad ?? 0
        const morosos = rows.find((x: any) => String(x.EstadoSocio).toLowerCase() === "moroso")?.cantidad ?? 0
        return [
          { label: "Total socios", value: String(total), icon: Users },
          { label: "Activos", value: String(activos), icon: TrendingUp },
          { label: "Morosos", value: String(morosos), icon: Sparkles },
        ]
      }
      case "financiero": {
        const rows = Array.isArray(d.balanceGeneral) ? d.balanceGeneral : []
        const ingresos = rows.find((x: any) => String(x.categoria).toLowerCase().includes("ingres"))?.monto ?? 0
        const egresos = rows.find((x: any) => String(x.categoria).toLowerCase().includes("egres"))?.monto ?? 0
        const neto = typeof ingresos === "number" && typeof egresos === "number" ? ingresos - egresos : 0
        return [
          { label: "Ingresos", value: money(ingresos), icon: DollarSign },
          { label: "Egresos", value: typeof egresos === "number" ? money(egresos) : String(egresos), icon: FileText },
          { label: "Neto", value: money(neto), icon: TrendingUp },
        ]
      }
      case "uso": {
        const peak = Array.isArray(d.usoGimnasio) ? d.usoGimnasio.length : 0
        const dias = Array.isArray(d.asistenciasDiarias) ? d.asistenciasDiarias.length : 0
        const totalEntradas = Array.isArray(d.asistenciasDiarias)
          ? d.asistenciasDiarias.reduce((s: number, x: any) => s + (x.totalEntradas || 0), 0)
          : 0
        return [
          { label: "Registros peak", value: String(peak), icon: PieChart },
          { label: "Días analizados", value: String(dias), icon: Calendar },
          { label: "Entradas", value: String(totalEntradas), icon: Users },
        ]
      }
      default:
        return null
    }
  }, [reportData, selectedReport])

  const renderReportPreview = () => {
    if (!reportData || !selectedReport) return null
    const datos = reportData.datos

    const PreviewShell = ({
      title,
      subtitle,
      children,
    }: {
      title: string
      subtitle?: string
      children: React.ReactNode
    }) => (
      <Card
        className={cn(
          "mt-6 overflow-hidden border shadow-sm",
          "bg-gradient-to-b from-background to-muted/20",
          T.softBorder,
        )}
      >
        <CardHeader className={cn("relative border-b", T.softBorder, "bg-gradient-to-r", T.softBg)}>
          <div className={cn("absolute left-0 top-0 h-full w-1.5", T.accentBorderL)} />
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              {subtitle ? <CardDescription className="mt-1">{subtitle}</CardDescription> : null}
            </div>
            <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
              Vista previa
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    )

    const NiceTable = ({
      head,
      children,
    }: {
      head: React.ReactNode
      children: React.ReactNode
    }) => (
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader className={cn(T.tableHead)}>
            <TableRow className="hover:bg-transparent">
              {head}
            </TableRow>
          </TableHeader>
          <TableBody
            className={cn(
              "[&_tr:nth-child(even)]:bg-muted/30",
              "[&_tr:hover]:bg-muted/50",
              "[&_td]:align-middle",
            )}
          >
            {children}
          </TableBody>
        </Table>
      </div>
    )

    switch (selectedReport) {
      case "ingresos":
        return (
          <PreviewShell
            title="Reporte de Ingresos"
            subtitle={`Período: ${reportData.fechaDesde} al ${reportData.fechaHasta}`}
          >
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Resumen por método de pago</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    {Array.isArray(datos.resumen) ? datos.resumen.length : 0} métodos
                  </Badge>
                </div>

                <NiceTable
                  head={
                    <>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </>
                  }
                >
                  {datos.resumen?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                          {item.MedioPago}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className={cn("text-right font-semibold", T.accentText)}>
                        {money(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Últimos pagos</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    Top 10
                  </Badge>
                </div>

                <NiceTable
                  head={
                    <>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </>
                  }
                >
                  {datos.detalle?.slice(0, 10).map((item: any) => (
                    <TableRow key={item.PagoID}>
                      <TableCell>{format(new Date(item.FechaPago), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">{item.nombreSocio}</TableCell>
                      <TableCell className="text-muted-foreground">{item.Concepto}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {item.NombrePlan || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-semibold", T.accentText)}>
                        {money(item.MontoPago)}
                      </TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>
            </div>
          </PreviewShell>
        )

      case "asistencia":
        return (
          <PreviewShell
            title="Reporte de Asistencia"
            subtitle={`Período: ${reportData.fechaDesde} al ${reportData.fechaHasta}`}
          >
            <div className="p-6">
              <NiceTable
                head={
                  <>
                    <TableHead>Clase</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Entrenador</TableHead>
                    <TableHead className="text-right">Reservas</TableHead>
                    <TableHead className="text-right">Asistieron</TableHead>
                    <TableHead className="text-right">% Asistencia</TableHead>
                  </>
                }
              >
                {datos.asistenciaClases?.map((item: any, idx: number) => {
                  const ok = item.porcentajeAsistencia >= 80
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                          {item.NombreClase}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.DiaSemana}</TableCell>
                      <TableCell className="text-muted-foreground">{item.entrenador}</TableCell>
                      <TableCell className="text-right">{item.totalReservas}</TableCell>
                      <TableCell className="text-right font-medium">{item.asistieron}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={cn(
                            "rounded-full border",
                            ok ? T.badgeStrong : "bg-muted text-foreground border-border",
                          )}
                        >
                          {item.porcentajeAsistencia}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </NiceTable>
            </div>
          </PreviewShell>
        )

      case "socios":
        return (
          <PreviewShell title="Reporte de Socios" subtitle="Estado actual de todos los socios">
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Resumen por estado</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    {Array.isArray(datos.resumenSocios) ? datos.resumenSocios.length : 0} estados
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  {datos.resumenSocios?.map((item: any, idx: number) => (
                    <Card
                      key={idx}
                      className={cn(
                        "border shadow-sm",
                        "bg-gradient-to-b from-background to-muted/30",
                        "hover:shadow-md transition",
                      )}
                    >
                      <CardContent className="pt-6">
                        <div className="text-3xl font-bold">{item.cantidad}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", "bg-foreground/30")} />
                          <p className="text-sm text-muted-foreground">{item.EstadoSocio}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Lista de socios</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    Top 10
                  </Badge>
                </div>

                <NiceTable
                  head={
                    <>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Vencimiento</TableHead>
                    </>
                  }
                >
                  {datos.sociosDetalle?.slice(0, 10).map((item: any) => {
                    const estado = String(item.EstadoSocio || "")
                    const badge =
                      estado === "Activo"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : estado === "Moroso"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-muted text-foreground border-border"

                    return (
                      <TableRow key={item.SocioID}>
                        <TableCell className="font-medium">{item.nombreCompleto}</TableCell>
                        <TableCell className="text-muted-foreground">{item.Email}</TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-full border", badge)}>{estado}</Badge>
                        </TableCell>
                        <TableCell>{item.NombrePlan || "Sin plan"}</TableCell>
                        <TableCell>
                          {item.FechaVencimiento ? format(new Date(item.FechaVencimiento), "dd/MM/yyyy") : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </NiceTable>
              </div>
            </div>
          </PreviewShell>
        )

      case "financiero":
        return (
          <PreviewShell title="Reporte Financiero" subtitle="Balance general del gimnasio">
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <h3 className="font-semibold">Balance general</h3>
                <NiceTable
                  head={
                    <>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </>
                  }
                >
                  {datos.balanceGeneral?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.categoria}</TableCell>
                      <TableCell className={cn("text-right text-lg font-extrabold", T.accentText)}>
                        {String(item.categoria).toLowerCase().includes("ingres") ? money(item.monto) : String(item.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Ingresos por categoría</h3>
                <NiceTable
                  head={
                    <>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </>
                  }
                >
                  {datos.ingresosPorCategoria?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                          {item.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-semibold", T.accentText)}>
                        {money(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>
            </div>
          </PreviewShell>
        )

      case "uso":
        return (
          <PreviewShell
            title="Reporte de Uso del Gimnasio"
            subtitle={`Período: ${reportData.fechaDesde} al ${reportData.fechaHasta}`}
          >
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Horarios peak</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    Top 10
                  </Badge>
                </div>

                <NiceTable
                  head={
                    <>
                      <TableHead>Día</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                    </>
                  }
                >
                  {datos.usoGimnasio?.slice(0, 10).map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.diaSemana}</TableCell>
                      <TableCell className="text-muted-foreground">{item.hora}:00</TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn("rounded-full border", T.badgeSoft)}>{item.totalEntradas}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Asistencias diarias</h3>
                  <Badge variant="outline" className={cn("rounded-full", T.badgeSoft)}>
                    Últimos 10 días
                  </Badge>
                </div>

                <NiceTable
                  head={
                    <>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total entradas</TableHead>
                      <TableHead className="text-right">Socios únicos</TableHead>
                    </>
                  }
                >
                  {datos.asistenciasDiarias?.slice(0, 10).map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{format(new Date(item.fecha), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn("rounded-full border", T.badgeSoft)}>{item.totalEntradas}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.sociosUnicos}</TableCell>
                    </TableRow>
                  ))}
                </NiceTable>
              </div>
            </div>
          </PreviewShell>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reportes Personalizados</h1>
            <p className="text-muted-foreground">
              Genera y visualiza reportes con datos reales del gimnasio
            </p>
          </div>

          {/* Accent chip */}
          <div className={cn("rounded-full border px-3 py-1.5 text-sm flex items-center gap-2", T.softBorder, T.softBg)}>
            <Sparkles className={cn("h-4 w-4", T.iconFg)} />
            <span className={cn("font-medium", T.accentText)}>
              Reportes listos para exportar
            </span>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className={cn("border shadow-sm", "bg-gradient-to-b from-background to-muted/20")}>
          <CardHeader className="border-b">
            <CardTitle>Seleccionar período</CardTitle>
            <CardDescription>Elige el rango de fechas para generar los reportes</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[220px]">
                <Label>Fecha desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        "bg-background hover:bg-muted/40",
                        "rounded-xl",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-[220px]">
                <Label>Fecha hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        "bg-background hover:bg-muted/40",
                        "rounded-xl",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                    setReportData(null)
                    setSelectedReport(null)
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* subtle helper */}
            <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5" />
              <p>
                Tip: Selecciona primero <span className="font-medium text-foreground">Fecha desde</span> y luego{" "}
                <span className="font-medium text-foreground">Fecha hasta</span> para evitar rangos inválidos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI row when preview exists */}
        {kpis ? (
          <div className="grid gap-4 md:grid-cols-3">
            {kpis.map((k, idx) => {
              const Icon = k.icon
              return (
                <Card
                  key={idx}
                  className={cn(
                    "border shadow-sm overflow-hidden",
                    "bg-gradient-to-b from-background to-muted/25",
                    T.softBorder,
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{k.label}</p>
                        <p className={cn("mt-1 text-2xl font-extrabold", T.accentText)}>{k.value}</p>
                      </div>
                      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center border", T.softBorder, T.iconBg)}>
                        <Icon className={cn("h-5 w-5", T.iconFg)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id
            const isLoading = loading && isSelected
            const theme = themeMap[report.theme]

            return (
              <Card
                key={report.id}
                className={cn(
                  "group overflow-hidden border shadow-sm",
                  "bg-gradient-to-b from-background to-muted/20",
                  "hover:shadow-md hover:-translate-y-[1px] transition-all",
                  isSelected && cn("ring-2", theme.ring),
                )}
              >
                <CardHeader className="relative">
                  {/* left accent bar */}
                  <div className={cn("absolute left-0 top-0 h-full w-1", theme.accentBorderL)} />
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("p-3 rounded-2xl border", theme.softBorder, theme.iconBg)}>
                      <Icon className={cn("h-6 w-6", theme.iconFg)} />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isLoading}
                        className={cn(
                          "gap-2 rounded-xl",
                          theme.button,
                          "shadow-sm",
                        )}
                      >
                        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Ver
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(report.title)}
                        className={cn("gap-2 rounded-xl", theme.buttonOutline)}
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="mt-4 text-xl">{report.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{report.description}</CardDescription>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-full", theme.badgeSoft)}>
                      {report.id.toUpperCase()}
                    </Badge>
                    {isSelected ? (
                      <Badge className={cn("rounded-full border", theme.badgeStrong)}>Seleccionado</Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <div className={cn("h-1 w-full opacity-0 group-hover:opacity-100 transition", theme.softBg)} />
              </Card>
            )
          })}
        </div>

        {renderReportPreview()}

        {/* Info Card */}
        
      </div>
    </DashboardLayout>
  )
}