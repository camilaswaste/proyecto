"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Calendar, Clock, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardData {
  sociosAsignados: number
  sesionesHoy: number
  clasesSemanales: number
  asistenciaPromedio: number
  agendaHoy: Array<{
    Tipo: string
    ID: number
    HoraInicio: string
    HoraFin: string
    NombreSocio: string
    Estado: string
  }>
}

export default function EntrenadorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const user = getUser()
      console.log("Usuario obtenido:", user)

      if (!user?.usuarioID) {
        console.log("No hay usuarioID disponible")
        return
      }

      console.log("Haciendo fetch al API con usuarioID:", user.usuarioID)
      const response = await fetch(`/api/entrenador/dashboard?usuarioID=${user.usuarioID}`)
      console.log("Response status:", response.status)

      if (response.ok) {
        const dashboardData = await response.json()
        console.log("Dashboard data recibida:", dashboardData)
        setData(dashboardData)
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Error al cargar datos</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Entrenador</h1>
          <p className="text-muted-foreground">Resumen de tu actividad</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Socios Asignados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.sociosAsignados}</div>
              <p className="text-xs text-muted-foreground">Con sesiones agendadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sesiones Hoy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.sesionesHoy}</div>
              <p className="text-xs text-muted-foreground">
                {data.agendaHoy.length > 0 && data.agendaHoy[0].Tipo === "sesion"
                  ? `Próxima a las ${data.agendaHoy[0].HoraInicio}`
                  : "Sin sesiones pendientes"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Semanales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.clasesSemanales}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.asistenciaPromedio}%</div>
              <p className="text-xs text-muted-foreground">Promedio mensual</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agenda de Hoy</CardTitle>
            <CardDescription>Tus sesiones y clases programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.agendaHoy.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tienes actividades programadas para hoy</p>
            ) : (
              <div className="space-y-4">
                {data.agendaHoy.map((item, index) => (
                  <div
                    key={`${item.Tipo}-${item.ID}-${index}`}
                    className={`flex items-center gap-4 p-3 border rounded-lg ${
                      item.Tipo === "clase" ? "bg-blue-50 border-blue-200" : ""
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center justify-center rounded-lg p-3 min-w-[60px] ${
                        item.Tipo === "clase" ? "bg-blue-100" : "bg-primary/10"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${item.Tipo === "clase" ? "text-blue-700" : "text-primary"}`}
                      >
                        {item.HoraInicio}
                      </span>
                      <span className={`text-xs ${item.Tipo === "clase" ? "text-blue-600" : "text-muted-foreground"}`}>
                        {item.HoraFin}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${item.Tipo === "clase" ? "text-blue-900" : ""}`}>
                        {item.Tipo === "clase"
                          ? `Clase Grupal - ${item.NombreSocio}`
                          : `Sesión Personal - ${item.NombreSocio}`}
                      </p>
                      <p className={`text-sm ${item.Tipo === "clase" ? "text-blue-700" : "text-muted-foreground"}`}>
                        {item.Tipo === "clase" ? `${item.Estado} inscritos` : item.Estado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
