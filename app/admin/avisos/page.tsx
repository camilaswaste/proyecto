"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getUser } from "@/lib/auth-client"
import { AlertCircle, Bell, Calendar, Edit, Plus, Trash2, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface Aviso {
  AvisoID: number
  Titulo: string
  Mensaje: string
  TipoAviso: string
  Destinatarios: string
  FechaInicio: string
  FechaFin: string | null
  Activo: boolean
  FechaCreacion: string
  CreadoPorNombre: string | null
}

type TipoKey = "Mantenimiento" | "Evento" | "Horario" | "General" | "Urgente"

const tipoStyles: Record<
  TipoKey,
  {
    badge: string
    accent: string
    iconWrap: string
    icon: string
  }
> = {
  General: {
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
    accent: "bg-zinc-300/80",
    iconWrap: "bg-zinc-500/10 ring-zinc-500/20",
    icon: "text-zinc-700",
  },
  Mantenimiento: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    accent: "bg-amber-400/80",
    iconWrap: "bg-amber-500/10 ring-amber-500/20",
    icon: "text-amber-700",
  },
  Evento: {
    badge: "border-sky-200 bg-sky-50 text-sky-800",
    accent: "bg-sky-400/80",
    iconWrap: "bg-sky-500/10 ring-sky-500/20",
    icon: "text-sky-700",
  },
  Horario: {
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    accent: "bg-violet-400/80",
    iconWrap: "bg-violet-500/10 ring-violet-500/20",
    icon: "text-violet-700",
  },
  Urgente: {
    badge: "border-red-200 bg-red-50 text-red-800",
    accent: "bg-red-500/80",
    iconWrap: "bg-red-500/10 ring-red-500/20",
    icon: "text-red-700",
  },
}

const estadoStyles = (activo: boolean) =>
  activo ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-50 text-zinc-700"

