"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getUser } from "@/lib/auth-client"
import { Calendar, CreditCard, Award as IdCard, TrendingUp, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MembresiaData {
  plan: string
  fechaInicio: string
  fechaVencimiento: string
  diasRestantes: number
  estado: string
  codigoQR?: string
  nombre?: string
  apellido?: string
  rut?: string
  fotoURL?: string // Added fotoURL field
}

export default function SocioDashboardPage() {
  const [membershipData, setMembershipData] = useState<MembresiaData | null>(null)
  const [showCredencial, setShowCredencial] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser()
        if (!user || !user.socioID) {
          console.error("[v0] No socio ID found")
          return
        }

        console.log("[v0] Fetching membership data for socioID:", user.socioID)
        const response = await fetch(`/api/socio/membresia?socioID=${user.socioID}`)
        if (!response.ok) throw new Error("Error al obtener datos de membresía")

        const data = await response.json()
        console.log("[v0] Membership data received:", data)
        if (data && data.CodigoQR !== undefined) {
          console.log("[v0] CodigoQR value:", data.CodigoQR)
        }

        if (data) {
          const fechaVencimiento = new Date(data.FechaFin)
          const hoy = new Date()
          const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          const mappedData = {
            plan: data.NombrePlan,
            fechaInicio: new Date(data.FechaInicio).toLocaleDateString("es-CL"),
            fechaVencimiento: fechaVencimiento.toLocaleDateString("es-CL"),
            diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
            estado: data.Estado,
            codigoQR: data.CodigoQR,
            nombre: data.Nombre,
            apellido: data.Apellido,
            rut: data.RUT,
            fotoURL: data.FotoURL, // Added fotoURL to mapped data
          }

          console.log("[v0] Mapped membership data:", mappedData)
          console.log("[v0] codigoQR after mapping:", mappedData.codigoQR)
          setMembershipData(mappedData)
        }
      } catch (error) {
        console.error("[v0] Error fetching membership data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock stats (esto se puede mejorar después)
  const stats = {
    asistenciasMes: 18,
    proximaSesion: "2025-01-22 11:00",
    clasesReservadas: 3,
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu portal de miembro</p>
        </div>

        {/* Membership Status */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Estado de Membresía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Actual</p>
                <p className="text-2xl font-bold">{membershipData?.plan || "Sin plan"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    membershipData?.estado === "Vigente" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {membershipData?.estado || "Sin datos"}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className="text-lg font-medium">{membershipData?.fechaVencimiento || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Días Restantes</p>
                <p className="text-lg font-medium">
                  {membershipData?.diasRestantes !== undefined ? `${membershipData.diasRestantes} días` : "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/socio/membresia">
                <Button>Ver Detalles de Membresía</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencias este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.asistenciasMes}</div>
              <p className="text-xs text-muted-foreground">+3 vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Sesión</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stats.proximaSesion}</div>
              <p className="text-xs text-muted-foreground">Con Pedro Martínez</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Reservadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clasesReservadas}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/socio/entrenadores">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Sesión con Entrenador
                </Button>
              </Link>
              <Link href="/socio/membresia">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Mi Membresía
                </Button>
              </Link>
              <Link href="/socio/pagos">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Realizar Pago
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowCredencial(true)}
                title="Ver mi credencial de socio"
              >
                <IdCard className="h-4 w-4 mr-2" />
                Ver Mi Credencial
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Actividades</CardTitle>
              <CardDescription>Tus sesiones y clases programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded p-2 min-w-[50px]">
                    <span className="text-xs font-medium text-primary">11:00</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sesión Personal</p>
                    <p className="text-xs text-muted-foreground">Con Pedro Martínez</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-blue-100 rounded p-2 min-w-[50px]">
                    <span className="text-xs font-medium text-blue-700">18:00</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Clase Funcional</p>
                    <p className="text-xs text-muted-foreground">Miércoles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCredencial} onOpenChange={setShowCredencial}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none">
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-xl shadow-2xl overflow-hidden">
            {/* Header con gradiente rojo */}
            <div className="h-24 bg-gradient-to-r from-red-600 to-red-800 relative">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative h-full flex items-center px-6">
                <h2 className="text-white text-2xl font-bold tracking-tight">CREDENCIAL DE SOCIO</h2>
              </div>
              {/* Botón cerrar */}
              <button
                onClick={() => setShowCredencial(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido de la credencial */}
            <div className="p-6 space-y-6">
              {/* Foto de perfil */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-red-600 shadow-lg">
                  {membershipData?.fotoURL ? (
                    <img
                      src={membershipData.fotoURL || "/placeholder.svg"}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-zinc-400 text-4xl font-bold">
                        {membershipData?.nombre?.[0]}
                        {membershipData?.apellido?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del socio */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                  <p className="text-white text-xl font-semibold">
                    {membershipData?.nombre && membershipData?.apellido
                      ? `${membershipData.nombre} ${membershipData.apellido}`
                      : "Sin información"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">RUT</p>
                    <p className="text-white text-lg font-medium">{membershipData?.rut || "Sin información"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Estado</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      Miembro Activo
                    </span>
                  </div>
                </div>
              </div>

              {/* Código QR */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-4">
                {membershipData?.codigoQR ? (
                  <QrCodeQuickChart value={membershipData.codigoQR} size={200} />
                ) : (
                  <p className="text-zinc-500 text-sm">No tienes un código QR asignado</p>
                )}
              </div>

              {/* Botón cerrar */}
              <Button
                onClick={() => setShowCredencial(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Cerrar
              </Button>
            </div>

            {/* Decoración inferior */}
            <div className="h-2 bg-gradient-to-r from-red-600 via-zinc-700 to-black" />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
