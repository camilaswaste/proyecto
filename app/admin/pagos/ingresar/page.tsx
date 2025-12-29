"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, CreditCard, Loader2, Search, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Socio {
  SocioID: number
  Nombre: string
  Apellido: string
  RUT: string
  Email: string
  Telefono: string
  PlanID: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
  FechaVencimiento: string
  EstadoMembresia: string
}

export default function IngresarPagoPage() {
  const router = useRouter()
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSocio, setSelectedSocio] = useState<number | null>(null)

  useEffect(() => {
    fetchSociosConMembresia()
  }, [])

  const fetchSociosConMembresia = async () => {
    try {
      const response = await fetch("/api/admin/socios/membresia-activa")
      if (response.ok) {
        const data = await response.json()
        setSocios(data)
      }
    } catch (error) {
      console.error("Error al cargar socios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarSocio = (socio: Socio) => {
    router.push(`/admin/pagos/procesar?socioID=${socio.SocioID}&planID=${socio.PlanID}`)
  }

  const filteredSocios = socios.filter(
    (socio) =>
      socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.RUT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.NombrePlan.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount)
  }

  const getDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffTime = vencimiento.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">Cargando socios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/admin/pagos">
              <Button
                variant="ghost"
                className="mb-2 transition-colors hover:bg-muted/60 dark:hover:bg-muted/40"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Pagos
              </Button>
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground">Ingresar Pago Manual</h1>
            <p className="text-muted-foreground text-pretty max-w-2xl">
              Selecciona un socio con membresía activa para registrar un nuevo pago
            </p>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/40 pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-semibold">Socios con Membresía Activa</CardTitle>
                  <CardDescription>
                    {filteredSocios.length} {filteredSocios.length === 1 ? "socio disponible" : "socios disponibles"}
                  </CardDescription>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, RUT o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={[
                    "pl-10 h-11",
                    "bg-muted/30 border-muted-foreground/20",
                    "focus-visible:bg-background",
                    "dark:bg-muted/20 dark:focus-visible:bg-background",
                  ].join(" ")}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {filteredSocios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-muted/20 mb-4">
                  {searchTerm ? (
                    <Search className="h-7 w-7 text-muted-foreground" />
                  ) : (
                    <AlertCircle className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? "No se encontraron socios" : "No hay socios con membresía activa"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Los socios deben tener una membresía activa para poder ingresar pagos"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSocios.map((socio) => {
                  const diasRestantes = getDiasRestantes(socio.FechaVencimiento)
                  const estaPorVencer = diasRestantes <= 7 && diasRestantes > 0
                  const estaVencida = diasRestantes <= 0

                  const isSelected = selectedSocio === socio.SocioID

                  return (
                    <Card
                      key={socio.SocioID}
                      className={[
                        "group relative overflow-hidden border-2 transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "border-blue-500 bg-blue-50/60 shadow-lg scale-[1.02] dark:border-blue-400 dark:bg-blue-950/30"
                          : "border-border hover:border-blue-300 hover:shadow-md hover:scale-[1.01] dark:hover:border-blue-500",
                      ].join(" ")}
                      onClick={() => setSelectedSocio(socio.SocioID)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <CardTitle className="text-lg font-bold text-foreground">
                              {socio.Nombre} {socio.Apellido}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-medium">{socio.RUT}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-in fade-in zoom-in duration-200 shrink-0" />
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 dark:bg-muted/25">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Plan Actual
                            </p>
                            <p className="font-bold text-foreground">{socio.NombrePlan}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(socio.Precio)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Vence en:</span>
                          <Badge
                            variant={estaVencida ? "destructive" : estaPorVencer ? "secondary" : "outline"}
                            className="font-semibold"
                          >
                            {diasRestantes > 0 ? `${diasRestantes} días` : "Vencida"}
                          </Badge>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSeleccionarSocio(socio)
                          }}
                          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <CreditCard className="h-4 w-4" />
                          Registrar Pago
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}