export default function AdminAvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null)
  const [usuarioID, setUsuarioID] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    titulo: "",
    mensaje: "",
    tipoAviso: "General",
    destinatarios: "Todos",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    activo: true,
  })

  useEffect(() => {
    fetchAvisos()
    fetchUsuarioID()
  }, [])

  const fetchUsuarioID = async () => {
    const user = await getUser()
    if (user && user.usuarioID) setUsuarioID(user.usuarioID)
  }

  const fetchAvisos = async () => {
    try {
      const response = await fetch("/api/avisos")
      if (response.ok) {
        const data = await response.json()
        setAvisos(data)
      }
    } catch (error) {
      console.error("Error al cargar avisos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (aviso?: Aviso) => {
    if (aviso) {
      setEditingAviso(aviso)
      setFormData({
        titulo: aviso.Titulo,
        mensaje: aviso.Mensaje,
        tipoAviso: aviso.TipoAviso,
        destinatarios: aviso.Destinatarios,
        fechaInicio: aviso.FechaInicio.split("T")[0],
        fechaFin: aviso.FechaFin ? aviso.FechaFin.split("T")[0] : "",
        activo: aviso.Activo,
      })
    } else {
      setEditingAviso(null)
      setFormData({
        titulo: "",
        mensaje: "",
        tipoAviso: "General",
        destinatarios: "Todos",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: "",
        activo: true,
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const body = editingAviso ? { ...formData, avisoID: editingAviso.AvisoID } : { ...formData, usuarioID }
      const url = "/api/avisos"
      const method = editingAviso ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchAvisos()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar aviso")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar aviso")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este aviso?")) return
    try {
      const response = await fetch(`/api/avisos?avisoID=${id}`, { method: "DELETE" })
      if (response.ok) fetchAvisos()
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const stats = useMemo(() => {
    return {
      total: avisos.length,
      activos: avisos.filter((a) => a.Activo).length,
      paraSocios: avisos.filter((a) => a.Destinatarios === "Socios" || a.Destinatarios === "Todos").length,
    }
  }, [avisos])

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    tone = "zinc",
  }: {
    title: string
    value: React.ReactNode
    subtitle: string
    icon: any
    tone?: "zinc" | "emerald" | "sky"
  }) => {
    const tones: Record<string, { wrap: string; icon: string; value: string }> = {
      zinc: {
        wrap: "bg-zinc-500/10 ring-zinc-500/20",
        icon: "text-zinc-700",
        value: "text-foreground",
      },
      emerald: {
        wrap: "bg-emerald-500/10 ring-emerald-500/20",
        icon: "text-emerald-700",
        value: "text-emerald-700",
      },
      sky: {
        wrap: "bg-sky-500/10 ring-sky-500/20",
        icon: "text-sky-700",
        value: "text-sky-700",
      },
    }

    return (
      <Card className="relative overflow-hidden border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <div className={`text-3xl font-bold leading-none ${tones[tone].value}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ring-1 ${tones[tone].wrap}`}>
              <Icon className={`h-5 w-5 ${tones[tone].icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando avisos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Avisos Generales</h1>
            <p className="text-muted-foreground">Publica avisos importantes para socios y entrenadores</p>
          </div>

          <Button className="shadow-sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Aviso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total de avisos" value={stats.total} subtitle="Avisos publicados" icon={Bell} tone="zinc" />
          <StatCard
            title="Activos"
            value={stats.activos}
            subtitle="Visibles actualmente"
            icon={AlertCircle}
            tone="emerald"
          />
          <StatCard title="Para socios" value={stats.paraSocios} subtitle="Dirigidos a socios" icon={Users} tone="sky" />
        </div>

        {/* List */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl">Avisos Publicados</CardTitle>
            <CardDescription>Total: {avisos.length} avisos</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {avisos.length === 0 ? (
              <div className="rounded-xl border bg-muted/20 p-10 text-center">
                <p className="text-sm text-muted-foreground">No hay avisos publicados</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear el primer aviso
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {avisos.map((aviso) => {
                  const tipoKey = (aviso.TipoAviso as TipoKey) in tipoStyles ? (aviso.TipoAviso as TipoKey) : "General"
                  const t = tipoStyles[tipoKey]

                  return (
                    <div
                      key={aviso.AvisoID}
                      className="group relative overflow-hidden rounded-xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Accent bar */}
                      <div className={`absolute left-0 top-0 h-full w-1 ${t.accent}`} />

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-9 w-9 rounded-xl ring-1 flex items-center justify-center ${t.iconWrap}`}>
                                <Bell className={`h-4 w-4 ${t.icon}`} />
                              </div>
                              <h3 className="font-semibold text-lg leading-tight truncate">{aviso.Titulo}</h3>
                            </div>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${t.badge}`}
                            >
                              {aviso.TipoAviso}
                            </span>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${estadoStyles(
                                aviso.Activo,
                              )}`}
                            >
                              {aviso.Activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{aviso.Mensaje}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              {aviso.Destinatarios}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(aviso.FechaInicio).toLocaleDateString("es-CL")}
                              {aviso.FechaFin && ` - ${new Date(aviso.FechaFin).toLocaleDateString("es-CL")}`}
                            </span>

                            {aviso.CreadoPorNombre && <span>Por: {aviso.CreadoPorNombre}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(aviso)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(aviso.AvisoID)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingAviso ? "Editar Aviso" : "Nuevo Aviso"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título del aviso</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                maxLength={200}
                placeholder="Ej: Cambio de horario por feriado"
              />
              <p className="text-xs text-muted-foreground">Máximo 200 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                required
                rows={6}
                placeholder="Escribe el detalle del aviso para socios/entrenadores..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoAviso">Tipo de aviso</Label>
                <select
                  id="tipoAviso"
                  value={formData.tipoAviso}
                  onChange={(e) => setFormData({ ...formData, tipoAviso: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="General">General</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Evento">Evento</option>
                  <option value="Horario">Horario Especial</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatarios">Destinatarios</Label>
                <select
                  id="destinatarios"
                  value={formData.destinatarios}
                  onChange={(e) => setFormData({ ...formData, destinatarios: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="Todos">Todos</option>
                  <option value="Socios">Solo Socios</option>
                  <option value="Entrenadores">Solo Entrenadores</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha de fin (opcional)</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  min={formData.fechaInicio}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="activo" className="text-sm">
                  Aviso activo
                </Label>
                <p className="text-xs text-muted-foreground">Si está desactivado, no se mostrará a los usuarios.</p>
              </div>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingAviso ? "Actualizar" : "Crear"} Aviso</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}