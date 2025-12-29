"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [pendingUpdates, setPendingUpdates] = useState<any>(null)

  const checkPendingUpdates = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/admin/sync")
      if (response.ok) {
        const data = await response.json()
        setPendingUpdates(data.pendingUpdates)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al verificar actualizaciones pendientes")
    } finally {
      setChecking(false)
    }
  }

  const runSync = async () => {
    if (!confirm("¿Estás seguro de ejecutar la sincronización? Esto actualizará estados automáticamente.")) return

    setLoading(true)
    setSyncResult(null)
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setSyncResult(data)
        // Refresh pending updates
        await checkPendingUpdates()
      } else {
        alert("Error al ejecutar sincronización")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al ejecutar sincronización")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sincronización de Datos</h1>
          <p className="text-muted-foreground">Actualiza automáticamente estados y mantén los datos consistentes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Verificar Actualizaciones</CardTitle>
              <CardDescription>Revisa qué datos necesitan sincronización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkPendingUpdates} disabled={checking} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Verificando..." : "Verificar Ahora"}
              </Button>

              {pendingUpdates && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Membresías vencidas:</span>
                    <Badge variant={pendingUpdates.expiredMemberships > 0 ? "destructive" : "secondary"}>
                      {pendingUpdates.expiredMemberships}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Socios morosos:</span>
                    <Badge variant={pendingUpdates.morososToUpdate > 0 ? "destructive" : "secondary"}>
                      {pendingUpdates.morososToUpdate}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reservas pasadas:</span>
                    <Badge variant={pendingUpdates.pastReservations > 0 ? "destructive" : "secondary"}>
                      {pendingUpdates.pastReservations}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sesiones pasadas:</span>
                    <Badge variant={pendingUpdates.pastSessions > 0 ? "destructive" : "secondary"}>
                      {pendingUpdates.pastSessions}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ejecutar Sincronización</CardTitle>
              <CardDescription>Actualiza todos los estados automáticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runSync} disabled={loading} variant="default" className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Sincronizando..." : "Sincronizar Ahora"}
              </Button>

              {syncResult && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Sincronización completada</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• {syncResult.results.memberships} membresías actualizadas</p>
                    <p>• {syncResult.results.socios} socios actualizados</p>
                    <p>• {syncResult.results.reservations} reservas actualizadas</p>
                    <p>• {syncResult.results.sessions} sesiones actualizadas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Qué hace la sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Actualiza membresías vencidas</p>
                  <p className="text-muted-foreground">
                    Marca como "Vencida" las membresías cuya fecha de vencimiento ya pasó
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Actualiza estado de socios</p>
                  <p className="text-muted-foreground">
                    Marca como "Moroso" a socios sin membresía activa, e "Inactivo" a quienes no han tenido membresía en
                    90+ días
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Actualiza reservas de clases</p>
                  <p className="text-muted-foreground">
                    Marca como "NoAsistió" las reservas de clases pasadas que aún están en estado "Reservada"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Actualiza sesiones personales</p>
                  <p className="text-muted-foreground">
                    Marca como "NoAsistio" las sesiones pasadas que aún están en estado "Agendada"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-yellow-900">Recomendación</p>
                <p className="text-sm text-yellow-800">
                  Se recomienda ejecutar esta sincronización diariamente, idealmente durante la madrugada cuando hay
                  menos actividad en el sistema. Puedes configurar un cron job o tarea programada para automatizar este
                  proceso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
