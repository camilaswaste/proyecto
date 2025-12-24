"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Download, FileText } from "lucide-react"
import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ReporteData {
  TotalImplementos: number
  Operativos: number
  EnMantencion: number
  Dañados: number
  FueraDeServicio: number
  RevisionesPendientes: number
  CostoMantenimiento: number
  PeriodoInicio: string
  PeriodoFin: string
  Historico: Array<{
    fecha: string
    Operativos: number
    EnMantencion: number
    Dañados: number
  }>
}

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#64748b"]

export default function ReportesPage() {
  const [reporteActual, setReporteActual] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tipoReporte, setTipoReporte] = useState("Semanal")

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/implementos/reportes/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoReporte }),
      })

      if (!response.ok) throw new Error("Error al generar reporte")

      const data = await response.json()
      setReporteActual(data.reporte)

      toast({
        title: "Éxito",
        description: `Reporte ${tipoReporte.toLowerCase()} generado correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!reporteActual) return

    try {
      const response = await fetch("/api/admin/implementos/reportes/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoReporte, formato: "pdf" }),
      })

      if (!response.ok) throw new Error("Error al generar PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-implementos-${tipoReporte}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Reporte PDF descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el reporte",
        variant: "destructive",
      })
    }
  }

  const chartData = reporteActual
    ? [
        { name: "Operativos", value: reporteActual.Operativos },
        { name: "En Mantenimiento", value: reporteActual.EnMantencion },
        { name: "Dañados", value: reporteActual.Dañados },
        { name: "Fuera de Servicio", value: reporteActual.FueraDeServicio },
      ]
    : []

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reportes de Implementos</h1>
            <p className="text-muted-foreground">Análisis y seguimiento del estado de los implementos</p>
          </div>
          <Button onClick={() => window.history.back()} variant="outline">
            Volver
          </Button>
        </div>

        {/* Generate Report Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generar Reporte</CardTitle>
            <CardDescription>Genera un reporte en tiempo real del estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs space-y-2">
                <label className="text-sm font-medium">Tipo de Reporte</label>
                <Select value={tipoReporte} onValueChange={setTipoReporte}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Mensual">Mensual</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateReport} disabled={loading}>
                <FileText className="h-4 w-4 mr-2" />
                {loading ? "Generando..." : "Generar Reporte"}
              </Button>
              {reporteActual && (
                <Button onClick={downloadReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Stats */}
        {reporteActual && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{tipoReporte}</Badge>
              <span>
                Periodo: {new Date(reporteActual.PeriodoInicio).toLocaleDateString()} -{" "}
                {new Date(reporteActual.PeriodoFin).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Implementos</CardDescription>
                  <CardTitle className="text-3xl">{reporteActual.TotalImplementos}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Operativos</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{reporteActual.Operativos}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {((reporteActual.Operativos / reporteActual.TotalImplementos) * 100).toFixed(1)}%
                  </p>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Revisiones Pendientes</CardDescription>
                  <CardTitle className="text-3xl text-yellow-600">{reporteActual.RevisionesPendientes}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Costo Mantenimiento</CardDescription>
                  <CardTitle className="text-3xl">${reporteActual.CostoMantenimiento?.toLocaleString() || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Estado</CardTitle>
                  <CardDescription>Estado actual de los implementos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia Histórica</CardTitle>
                  <CardDescription>Evolución del estado en el periodo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reporteActual.Historico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Operativos" fill="#22c55e" />
                      <Bar dataKey="EnMantencion" fill="#eab308" />
                      <Bar dataKey="Dañados" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!reporteActual && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecciona un tipo de reporte y haz clic en "Generar Reporte"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}