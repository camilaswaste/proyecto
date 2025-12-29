"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, FileText, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Socio {
  Nombre: string
  Apellido: string
  Email: string
  RUT: string
}

interface HistorialItem {
  HistorialID: number
  MembresíaID: number | null
  Accion: string
  PlanAnterior: string | null
  PlanNuevo: string | null
  EstadoAnterior: string | null
  EstadoNuevo: string
  FechaAnterior: string | null
  FechaNueva: string | null
  MontoAnterior: number | null
  MontoNuevo: number | null
  Motivo: string | null
  Detalles: string | null
  FechaRegistro: string
  AdminUsuario: string | null
}

export default function HistorialSocioPage() {
  const params = useParams()
  const router = useRouter()
  const socioId = params.socioId as string

  const [socio, setSocio] = useState<Socio | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistorial()
  }, [socioId])

  const fetchHistorial = async () => {
    try {
      const response = await fetch(`/api/admin/socios/${socioId}/historial`)
      if (!response.ok) throw new Error("Error al cargar historial")
      const data = await response.json()
      setSocio(data.socio)
      setHistorial(data.historial)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case "Asignada":
        return "bg-green-100 text-green-800 border-green-200"
      case "Cambiada":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Suspendida":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Reanudada":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "Cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      case "Vencida":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case "Asignada":
        return "✓"
      case "Cambiada":
        return "↻"
      case "Suspendida":
        return "⏸"
      case "Reanudada":
        return "▶"
      case "Cancelada":
        return "✕"
      case "Vencida":
        return "⌛"
      default:
        return "•"
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Historial de Membresías</h1>
          <p className="text-muted-foreground">
            {socio?.Nombre} {socio?.Apellido} - {socio?.RUT}
          </p>
        </div>
      </div>

      {socio && (
        <Card>
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Información del Socio</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">
                  {socio.Nombre} {socio.Apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{socio.Email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RUT</p>
                <p className="font-medium font-mono">{socio.RUT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Timeline de Cambios</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{historial.length} registros</p>
          </div>
          <CardDescription>Todos los cambios realizados en las membresías del socio</CardDescription>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay historial de cambios para este socio</p>
            </div>
          ) : (
            <div className="relative space-y-6">
              {/* Timeline line */}
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border" />

              {historial.map((item, index) => (
                <div key={item.HistorialID} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-bold ${getAccionColor(
                        item.Accion,
                      )}`}
                    >
                      {getAccionIcon(item.Accion)}
                    </div>
                  </div>

                  {/* Content */}
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium border ${getAccionColor(item.Accion)}`}
                            >
                              {item.Accion}
                            </span>
                            {item.PlanNuevo && (
                              <span className="text-sm font-medium text-muted-foreground">{item.PlanNuevo}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{formatDateTime(item.FechaRegistro)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.Detalles && (
                        <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md">{item.Detalles}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {item.PlanAnterior && item.PlanNuevo && (
                          <div>
                            <p className="text-muted-foreground mb-1">Plan</p>
                            <p>
                              <span className="line-through text-muted-foreground">{item.PlanAnterior}</span>
                              {" → "}
                              <span className="font-medium">{item.PlanNuevo}</span>
                            </p>
                          </div>
                        )}

                        {item.EstadoAnterior && (
                          <div>
                            <p className="text-muted-foreground mb-1">Estado</p>
                            <p>
                              <span className="text-muted-foreground">{item.EstadoAnterior}</span>
                              {" → "}
                              <span className="font-medium">{item.EstadoNuevo}</span>
                            </p>
                          </div>
                        )}

                        {item.FechaAnterior && item.FechaNueva && (
                          <div>
                            <p className="text-muted-foreground mb-1">Fecha de Vencimiento</p>
                            <p>
                              <span className="text-muted-foreground">{formatDate(item.FechaAnterior)}</span>
                              {" → "}
                              <span className="font-medium">{formatDate(item.FechaNueva)}</span>
                            </p>
                          </div>
                        )}

                        {item.MontoNuevo && (
                          <div>
                            <p className="text-muted-foreground mb-1">Monto</p>
                            <p className="font-medium">${item.MontoNuevo.toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      {item.Motivo && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                          <p className="text-sm italic">{item.Motivo}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
