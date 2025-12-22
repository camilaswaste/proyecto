"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRightLeft, CreditCard, Pause, Play, XCircle } from "lucide-react"
import type React from "react"
import { useState } from "react"

type MembershipAction = "assign" | "pause" | "cancel" | "resume" | "change" | null

interface PlanMembresia {
  PlanID: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
}

interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  EstadoMembresia: string | null
}

interface MembershipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  socio: Socio | null
  planes: PlanMembresia[]
  selectedPlanID: number
  onPlanChange: (planId: number) => void
  onSubmit: (action: MembershipAction, data?: any) => void
}

export function MembershipModal({
  open,
  onOpenChange,
  socio,
  planes,
  selectedPlanID,
  onPlanChange,
  onSubmit,
}: MembershipModalProps) {
  const [action, setAction] = useState<MembershipAction>(null)
  const [isLoading, setIsLoading] = useState(false)

  const estado = socio?.EstadoMembresia || null

  console.log("[v0] Modal socio:", socio)
  console.log("[v0] EstadoMembresia:", estado)

  const hasActiveMembership = estado === "Vigente"
  const hasSuspendedMembership = estado === "Suspendida"

  console.log("[v0] hasActiveMembership:", hasActiveMembership)
  console.log("[v0] hasSuspendedMembership:", hasSuspendedMembership)

  const canAssign = !hasActiveMembership && !hasSuspendedMembership

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries())

    try {
      await onSubmit(action, data)
    } finally {
      setIsLoading(false)
      resetModal()
    }
  }

  const resetModal = () => {
    setAction(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) setAction(null)
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Gestión de Membresía</DialogTitle>
          <DialogDescription>
            {socio ? `${socio.Nombre} ${socio.Apellido} - ${socio.RUT}` : "Selecciona una acción"}
          </DialogDescription>
        </DialogHeader>

        {/* ===================== MENÚ DE ACCIONES ===================== */}
        {!action ? (
          <div className="grid gap-4 py-4">
            {/* ASIGNAR (solo si NO está vigente ni suspendida) */}
            {canAssign && (
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2 hover:bg-green-50 hover:border-green-300 transition-colors bg-transparent"
                onClick={() => setAction("assign")}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Asignar Membresía</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Asigna un plan de membresía a este socio
                </span>
              </Button>
            )}

            {/* SI ESTÁ VIGENTE: Cambiar + Pausar + Cancelar */}
            {hasActiveMembership && (
              <>
                {/* Cambiar Membresía */}
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors bg-transparent"
                  onClick={() => setAction("change")}
                >
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">Cambiar Membresía</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    Cambia el plan de membresía actual por otro
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors bg-transparent"
                  onClick={() => setAction("pause")}
                >
                  <div className="flex items-center gap-2">
                    <Pause className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-700">Pausar Membresía</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    Pausa temporalmente la membresía activa
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:bg-red-50 hover:border-red-300 transition-colors bg-transparent"
                  onClick={() => setAction("cancel")}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Cancelar Membresía</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    Cancela permanentemente la membresía del socio
                  </span>
                </Button>
              </>
            )}

            {/* SI ESTÁ SUSPENDIDA: Reanudar + Cancelar */}
            {hasSuspendedMembership && (
              <>
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:bg-green-50 hover:border-green-300 transition-colors bg-transparent"
                  onClick={() => setAction("resume")}
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Reanudar Membresía</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">Reactiva la membresía suspendida</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:bg-red-50 hover:border-red-300 transition-colors bg-transparent"
                  onClick={() => setAction("cancel")}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Cancelar Membresía</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    Cancela permanentemente la membresía del socio
                  </span>
                </Button>
              </>
            )}

            {/* Mensajito */}
            {canAssign && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Estado actual: <strong>{estado ?? "Sin membresía"}</strong>. Puedes asignar un nuevo plan.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ===================== FORMULARIOS ===================== */
          <form onSubmit={handleSubmit}>
            {/* ASIGNAR */}
            {action === "assign" && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan de Membresía</Label>
                  <Select
                    name="planID"
                    value={selectedPlanID.toString()}
                    onValueChange={(value) => onPlanChange(Number(value))}
                    required
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                          {plan.NombrePlan} - ${plan.Precio.toLocaleString()} ({plan.DuracionDias} días)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="start-date">Fecha de Inicio</Label>
                  <Input
                    id="start-date"
                    name="startDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>
            )}

            {/* CAMBIAR */}
            {action === "change" && (
              <div className="grid gap-4 py-4">
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm text-purple-800">
                    Esto cambiará el plan de membresía actual del socio. La fecha de inicio será hoy y la duración se
                    calculará según el nuevo plan.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-plan">Nuevo Plan de Membresía</Label>
                  <Select
                    name="planID"
                    value={selectedPlanID.toString()}
                    onValueChange={(value) => onPlanChange(Number(value))}
                    required
                  >
                    <SelectTrigger id="new-plan">
                      <SelectValue placeholder="Selecciona el nuevo plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.PlanID} value={plan.PlanID.toString()}>
                          {plan.NombrePlan} - ${plan.Precio.toLocaleString()} ({plan.DuracionDias} días)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="change-reason">Motivo del Cambio (opcional)</Label>
                  <Textarea
                    id="change-reason"
                    name="changeReason"
                    placeholder="Ej: Solicitud del socio, actualización de plan, etc."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input id="keep-dates" name="keepDates" type="checkbox" />
                  <Label htmlFor="keep-dates">Mantener las fechas de la membresía actual</Label>
                </div>
              </div>
            )}

            {/* PAUSAR */}
            {action === "pause" && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="pause-duration">Duración de la Pausa</Label>
                  <Select name="pauseDuration" required>
                    <SelectTrigger id="pause-duration">
                      <SelectValue placeholder="Selecciona la duración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">1 mes (30 días)</SelectItem>
                      <SelectItem value="60">2 meses (60 días)</SelectItem>
                      <SelectItem value="90">3 meses (90 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pause-reason">Motivo (opcional)</Label>
                  <Textarea id="pause-reason" name="pauseReason" placeholder="Ingresa el motivo de la pausa" rows={3} />
                </div>
              </div>
            )}

            {/* REANUDAR */}
            {action === "resume" && (
              <div className="grid gap-4 py-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-800">Esto reactivará la membresía suspendida.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input id="extend" name="extendVencimiento" type="checkbox" defaultChecked />
                  <Label htmlFor="extend">Extender fecha de vencimiento por los días pausados</Label>
                </div>
              </div>
            )}

            {/* CANCELAR */}
            {action === "cancel" && (
              <div className="grid gap-4 py-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    <strong>Advertencia:</strong> Esta acción cancelará permanentemente la membresía.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cancel-reason">Motivo de Cancelación</Label>
                  <Select name="cancelReason" required>
                    <SelectTrigger id="cancel-reason">
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="request">Solicitado por el socio</SelectItem>
                      <SelectItem value="payment">Problemas de pago</SelectItem>
                      <SelectItem value="violation">Violación de términos</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cancel-notes">Notas Adicionales</Label>
                  <Textarea id="cancel-notes" name="cancelNotes" placeholder="Agrega notas adicionales" rows={3} />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
                Atrás
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
