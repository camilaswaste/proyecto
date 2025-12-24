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
import { Calendar, DollarSign, Download, FileText, PieChart, RefreshCw, TrendingUp, Users } from "lucide-react"
import { useState } from "react"

const reports = [
  {
    id: "ingresos",
    title: "Reporte de Ingresos",
    description: "Detalle de todos los ingresos por membresías, clases y servicios",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "asistencia",
    title: "Reporte de Asistencia",
    description: "Análisis de asistencia a clases grupales y uso del gimnasio",
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "socios",
    title: "Reporte de Socios",
    description: "Estado de membresías, nuevos socios, bajas y renovaciones",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "financiero",
    title: "Reporte Financiero Completo",
    description: "Estado financiero detallado: ingresos, balance y proyecciones",
    icon: TrendingUp,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "uso",
    title: "Reporte de Uso del Gimnasio",
    description: "Horarios peak, uso de equipamiento y afluencia por días",
    icon: PieChart,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
]

export default function AdminReportesPage() {
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const handleGenerateReport = async (reportId: string) => {
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

  const handleDownloadPDF = async (reportType: string) => {
    if (!dateFrom || !dateTo) {
      alert("Por favor selecciona un rango de fechas")
      return
    }

    try {
      console.log("[v0] Descargando PDF:", { selectedReport, dateFrom, dateTo })

      const response = await fetch(
        `/api/admin/reportes/pdf?tipo=${selectedReport}&desde=${format(dateFrom, "yyyy-MM-dd")}&hasta=${format(dateTo, "yyyy-MM-dd")}`,
      )

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response text:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          console.error("[v0] Error JSON:", errorJson)
          const errorDetails = errorJson.details || errorJson.error || "Error desconocido"
          throw new Error(`Error del servidor: ${errorDetails}`)
        } catch (parseError) {
          // Si no es JSON, muestra el texto raw
          console.error("[v0] No se pudo parsear error como JSON:", parseError)
          throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`)
        }
      }

      const blob = await response.blob()
      console.log("[v0] PDF blob size:", blob.size, "bytes")

      if (blob.size === 0) {
        throw new Error("El PDF generado está vacío")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType.replace(/\s+/g, "_")}_${format(dateFrom, "yyyyMMdd")}_${format(dateTo, "yyyyMMdd")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log("[v0] PDF descargado exitosamente")
    } catch (error) {
      console.error("[v0] Error completo al descargar PDF:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error al generar el PDF:\n\n${errorMessage}\n\nRevisa la consola del navegador para más detalles.`)
    }
  }

  const renderReportPreview = () => {
    if (!reportData || !selectedReport) return null

    const datos = reportData.datos

    switch (selectedReport) {
      case "ingresos":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Reporte de Ingresos - Vista Previa</CardTitle>
              <CardDescription>
                Período: {reportData.fechaDesde} al {reportData.fechaHasta}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Resumen por Método de Pago</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.resumen?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{item.MedioPago}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.cantidad}</TableCell>
                          <TableCell className="text-right font-medium">${item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Últimos Pagos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.detalle?.slice(0, 10).map((item: any) => (
                        <TableRow key={item.PagoID}>
                          <TableCell>{format(new Date(item.FechaPago), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{item.nombreSocio}</TableCell>
                          <TableCell>{item.Concepto}</TableCell>
                          <TableCell>
                            <Badge>{item.NombrePlan || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">${item.MontoPago.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "asistencia":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Reporte de Asistencia - Vista Previa</CardTitle>
              <CardDescription>
                Período: {reportData.fechaDesde} al {reportData.fechaHasta}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clase</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Entrenador</TableHead>
                    <TableHead className="text-right">Reservas</TableHead>
                    <TableHead className="text-right">Asistieron</TableHead>
                    <TableHead className="text-right">% Asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.asistenciaClases?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge>{item.NombreClase}</Badge>
                      </TableCell>
                      <TableCell>{item.DiaSemana}</TableCell>
                      <TableCell>{item.entrenador}</TableCell>
                      <TableCell className="text-right">{item.totalReservas}</TableCell>
                      <TableCell className="text-right">{item.asistieron}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.porcentajeAsistencia >= 80 ? "default" : "secondary"}>
                          {item.porcentajeAsistencia}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )

      case "socios":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Reporte de Socios - Vista Previa</CardTitle>
              <CardDescription>Estado actual de todos los socios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Resumen por Estado</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {datos.resumenSocios?.map((item: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{item.cantidad}</div>
                          <p className="text-sm text-muted-foreground">{item.EstadoSocio}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Lista de Socios (primeros 10)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.sociosDetalle?.slice(0, 10).map((item: any) => (
                        <TableRow key={item.SocioID}>
                          <TableCell>{item.nombreCompleto}</TableCell>
                          <TableCell>{item.Email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.EstadoSocio === "Activo"
                                  ? "default"
                                  : item.EstadoSocio === "Moroso"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {item.EstadoSocio}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.NombrePlan || "Sin plan"}</TableCell>
                          <TableCell>
                            {item.FechaVencimiento ? format(new Date(item.FechaVencimiento), "dd/MM/yyyy") : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "financiero":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Reporte Financiero - Vista Previa</CardTitle>
              <CardDescription>Balance general del gimnasio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Balance General</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.balanceGeneral?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.categoria}</TableCell>
                          <TableCell className="text-right text-lg font-bold">
                            {item.categoria.includes("Ingresos") ? `$${item.monto.toLocaleString()}` : item.monto}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ingresos por Categoría</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.ingresosPorCategoria?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge>{item.categoria}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">${item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "uso":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Reporte de Uso del Gimnasio - Vista Previa</CardTitle>
              <CardDescription>
                Período: {reportData.fechaDesde} al {reportData.fechaHasta}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Horarios Peak (Top 10)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Día</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.usoGimnasio?.slice(0, 10).map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.diaSemana}</TableCell>
                          <TableCell>{item.hora}:00</TableCell>
                          <TableCell className="text-right">
                            <Badge>{item.totalEntradas}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Asistencias Diarias (últimos 10 días)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total Entradas</TableHead>
                        <TableHead className="text-right">Socios Únicos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.asistenciasDiarias?.slice(0, 10).map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{format(new Date(item.fecha), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{item.totalEntradas}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.sociosUnicos}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes Personalizados</h1>
          <p className="text-muted-foreground">Genera y visualiza reportes con datos reales del gimnasio</p>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Período</CardTitle>
            <CardDescription>Elige el rango de fechas para generar los reportes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Fecha Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-2 bg-transparent"
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

              <div className="flex-1 min-w-[200px]">
                <Label>Fecha Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-2 bg-transparent"
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
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id
            const isLoading = loading && isSelected
            return (
              <Card
                key={report.id}
                className={`hover:shadow-lg transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(report.title)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {renderReportPreview()}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">Reportes con Datos Reales</p>
                <p className="text-sm text-blue-800">
                  Todos los reportes se generan con datos reales de tu base de datos SQL Server. Selecciona un rango de
                  fechas y haz clic en "Ver" para visualizar el reporte. El botón "PDF" te permitirá descargar el
                  reporte en formato PDF.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}