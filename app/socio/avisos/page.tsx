"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { AlertCircle, Bell, Calendar, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  TipoAviso: string
  Destinatarios: string
  FechaInicio: string
  FechaFin: string | null
  Leido: number
  FechaLeido: string | null
}

export default function SocioAvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [socioID, setSocioID] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const user = await getUser()
      if (!user || !user.socioID) return

      setSocioID(user.socioID)

      const response = await fetch(`/api/avisos?socioID=${user.socioID}&soloActivos=true`)
      if (response.ok) {
        const data = await response.json()
        setAvisos(data)
      }
    } catch (error) {
      console.error("Error al cargar avisos:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeido = async (avisoID: number) => {
    if (!socioID) return

    try {
      const response = await fetch("/api/avisos/marcar-leido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisoID, socioID }),
      })

      if (response.ok) {
        setAvisos((prev) => prev.map((a) => (a.AvisoID === avisoID ? { ...a, Leido: 1 } : a)))
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error)
    }
  }

  const getTipoAvisoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      Mantenimiento: "bg-yellow-100 text-yellow-800",
      Evento: "bg-blue-100 text-blue-800",
      Horario: "bg-purple-100 text-purple-800",
      General: "bg-gray-100 text-gray-800",
      Urgente: "bg-red-100 text-red-800",
    }
    return colors[tipo] || colors.General
  }

  const avisosNoLeidos = avisos.filter((a) => !a.Leido).length

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando avisos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm border-l-8 border-[#D96500]">
          <h1 className="text-3xl font-bold text-[#AD5300]">Avisos del Gimnasio</h1>
          <p className="text-[#AD5300]">Mantente informado sobre eventos, mantenimiento y novedades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avisos Activos</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avisos.length}</div>
              <p className="text-xs text-muted-foreground">Avisos disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avisos Sin Leer</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{avisosNoLeidos}</div>
              <p className="text-xs text-muted-foreground">Pendientes de lectura</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Avisos</CardTitle>
            <CardDescription>
              {avisosNoLeidos > 0 ? `Tienes ${avisosNoLeidos} aviso(s) sin leer` : "Todos los avisos están leídos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {avisos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay avisos disponibles</p>
              ) : (
                avisos.map((aviso) => (
                  <div
                    key={aviso.AvisoID}
                    className={`border rounded-lg p-4 space-y-3 ${!aviso.Leido ? "border-orange-500 bg-orange-50/50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {!aviso.Leido && <Bell className="h-4 w-4 text-orange-600" />}
                          <h3 className="font-semibold text-lg">{aviso.Titulo}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoAvisoBadge(aviso.TipoAviso)}`}
                          >
                            {aviso.TipoAviso}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{aviso.Mensaje}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(aviso.FechaInicio).toLocaleDateString("es-CL")}
                            {aviso.FechaFin && ` - ${new Date(aviso.FechaFin).toLocaleDateString("es-CL")}`}
                          </span>
                          {aviso.Leido ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Leído
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {!aviso.Leido && (
                        <Button size="sm" variant="outline" onClick={() => marcarComoLeido(aviso.AvisoID)}>
                          Marcar como leído
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
