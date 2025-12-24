"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Bell, CheckCircle, Clock, Megaphone } from "lucide-react"
import { useEffect, useState } from "react"

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  CreadoPor: number
  NombreCreador: string
  FechaCreacion: string
  Destinatarios: string
  Activo: boolean
  Leido: boolean
}

export default function EntrenadorAvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0)

  useEffect(() => {
    fetchAvisos()
  }, [])

  const fetchAvisos = async () => {
    try {
      const user = getUser()
      console.log("[v0] User obtenido en avisos:", user)

      if (!user?.usuarioID) {
        console.log("[v0] No hay usuarioID disponible")
        return
      }

      console.log("[v0] Fetching avisos para usuarioID:", user.usuarioID, "tipo: Entrenador")
      const response = await fetch(`/api/avisos?usuarioID=${user.usuarioID}&tipo=Entrenador`)
      console.log("[v0] Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Data recibida:", data)
        setAvisos(data.avisos || [])
        setAvisosNoLeidos(data.noLeidos || 0)
      } else {
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
      }
    } catch (error) {
      console.error("Error al cargar avisos:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeido = async (avisoID: number) => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      const response = await fetch("/api/avisos/marcar-leido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisoID, usuarioID: user.usuarioID }),
      })

      if (response.ok) {
        fetchAvisos()
      }
    } catch (error) {
      console.error("Error al marcar aviso como leído:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando avisos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Avisos del Gimnasio</h1>
            <p className="text-muted-foreground">Información importante y anuncios</p>
          </div>
          {avisosNoLeidos > 0 && (
            <Badge variant="destructive" className="text-base px-4 py-2">
              {avisosNoLeidos} {avisosNoLeidos === 1 ? "aviso nuevo" : "avisos nuevos"}
            </Badge>
          )}
        </div>

        {avisos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No hay avisos disponibles</p>
              <p className="text-sm text-muted-foreground mt-2">Los avisos del gimnasio aparecerán aquí</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avisos.map((aviso) => (
              <Card
                key={aviso.AvisoID}
                className={`${
                  aviso.Leido
                    ? "border-gray-200"
                    : "border-orange-300 bg-gradient-to-r from-orange-50/50 to-amber-50/30 shadow-md"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          aviso.Leido ? "bg-gray-100" : "bg-orange-100"
                        }`}
                      >
                        {aviso.Leido ? (
                          <CheckCircle className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Bell className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{aviso.Titulo}</CardTitle>
                          {!aviso.Leido && (
                            <Badge variant="secondary" className="bg-orange-500 text-white">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(aviso.FechaCreacion).toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    {!aviso.Leido && (
                      <Button size="sm" variant="outline" onClick={() => marcarComoLeido(aviso.AvisoID)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como leído
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{aviso.Mensaje}</p>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Publicado por: {aviso.NombreCreador}</span>
                    <Badge variant="outline">{aviso.Destinatarios}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
