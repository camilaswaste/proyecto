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
import { BarChart3, Calendar, DollarSign, Download, FileText, PieChart, TrendingUp, Users } from "lucide-react"
import { useState } from "react"

const sampleIncomesData = [
  { id: 1, fecha: "2024-12-01", socio: "Juan Pérez", tipo: "Mensual", monto: 45000, metodo: "Tarjeta" },
  { id: 2, fecha: "2024-12-05", socio: "María González", tipo: "Trimestral", monto: 120000, metodo: "Transferencia" },
  { id: 3, fecha: "2024-12-10", socio: "Carlos López", tipo: "Mensual", monto: 45000, metodo: "Efectivo" },
  { id: 4, fecha: "2024-12-15", socio: "Ana Silva", tipo: "Sesión Personal", monto: 25000, metodo: "Tarjeta" },
]

const sampleAttendanceData = [
  { fecha: "2024-12-16", clase: "Spinning", inscritos: 20, asistieron: 18, porcentaje: 90 },
  { fecha: "2024-12-16", clase: "Yoga", inscritos: 15, asistieron: 15, porcentaje: 100 },
  { fecha: "2024-12-17", clase: "CrossFit", inscritos: 12, asistieron: 10, porcentaje: 83 },
  { fecha: "2024-12-17", clase: "Zumba", inscritos: 18, asistieron: 16, porcentaje: 89 },
]

export default function AdminReportesPage() {
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const handleDownloadPDF = (reportType: string) => {
    alert(
      `Descargando reporte: ${reportType}\nDesde: ${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "No seleccionada"}\nHasta: ${dateTo ? format(dateTo, "dd/MM/yyyy") : "No seleccionada"}\n\n(Funcionalidad en desarrollo)`,
    )
  }

  const reports = [
    {
      id: "ingresos",
      title: "Reporte de Ingresos",
      description: "Detalle de todos los ingresos por membresías, clases y sesiones personales",
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
      id: "clases",
      title: "Reporte de Clases",
      description: "Estadísticas de clases grupales, ocupación y popularidad",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "financiero",
      title: "Reporte Financiero Completo",
      description: "Estado financiero detallado: ingresos, egresos, balance y proyecciones",
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

  const renderReportPreview = () => {
    if (!selectedReport) return null

    switch (selectedReport) {
      case "ingresos":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Vista Previa - Últimos Ingresos</CardTitle>
              <CardDescription>Datos de ejemplo del reporte de ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Socio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleIncomesData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.fecha}</TableCell>
                      <TableCell>{item.socio}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.tipo}</Badge>
                      </TableCell>
                      <TableCell>{item.metodo}</TableCell>
                      <TableCell className="text-right font-medium">${item.monto.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">Total del Período: $235.000</p>
                <p className="text-sm text-muted-foreground">4 transacciones registradas</p>
              </div>
            </CardContent>
          </Card>
        )

      case "asistencia":
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Vista Previa - Asistencia a Clases</CardTitle>
              <CardDescription>Datos de ejemplo del reporte de asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead className="text-right">Inscritos</TableHead>
                    <TableHead className="text-right">Asistieron</TableHead>
                    <TableHead className="text-right">Porcentaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleAttendanceData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.fecha}</TableCell>
                      <TableCell>
                        <Badge>{item.clase}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.inscritos}</TableCell>
                      <TableCell className="text-right">{item.asistieron}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.porcentaje >= 90 ? "default" : "secondary"}>{item.porcentaje}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">Promedio de Asistencia: 90.5%</p>
                <p className="text-sm text-muted-foreground">Excelente nivel de compromiso</p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Vista previa no disponible para este reporte. Haz clic en "PDF" para generar el documento completo.
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes Personalizados</h1>
          <p className="text-muted-foreground">Genera y descarga reportes en PDF con datos específicos del gimnasio</p>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Período</CardTitle>
            <CardDescription>Elige el rango de fechas para todos los reportes</CardDescription>
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
            return (
              <Card
                key={report.id}
                className={`hover:shadow-lg transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedReport(isSelected ? null : report.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadPDF(report.title)
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                  {isSelected && <Badge className="mt-2">Click para ocultar preview</Badge>}
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
                <p className="font-medium text-blue-900">Acerca de los Reportes</p>
                <p className="text-sm text-blue-800">
                  Los reportes se generarán con datos del período seleccionado. Si no seleccionas fechas, se generará el
                  reporte del mes actual. Los archivos PDF incluirán gráficos, tablas y análisis detallados para una
                  fácil presentación.
                </p>
                <p className="text-sm text-blue-800 font-medium mt-2">
                  Nota: Esta es una vista previa. La funcionalidad completa se implementará próximamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
