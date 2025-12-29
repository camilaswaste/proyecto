"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth-client"
import { Bell, CheckCircle, Clock, Megaphone } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAvisos = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      const response = await fetch(`/api/avisos?usuarioID=${user.usuarioID}&tipo=Entrenador`)
      if (response.ok) {
        const data = await response.json()
        setAvisos(data.avisos || [])
        setAvisosNoLeidos(data.noLeidos || 0)
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

      if (response.ok) fetchAvisos()
    } catch (error) {
      console.error("Error al marcar aviso como leído:", error)
    }
  }

  const formatFecha = useMemo(
    () => (fecha: string) =>
      new Date(fecha).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  )

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Avisos del Gimnasio</h1>
            <p className="text-muted-foreground">Información importante y anuncios</p>
          </div>

          {avisosNoLeidos > 0 && (
            <div className="inline-flex">
              <Badge className="px-4 py-2 text-sm font-bold bg-amber-500/15 text-amber-800 border border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-300/20">
                {avisosNoLeidos} {avisosNoLeidos === 1 ? "aviso nuevo" : "avisos nuevos"}
              </Badge>
            </div>
          )}
        </div>

        {avisos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground/80">No hay avisos disponibles</p>
              <p className="text-sm text-muted-foreground mt-2">Los avisos del gimnasio aparecerán aquí</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avisos.map((aviso) => {
              const unread = !aviso.Leido

              return (
                <Card
                  key={aviso.AvisoID}
                  className={[
                    "transition-shadow",
                    unread
                      ? "border-amber-300/60 bg-amber-50/60 shadow-sm dark:bg-amber-950/20 dark:border-amber-300/15"
                      : "border-border bg-card",
                    "hover:shadow-md",
                  ].join(" ")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={[
                            "flex items-center justify-center w-10 h-10 rounded-full border shrink-0",
                            unread
                              ? "bg-amber-500/15 border-amber-400/25 dark:bg-amber-400/10 dark:border-amber-300/15"
                              : "bg-muted border-border",
                          ].join(" ")}
                        >
                          {unread ? (
                            <Bell className="h-5 w-5 text-amber-700 dark:text-amber-200" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-xl truncate">{aviso.Titulo}</CardTitle>
                            {unread && (
                              <Badge className="bg-amber-500 text-white border border-amber-600/20 dark:bg-amber-400 dark:text-black">
                                Nuevo
                              </Badge>
                            )}
                          </div>

                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatFecha(aviso.FechaCreacion)}
                          </CardDescription>
                        </div>
                      </div>

                      {unread && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoLeido(aviso.AvisoID)}
                          className="border-amber-300/50 hover:bg-amber-500/10 hover:text-foreground dark:border-amber-300/20 dark:hover:bg-amber-400/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar como leído
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                      {aviso.Mensaje}
                    </p>

                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                      <span>Publicado por: {aviso.NombreCreador}</span>
                      <Badge
                        variant="outline"
                        className="w-fit border-amber-300/40 text-amber-800 dark:border-amber-300/20 dark:text-amber-200"
                      >
                        {aviso.Destinatarios}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
