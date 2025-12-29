"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getUser } from "@/lib/auth-client"
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Users,
  User,
  CheckCircle2,
  XCircle,
  Sparkles,
  Dumbbell,
  ArrowUpRight,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"

type TipoSesion = "Personal" | "Grupal"

interface ItemSesion {
  Tipo: TipoSesion
  ItemID: number
  ClaseID: number | null
  ReservaID: number | null
  NombreActividad: string
  Descripcion: string | null
  DiaSemana: string | null
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number | null
  Categoria: string | null
  TipoClase: string | null
  FechaInicio: string | null
  FechaFin: string | null
  FechaActividad: string
  Estado: string
  FechaRegistro: string
  SocioID: number
  NombreSocio: string
  EmailSocio: string | null
  TelefonoSocio: string | null
}

function prettyDate(dateString: string) {
  if (!dateString) return "Fecha no disponible"
  const [y, m, d] = dateString.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function estadoBadge(estado: string) {
  const base = "border text-xs font-semibold"
  switch (estado) {
    case "Reservada":
      return `${base} bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-900/60`
    case "Asistió":
    case "Completada":
      return `${base} bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-900/60`
    case "NoAsistió":
    case "NoAsistio":
      return `${base} bg-amber-500/10 text-amber-800 border-amber-200 dark:text-amber-300 dark:border-amber-900/60`
    case "Cancelada":
      return `${base} bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-300 dark:border-rose-900/60`
    case "Reprogramada":
      return `${base} bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-300 dark:border-violet-900/60`
    case "Agendada":
      return `${base} bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-900/60`
    default:
      return `${base} bg-muted text-foreground border-border`
  }
}

function tipoPill(tipo: TipoSesion) {
  if (tipo === "Personal") {
    return "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-900/60"
  }
  return "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-300 dark:border-indigo-900/60"
}

export default function EntrenadorSesionesPage() {
  const [items, setItems] = useState<ItemSesion[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchItems = async () => {
    try {
      const user = getUser()
      const entrenadorID = user?.entrenadorID

      if (!entrenadorID) {
        console.error("No se pudo obtener el EntrenadorID")
        return
      }

      const res = await fetch(`/api/entrenador/sesiones?entrenadorID=${entrenadorID}`, { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as ItemSesion[]
        setItems(Array.isArray(data) ? data : [])
      } else {
        toast({ title: "Error", description: "No se pudieron cargar las sesiones", variant: "destructive" })
      }
    } catch (e) {
      console.error("Error al cargar sesiones:", e)
      toast({ title: "Error", description: "No se pudieron cargar las sesiones", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (item: ItemSesion, nuevoEstado: string) => {
    const nombre = item.NombreSocio || "socio"
    if (!confirm(`¿Marcar como ${nuevoEstado} la sesión de ${nombre}?`)) return

    try {
      const res = await fetch(`/api/entrenador/sesiones?itemID=${item.ItemID}&tipo=${item.Tipo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (res.ok) {
        toast({
          title: "Estado actualizado",
          description: `${item.Tipo === "Personal" ? "Sesión personal" : "Reserva grupal"} marcada como ${nuevoEstado}`,
        })
        fetchItems()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Error", description: err.error || "Error al actualizar estado", variant: "destructive" })
      }
    } catch (e) {
      console.error("Error:", e)
      toast({ title: "Error", description: "Error al actualizar estado", variant: "destructive" })
    }
  }

  const handleCancelar = async (item: ItemSesion) => {
    const nombre = item.NombreSocio || "socio"
    if (!confirm(`¿Cancelar ${item.Tipo === "Personal" ? "la sesión" : "la reserva"} de ${nombre}?`)) return

    try {
      const res = await fetch(`/api/entrenador/sesiones?itemID=${item.ItemID}&tipo=${item.Tipo}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Cancelado", description: "Se canceló correctamente." })
        fetchItems()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Error", description: err.error || "No se pudo cancelar", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo cancelar", variant: "destructive" })
    }
  }

  const personales = useMemo(() => items.filter((i) => i.Tipo === "Personal"), [items])
  const grupales = useMemo(() => items.filter((i) => i.Tipo === "Grupal"), [items])

  const activas = useMemo(
    () =>
      items.filter((i) =>
        i.Tipo === "Grupal"
          ? i.Estado === "Reservada" || i.Estado === "Reprogramada"
          : i.Estado === "Agendada"
      ),
    [items]
  )

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="mx-auto h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-red-600 animate-pulse" />
            </div>
            <p className="text-muted-foreground">Cargando sesiones...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        {/* Header hero */}
        <div className="relative overflow-hidden rounded-2xl border bg-background p-6 shadow-sm">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/70 via-red-500/20 to-transparent" />

          <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-red-600" />
                Gestión de agenda y asistencia
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">Mis sesiones</h1>
              <p className="text-muted-foreground">Personales (1 a 1) y Grupales (clases) desde un solo panel.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Próximas
                </div>
                <div className="text-2xl font-bold">{activas.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border bg-gradient-to-br from-red-50 to-background dark:from-red-950/30 dark:to-background overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sesiones Personales</CardTitle>
              <div className="h-9 w-9 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personales.length}</div>
              <p className="text-xs text-muted-foreground">{personales.filter((i) => i.Estado === "Agendada").length} activas</p>
            </CardContent>
          </Card>

          <Card className="border bg-gradient-to-br from-indigo-50 to-background dark:from-indigo-950/25 dark:to-background overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Grupales</CardTitle>
              <div className="h-9 w-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grupales.length}</div>
              <p className="text-xs text-muted-foreground">
                {grupales.filter((i) => i.Estado === "Reservada" || i.Estado === "Reprogramada").length} activas
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-gradient-to-br from-slate-50 to-background dark:from-slate-950/25 dark:to-background overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <div className="h-9 w-9 rounded-2xl bg-slate-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">{activas.length} próximas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todas">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/40 p-1">
            <TabsTrigger value="todas" className="rounded-xl">
              Todas
            </TabsTrigger>
            <TabsTrigger value="personales" className="rounded-xl">
              <User className="h-4 w-4 mr-2" />
              Personales
            </TabsTrigger>
            <TabsTrigger value="grupales" className="rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              Grupales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-4">
            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">No hay sesiones disponibles</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {items.map((item) => (
                  <Card
                    key={`${item.Tipo}-${item.ItemID}`}
                    className={[
                      "group overflow-hidden border bg-background",
                      "hover:shadow-lg transition-all",
                      item.Tipo === "Personal" ? "hover:border-red-500/30" : "hover:border-indigo-500/30",
                    ].join(" ")}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-border">
                            <AvatarFallback className="bg-muted text-foreground">
                              {(item.NombreSocio || "SO")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-1">
                            <CardTitle className="text-lg leading-tight">
                              {item.Tipo === "Personal" ? "Sesión personal" : item.NombreActividad}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-muted-foreground">{item.NombreSocio}</p>
                              <Badge className={`border ${tipoPill(item.Tipo)}`}>{item.Tipo}</Badge>
                              {item.Categoria ? (
                                <Badge variant="outline" className="text-xs rounded-full">
                                  {item.Categoria}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${estadoBadge(item.Estado)} rounded-full px-3 py-1`}>{item.Estado}</Badge>
                        </div>
                      </div>

                      {(item.EmailSocio || item.TelefonoSocio) && (
                        <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                          {item.EmailSocio && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{item.EmailSocio}</span>
                            </div>
                          )}
                          {item.TelefonoSocio && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{item.TelefonoSocio}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{prettyDate(item.FechaActividad)}</span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {item.HoraInicio} – {item.HoraFin}
                            </span>
                          </div>
                          {item.DiaSemana && (
                            <Badge variant="secondary" className="rounded-full">
                              {item.DiaSemana}
                            </Badge>
                          )}
                        </div>

                        {item.Descripcion ? (
                          <div className="rounded-xl bg-background/60 p-3">
                            <p className="text-sm text-muted-foreground">{item.Descripcion}</p>
                          </div>
                        ) : null}

                        {/* Acciones (misma lógica, solo UX más clara) */}
                        <div className="flex flex-col gap-2 pt-1 md:flex-row">
                          {item.Tipo === "Grupal" && (item.Estado === "Reservada" || item.Estado === "Reprogramada") ? (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
                                onClick={() => handleCambiarEstado(item, "Asistió")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Asistió
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-amber-500/10 hover:text-amber-800 hover:border-amber-300"
                                onClick={() => handleCambiarEstado(item, "NoAsistió")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No asistió
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-300"
                                onClick={() => handleCancelar(item)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : null}

                          {item.Tipo === "Personal" && item.Estado === "Agendada" ? (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
                                onClick={() => handleCambiarEstado(item, "Completada")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Completada
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-amber-500/10 hover:text-amber-800 hover:border-amber-300"
                                onClick={() => handleCambiarEstado(item, "NoAsistio")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No asistió
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 rounded-xl hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-300"
                                onClick={() => handleCancelar(item)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              {item.Tipo === "Personal"
                                ? "Esta sesión ya no está en estado Agendada."
                                : "Esta reserva ya no está activa."}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="personales" className="space-y-4">
            {personales.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">No tienes sesiones personales</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {personales.map((i) => (
                  <Card key={`Personal-${i.ItemID}`} className="border hover:shadow-lg transition-all hover:border-red-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Sesión personal</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge className={`border ${tipoPill("Personal")}`}>Personal</Badge>
                        <Badge className={`${estadoBadge(i.Estado)} rounded-full px-3 py-1`}>{i.Estado}</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-medium">{i.NombreSocio}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{prettyDate(i.FechaActividad)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-semibold">
                          {i.HoraInicio} – {i.HoraFin}
                        </span>
                      </div>

                      {i.Estado === "Agendada" && (
                        <div className="mt-4 grid gap-2 md:grid-cols-3">
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
                            onClick={() => handleCambiarEstado(i, "Completada")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completada
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-amber-500/10 hover:text-amber-800 hover:border-amber-300"
                            onClick={() => handleCambiarEstado(i, "NoAsistio")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            No asistió
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-300"
                            onClick={() => handleCancelar(i)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grupales" className="space-y-4">
            {grupales.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">No tienes clases grupales</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {grupales.map((i) => (
                  <Card key={`Grupal-${i.ItemID}`} className="border hover:shadow-lg transition-all hover:border-indigo-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{i.NombreActividad}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge className={`border ${tipoPill("Grupal")}`}>Grupal</Badge>
                        <Badge className={`${estadoBadge(i.Estado)} rounded-full px-3 py-1`}>{i.Estado}</Badge>
                        {i.Categoria ? (
                          <Badge variant="outline" className="rounded-full">
                            {i.Categoria}
                          </Badge>
                        ) : null}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-medium">{i.NombreSocio}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{prettyDate(i.FechaActividad)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-semibold">
                          {i.HoraInicio} – {i.HoraFin}
                        </span>
                      </div>

                      {(i.Estado === "Reservada" || i.Estado === "Reprogramada") && (
                        <div className="mt-4 grid gap-2 md:grid-cols-3">
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
                            onClick={() => handleCambiarEstado(i, "Asistió")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Asistió
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-amber-500/10 hover:text-amber-800 hover:border-amber-300"
                            onClick={() => handleCambiarEstado(i, "NoAsistió")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            No asistió
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-300"
                            onClick={() => handleCancelar(i)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
