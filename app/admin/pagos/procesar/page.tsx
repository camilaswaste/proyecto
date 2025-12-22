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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/socios">
            <Button variant="ghost" className="mb-6 hover:bg-white/80 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Procesar Pago</h1>
            <p className="text-slate-600">Confirma los detalles de la transacción</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-900">
                    {socio.Nombre} {socio.Apellido}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">{socio.RUT}</p>
                  {socio.Email && <p className="text-xs text-slate-400">{socio.Email}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {socio.Nombre[0]}
                    {socio.Apellido[0]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200/60 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50/30 backdrop-blur">
            <CardHeader className="pb-3 border-b border-blue-100">
              <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{plan.NombrePlan}</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {plan.DuracionDias} días
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</p>
                    <p className="text-4xl font-bold text-blue-600 tabular-nums">
                      ${plan.Precio.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Plan ID:</span>
                    <span className="font-mono font-medium text-slate-900">#{plan.PlanID}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide">
              Seleccionar Método de Pago
            </label>
            <div className="grid gap-3">
              {METODOS_PAGO.map(({ id, nombre, icon: Icon, color, hoverColor }) => (
                <button
                  key={id}
                  onClick={() => setMedioPago(id)}
                  className={`group relative p-5 rounded-xl border-2 transition-all duration-200 ${
                    medioPago === id
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${color} ${hoverColor} transition-colors shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span
                        className={`font-semibold text-base ${
                          medioPago === id ? "text-blue-900" : "text-slate-700 group-hover:text-slate-900"
                        }`}
                      >
                        {nombre}
                      </span>
                    </div>
                    {medioPago === id && (
                      <CheckCircle2 className="h-6 w-6 text-blue-600 animate-in fade-in zoom-in duration-200" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 text-sm">Error al procesar</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleProcesarPago}
            disabled={loading || !medioPago}
            className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
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