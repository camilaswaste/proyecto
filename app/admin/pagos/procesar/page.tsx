//admin/pagos/procesar/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Banknote, CreditCard, Smartphone, Loader2, CheckCircle2, User } from "lucide-react"
import Link from "next/link"

interface Socio {
  SocioID: number
  Nombre: string
  Apellido: string
  RUT: string
  Email: string
}

interface Plan {
  PlanID: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
}

const METODOS_PAGO = [
  { id: "Efectivo", nombre: "Efectivo", icon: Banknote, color: "bg-emerald-500", hoverColor: "hover:bg-emerald-600" },
  {
    id: "Tarjeta",
    nombre: "Tarjeta Crédito/Débito",
    icon: CreditCard,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
  },
  {
    id: "Transferencia",
    nombre: "Transferencia",
    icon: Smartphone,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
  },
]

function ProcesarPagoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const socioID = searchParams.get("socioID")
  const planID = searchParams.get("planID")

  const [socio, setSocio] = useState<Socio | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [medioPago, setMedioPago] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (planID) fetchPlan()
    if (socioID) fetchSocio()
  }, [planID, socioID])

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/admin/membresias?id=${planID}`)
      if (response.ok) {
        const data = await response.json()
        const selectedPlan = Array.isArray(data) ? data.find((p: Plan) => p.PlanID === Number(planID)) : data
        if (selectedPlan) setPlan(selectedPlan)
        else setError("Plan no encontrado")
      }
    } catch (err) {
      console.error("Error al cargar plan:", err)
    }
  }

  const fetchSocio = async () => {
    try {
      const response = await fetch(`/api/admin/socios?id=${socioID}`)
      if (response.ok) {
        const data = await response.json()
        setSocio(data)
      }
    } catch (err) {
      console.error("Error al cargar socio:", err)
    }
  }

  const handleProcesarPago = async () => {
    if (!medioPago) {
      setError("Por favor selecciona un método de pago")
      return
    }

    if (!socio || !plan) {
      setError("Faltan datos del socio o del plan")
      return
    }

    setLoading(true)
    setError("")

    try {
      const pagoResponse = await fetch("/api/admin/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID: socio.SocioID,
          monto: plan.Precio,
          metodoPago: medioPago,
          concepto: `Membresía - ${plan.NombrePlan}`,
        }),
      })

      if (!pagoResponse.ok) {
        throw new Error("Error al registrar el pago")
      }

      const pagoData = await pagoResponse.json()

      const membresiaResponse = await fetch("/api/admin/membresias/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID: socio.SocioID,
          planID: plan.PlanID,
          pagoID: pagoData.pagoID,
        }),
      })

      if (!membresiaResponse.ok) {
        const errData = await membresiaResponse.json().catch(() => ({}))

        // Caso esperado: socio ya tiene una membresía Vigente
        if (membresiaResponse.status === 409) {
          setError(errData.error || "El socio ya tiene una membresía vigente.")
          return
        }

        throw new Error(errData.error || "Error al asignar la membresía")
      }


      router.push(`/admin/pagos/${pagoData.pagoID}`)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  if (!socio || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              <p className="font-semibold">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-slate-600 font-medium">Cargando información...</p>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <Link href="/admin/socios">
            <Button
              variant="ghost"
              className="mb-6 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Procesar Pago
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Confirma los detalles de la transacción y selecciona el método de pago
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Socio */}
          <Card className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-200/60 dark:border-white/10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-600/20">
                  <User className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </span>
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {socio.Nombre} {socio.Apellido}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{socio.RUT}</p>
                  {socio.Email && <p className="text-xs text-slate-400 dark:text-slate-500">{socio.Email}</p>}
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/15 to-indigo-600/10 border border-blue-600/20 text-blue-700 dark:text-blue-200 font-bold text-lg">
                    {socio.Nombre[0]}
                    {socio.Apellido[0]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card className="rounded-2xl border border-blue-200/60 dark:border-blue-500/20 bg-gradient-to-br from-white to-blue-50/40 dark:from-white/5 dark:to-blue-500/5 backdrop-blur shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600/70 via-indigo-600/60 to-purple-600/60" />
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {plan.NombrePlan}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-200 border border-blue-600/20">
                        {plan.DuracionDias} días
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/5 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10">
                        Plan #{plan.PlanID}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total
                    </p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-300 tabular-nums">
                      ${plan.Precio.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estás a punto de registrar un pago y asignar la membresía seleccionada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métodos */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Seleccionar Método de Pago
            </label>

            <div className="grid gap-3">
              {METODOS_PAGO.map(({ id, nombre, icon: Icon, color, hoverColor }) => (
                <button
                  key={id}
                  onClick={() => setMedioPago(id)}
                  className={`group relative w-full p-5 rounded-2xl border transition-all duration-200 text-left ${medioPago === id
                      ? "border-blue-500/70 bg-blue-50/80 dark:bg-blue-500/10 shadow-md"
                      : "border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${color} ${hoverColor} transition-colors shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div
                        className={`font-semibold ${medioPago === id ? "text-blue-950 dark:text-blue-100" : "text-slate-800 dark:text-slate-100"
                          }`}
                      >
                        {nombre}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Selecciona para continuar
                      </div>
                    </div>

                    {medioPago === id && (
                      <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-300 animate-in fade-in zoom-in duration-200" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-700 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-200 text-sm">Error al procesar</p>
                  <p className="text-red-800 dark:text-red-200/90 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleProcesarPago}
            disabled={loading || !medioPago}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-60 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando pago...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Confirmar Pago de ${plan.Precio.toLocaleString("es-CL")}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProcesarPagoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <ProcesarPagoContent />
    </Suspense>
  )
}