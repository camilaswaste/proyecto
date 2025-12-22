"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Clock, UserCircle, Star, CalendarDays, CheckCircle2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { getUser } from "@/lib/auth-client" 

interface Horario {
  HorarioRecepcionID: number
  EntrenadorID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  Nombre: string
  Apellido: string
  Especialidad: string
  EsMio?: number
}

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function HorarioEntrenadorPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const user = getUser()
    if (user?.usuarioID) {
      fetchData(user.usuarioID.toString())
    } else {
      setLoading(false)
    }
  }, [])

  const fetchData = async (uid: string) => {
    try {
      const response = await fetch(`/api/entrenador/horario?usuarioID=${uid}`)
      if (!response.ok) throw new Error("Error")
      const data = await response.json()
      setHorarios(data.horarios || [])
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el cronograma", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const horariosPorDia = useMemo(() => {
    const map: Record<string, Horario[]> = {}
    diasSemana.forEach(dia => map[dia] = [])
    horarios.forEach(h => { if (map[h.DiaSemana]) map[h.DiaSemana].push(h) })
    return map
  }, [horarios])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cronograma <span className="text-red-600">Semanal</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Desliza horizontalmente para ver todos los días de la semana.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl">
            <Star className="h-4 w-4 text-red-600 fill-red-600" />
            <span className="text-sm font-bold text-red-700 dark:text-red-400">
              {horarios.filter(h => h.EsMio === 1).length} Turnos Asignados
            </span>
          </div>
        </div>

        {/* Contenedor de Scroll Horizontal */}
        <div className="relative overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {diasSemana.map((dia) => (
              <div key={dia} className="w-[280px] flex flex-col gap-4">
                {/* Cabecera del Día */}
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-red-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{dia}</span>
                  </div>
                  <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border text-slate-400 font-bold">
                    {horariosPorDia[dia].length}
                  </span>
                </div>

                {/* Lista de Turnos */}
                <div className="space-y-3">
                  {horariosPorDia[dia].length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center bg-slate-50/30 dark:bg-slate-900/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Libre</p>
                    </div>
                  ) : (
                    horariosPorDia[dia].map((h) => {
                      const esMiTurno = h.EsMio === 1
                      return (
                        <Card 
                          key={h.HorarioRecepcionID}
                          className={`group relative overflow-hidden transition-all duration-300 border-none shadow-sm ${
                            esMiTurno 
                              ? "ring-2 ring-red-600 bg-white dark:bg-slate-900 z-10 scale-[1.02]" 
                              : "bg-white/40 dark:bg-slate-900/20 opacity-70 border border-slate-100 dark:border-slate-800 shadow-none hover:opacity-100"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-black ${
                                esMiTurno 
                                  ? "bg-red-600 text-white" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}>
                                <Clock className="h-3.5 w-3.5" />
                                {h.HoraInicio} - {h.HoraFin}
                              </div>
                              {esMiTurno && <CheckCircle2 className="h-4 w-4 text-red-600 animate-pulse" />}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                                esMiTurno ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              }`}>
                                <UserCircle className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${esMiTurno ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                                  {h.Nombre} {h.Apellido}
                                </p>
                                <p className="text-[9px] uppercase font-bold text-slate-400">
                                  {h.Especialidad || "Entrenador"}
                                </p>
                              </div>
                            </div>

                            {esMiTurno && (
                              <div className="mt-3 flex items-center justify-center">
                                <div className="h-1 w-full bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                                  <div className="h-full w-full bg-red-600 animate-shimmer" />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-hide::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-hide::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .scrollbar-hide::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </DashboardLayout>
  )
}