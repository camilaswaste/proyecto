"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Clock, UserCircle, Star, CalendarDays, CheckCircle2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { getUser } from "@/lib/auth-client"

interface Turno {
  HorarioRecepcionID: number
  EntrenadorID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  Nombre: string
  Apellido: string
  Especialidad: string | null
  EsMio?: number
}

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function TurnoEntrenadorPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const user = getUser()
    if (user?.usuarioID) {
      fetchData(String(user.usuarioID))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async (uid: string) => {
    try {
      const response = await fetch(`/api/entrenador/turno?usuarioID=${uid}`, { cache: "no-store" })
      if (!response.ok) throw new Error("Error")
      const data = await response.json()
      setTurnos(data.turnos || [])
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el cronograma", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const turnosPorDia = useMemo(() => {
    const map: Record<string, Turno[]> = {}
    diasSemana.forEach((dia) => (map[dia] = []))
    turnos.forEach((h) => {
      if (map[h.DiaSemana]) map[h.DiaSemana].push(h)
    })
    return map
  }, [turnos])

  const misTurnosCount = useMemo(() => turnos.filter((h) => h.EsMio === 1).length, [turnos])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600/30 border-t-red-600" />
            <div className="mt-4 text-center text-sm text-muted-foreground">Cargando cronograma…</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        {/* HERO / Encabezado */}
        <div className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-sm">
          {/* decor */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-red-500/80 via-red-500/30 to-transparent" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Cronograma <span className="text-red-600">Semanal</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualiza tus horarios de recepción por día. Desliza horizontalmente para ver toda la semana.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border bg-red-50 px-4 py-2 dark:bg-red-950/25 dark:border-red-900/40">
              <Star className="h-4 w-4 text-red-600 fill-red-600" />
              <span className="text-sm font-extrabold text-red-700 dark:text-red-300">
                {misTurnosCount} turnos asignados
              </span>
            </div>
          </div>
        </div>

        {/* SCROLL HORIZONTAL */}
        <div className="relative -mx-2 overflow-x-auto px-2 pb-6 scrollbar-slim">
          <div className="flex min-w-max gap-4">
            {diasSemana.map((dia) => {
              const list = turnosPorDia[dia] ?? []
              return (
                <section key={dia} className="w-[300px] flex flex-col gap-4">
                  {/* Cabecera del día */}
                  <div className="rounded-2xl border bg-muted/30 p-3 dark:bg-muted/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10">
                          <CalendarDays className="h-4.5 w-4.5 text-red-600" />
                        </div>
                        <div className="leading-tight">
                          <p className="text-sm font-extrabold">{dia}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {list.length === 0 ? "Sin horarios" : `${list.length} bloque(s)`}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-black tracking-widest uppercase rounded-lg border bg-background px-2 py-1 text-muted-foreground">
                        {list.length}
                      </span>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="space-y-3">
                    {list.length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-background/50 p-8 text-center dark:bg-background/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                          Libre
                        </p>
                      </div>
                    ) : (
                      list.map((h) => {
                        const esMio = h.EsMio === 1

                        return (
                          <Card
                            key={h.HorarioRecepcionID}
                            className={[
                              "group relative overflow-hidden rounded-2xl border transition-all",
                              "bg-background shadow-sm hover:shadow-md",
                              esMio
                                ? "border-red-500/30 ring-1 ring-red-500/20"
                                : "border-muted/60 hover:border-red-500/15",
                            ].join(" ")}
                          >
                            {/* Accent */}
                            <div
                              className={[
                                "absolute left-0 top-0 h-full w-1",
                                esMio ? "bg-gradient-to-b from-red-600 to-orange-500" : "bg-muted",
                              ].join(" ")}
                            />

                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={[
                                    "inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-[11px] font-black",
                                    esMio
                                      ? "bg-red-600 text-white"
                                      : "bg-muted/60 text-muted-foreground dark:bg-muted/30",
                                  ].join(" ")}
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {h.HoraInicio} – {h.HoraFin}
                                  </span>
                                </div>

                                {esMio ? <CheckCircle2 className="h-4.5 w-4.5 text-red-600" /> : null}
                              </div>

                              <div className="mt-3 flex items-center gap-3">
                                <div
                                  className={[
                                    "h-10 w-10 rounded-2xl flex items-center justify-center border",
                                    esMio
                                      ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/40"
                                      : "bg-muted/30 border-muted/60 text-muted-foreground",
                                  ].join(" ")}
                                >
                                  <UserCircle className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-extrabold">
                                    {h.Nombre} {h.Apellido}
                                  </p>
                                  <p className="truncate text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {h.Especialidad || "Entrenador"}
                                  </p>
                                </div>
                              </div>

                              {esMio ? (
                                <div className="mt-4">
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-100 dark:bg-red-950/30">
                                    <div className="h-full w-full animate-shimmer bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
                                  </div>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-slim::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-slim::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-slim::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 999px;
        }
        .dark .scrollbar-slim::-webkit-scrollbar-thumb {
          background: rgba(30, 41, 59, 0.85);
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.2s linear infinite;
        }
      `}</style>
    </DashboardLayout>
  )
}
