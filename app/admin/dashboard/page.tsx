"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, TrendingUp, Calendar } from "lucide-react"

interface KPIs {
  sociosActivos: number
  ingresosMensuales: number
  clasesActivas: number
  entrenadoresActivos: number
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch("/api/admin/kpis")
        if (response.ok) {
          const data = await response.json()
          setKpis(data)
        }
      } catch (error) {
        console.error("Error al cargar KPIs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchKPIs()
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="gradient-admin p-6 rounded-xl ">
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="/90">Resumen general del gimnasio</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-pastel-lavender border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Socios Activos</CardTitle>
              <div className="h-10 w-10 rounded-full bg-[oklch(0.65_0.18_280)] flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.sociosActivos || 0}</div>
              <p className="text-xs text-muted-foreground">Miembros activos</p>
            </CardContent>
          </Card>

          <Card className="card-pastel-mint border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <div className="h-10 w-10 rounded-full bg-[oklch(0.70_0.15_160)] flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(kpis?.ingresosMensuales || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pagos completados</p>
            </CardContent>
          </Card>

          <Card className="card-pastel-coral border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Activas</CardTitle>
              <div className="h-10 w-10 rounded-full bg-[oklch(0.68_0.15_35)] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.clasesActivas || 0}</div>
              <p className="text-xs text-muted-foreground">Clases programadas</p>
            </CardContent>
          </Card>

          <Card className="card-pastel-blue border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrenadores</CardTitle>
              <div className="h-10 w-10 rounded-full bg-[oklch(0.70_0.18_200)] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.entrenadoresActivos || 0}</div>
              <p className="text-xs text-muted-foreground">Equipo activo</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Próximamente: registro de actividad en tiempo real
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clases Populares</CardTitle>
              <CardDescription>Clases con mayor asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Próximamente: estadísticas de asistencia
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
