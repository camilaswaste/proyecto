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
import { useEffect, useState } from "react"

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
    if (user && user.usuarioID) {
      setUsuarioID(user.usuarioID)
    }
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
      const response = await fetch(`/api/avisos?avisoID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchAvisos()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const getTipoAvisoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      Mantenimiento: "bg-yellow-100 text-yellow-800",
      Evento: "bg-blue-100 text-blue-800",
      Horario: "bg-purple-100 text-purple-800",
      General: "bg-gray-100 text-gray-800",
      Urgente: "bg-red-100 text-red-800",
    }
    return colors[tipo] || colors.General
  }

  const stats = {
    total: avisos.length,
    activos: avisos.filter((a) => a.Activo).length,
    paraSocios: avisos.filter((a) => a.Destinatarios === "Socios" || a.Destinatarios === "Todos").length,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Avisos Generales</h1>
            <p className="text-muted-foreground">Publica avisos importantes para socios y entrenadores</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Aviso
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Avisos</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Avisos publicados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avisos Activos</CardTitle>
              <AlertCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
              <p className="text-xs text-muted-foreground">Visibles actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Para Socios</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.paraSocios}</div>
              <p className="text-xs text-muted-foreground">Avisos para socios</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Avisos Publicados</CardTitle>
            <CardDescription>Total: {avisos.length} avisos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {avisos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay avisos publicados</p>
              ) : (
                avisos.map((aviso) => (
                  <div key={aviso.AvisoID} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{aviso.Titulo}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoAvisoBadge(aviso.TipoAviso)}`}
                          >
                            {aviso.TipoAviso}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              aviso.Activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {aviso.Activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{aviso.Mensaje}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {aviso.Destinatarios}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(aviso.FechaInicio).toLocaleDateString("es-CL")}
                            {aviso.FechaFin && ` - ${new Date(aviso.FechaFin).toLocaleDateString("es-CL")}`}
                          </span>
                          {aviso.CreadoPorNombre && <span>Por: {aviso.CreadoPorNombre}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(aviso)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(aviso.AvisoID)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAviso ? "Editar Aviso" : "Nuevo Aviso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título del Aviso</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                required
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoAviso">Tipo de Aviso</Label>
                <select
                  id="tipoAviso"
                  value={formData.tipoAviso}
                  onChange={(e) => setFormData({ ...formData, tipoAviso: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  required
                >
                  <option value="General">General</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Evento">Evento</option>
                  <option value="Horario">Horario Especial</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div>
                <Label htmlFor="destinatarios">Destinatarios</Label>
                <select
                  id="destinatarios"
                  value={formData.destinatarios}
                  onChange={(e) => setFormData({ ...formData, destinatarios: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  required
                >
                  <option value="Todos">Todos</option>
                  <option value="Socios">Solo Socios</option>
                  <option value="Entrenadores">Solo Entrenadores</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="fechaFin">Fecha de Fin (opcional)</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Aviso Activo</Label>
            </div>

            <div className="flex gap-2 justify-end">
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
