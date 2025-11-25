"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, QrCode as QrCodeIcon } from "lucide-react"
import { CreditCard } from "lucide-react"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { useRouter } from "next/navigation"


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
  Email: string
  Telefono: string
  FechaNacimiento?: string
  Direccion?: string
  EstadoSocio: string
  CodigoQR: string
  NombrePlan: string | null
  EstadoMembresia: string | null
  FechaInicio: string | null
  FechaFin: string | null

}

export default function AdminSociosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  const [showDialog, setShowDialog] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrSocio, setQrSocio] = useState<Socio | null>(null)
  const [formData, setFormData] = useState({
    RUT: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Telefono: "",
    FechaNacimiento: "",
    Direccion: "",
    EstadoSocio: "Activo",
  })

  const [showMembresiaDialog, setShowMembresiaDialog] = useState(false);
  const [membresiaSocio, setMembresiaSocio] = useState<Socio | null>(null);
  const [planes, setPlanes] = useState<PlanMembresia[]>([]);
  const [selectedPlanID, setSelectedPlanID] = useState<number>(0);

  useEffect(() => {
    fetchSocios()
    fetchPlanes()
  }, [])

  const fetchSocios = async () => {
    try {
      const response = await fetch("/api/admin/socios")
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

  // Added form handlers for creating and editing socios
  const handleOpenDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio)
      setFormData({
        RUT: socio.RUT,
        Nombre: socio.Nombre,
        Apellido: socio.Apellido,
        Email: socio.Email,
        Telefono: socio.Telefono || "",
        FechaNacimiento: socio.FechaNacimiento || "",
        Direccion: socio.Direccion || "",
        EstadoSocio: socio.EstadoSocio,
      })
    } else {
      setEditingSocio(null)
      setFormData({
        RUT: "",
        Nombre: "",
        Apellido: "",
        Email: "",
        Telefono: "",
        FechaNacimiento: "",
        Direccion: "",
        EstadoSocio: "Activo",
      })
    }
    setShowDialog(true)
  }
  const handleOpenQrDialog = (socio: Socio) => {
    setQrSocio(socio)
    setShowQrDialog(true)
  }

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/admin/membresias")
      if (response.ok) {
        const data = await response.json()
        const activePlanes = data.filter((p: PlanMembresia & { Activo: boolean }) => p.Activo)
        setPlanes(activePlanes)
        if (activePlanes.length > 0) {
          setSelectedPlanID(activePlanes[0].PlanID)
        }
      }
    } catch (error) {
      console.error("Error al cargar planes:", error)
    }
  }


  const handleOpenMembresiaDialog = (socio: Socio) => {
    setMembresiaSocio(socio)
    if (planes.length > 0) {
      setSelectedPlanID(planes[0].PlanID);
    } else {
      setSelectedPlanID(0);
    }
    setShowMembresiaDialog(true)
  }

  const handleProcederPago = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!membresiaSocio || selectedPlanID === 0) {
      alert("Error: Selección inválida.")
      return
    }

    try {
      // 1. Llamamos al endpoint que SOLO registra el pago (Estado: Pendiente)
      const response = await fetch("/api/socio/membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID: membresiaSocio.SocioID,
          planID: selectedPlanID,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowMembresiaDialog(false)

        // 2. Si tenemos éxito, redirigimos a la página de comprobante usando el pagoID retornado
        if (result.pagoID) {
          router.push(`/admin/pagos/${result.pagoID}`)
        } else {
          alert("Error: El sistema no retornó un ID de pago válido.")
        }
      } else {
        const error = await response.json()
        alert(`Error al registrar el pago: ${error.error || "Error desconocido"}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error de conexión al procesar el pago.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validationResponse = await fetch("/api/auth/validate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.Email,
          rut: formData.RUT,
          excludeId: editingSocio?.SocioID,
          userType: "Socio",
        }),
      })

      const validationResult = await validationResponse.json()
      if (!validationResult.valid) {
        alert(validationResult.errors.join("\n"))
        return
      }

      const body = editingSocio ? { ...formData, socioID: editingSocio.SocioID } : formData

      const url = "/api/admin/socios"
      const method = editingSocio ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        if (!editingSocio && result.tempPassword) {
          alert(
            `Socio creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.Email}\nContraseña temporal: ${result.tempPassword}\n\nIMPORTANTE: El socio debe cambiar su contraseña al iniciar sesión por primera vez.\nPor favor, comparte estas credenciales de forma segura.`,
          )
        } else if (editingSocio) {
          alert("Socio actualizado exitosamente")
        }
        setShowDialog(false)
        fetchSocios()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar socio")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar socio")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este socio?")) return

    try {
      const response = await fetch(`/api/admin/socios?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchSocios()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredSocios = socios.filter(
    (socio) =>
      socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // Formatear la fecha a un formato legible
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Error';
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando socios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Socios</h1>
            <p className="text-muted-foreground">Administra los miembros del gimnasio</p>
          </div>
          {/* Added onClick handler to open dialog */}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Socio
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Socios</CardTitle>
            <CardDescription>Total: {socios.length} socios registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">RUT</th>
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Plan/Estado</th>
                      <th className="text-left p-3 font-medium">Inicio Plan</th>
                      <th className="text-left p-3 font-medium">Fin Plan</th>
                      <th className="text-left p-3 font-medium">Teléfono</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">QR</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSocios.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No se encontraron socios
                        </td>
                      </tr>
                    ) : (
                      filteredSocios.map((socio) => (
                        <tr key={socio.SocioID} className="border-t">
                          <td className="p-3">{socio.RUT}</td>
                          <td className="p-3">
                            {socio.Nombre} {socio.Apellido}
                          </td>
                          <td className="p-3">{socio.Email}</td>
                          <td className="p-3">
                            {/* Mostrar Plan y Estado de Membresía */}
                            <p className="font-medium text-sm">
                              {socio.NombrePlan || "Sin Plan"}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${socio.EstadoMembresia === "Vigente" ? "bg-green-100 text-green-800" :
                                socio.EstadoMembresia === "Vencida" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {socio.EstadoMembresia || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            {/* Mostrar fecha de inicio */}
                            <p className="text-sm">{formatDate(socio.FechaInicio)}</p>
                          </td>
                          <td className="p-3">
                            {/* Mostrar fecha de fin */}
                            <p className="text-sm">{formatDate(socio.FechaFin)}</p>
                          </td>
                          <td className="p-3">{socio.Telefono || "N/A"}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${socio.EstadoSocio === "Activo"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >

                              {socio.EstadoSocio}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenQrDialog(socio)} disabled={!socio.CodigoQR}>
                              <QrCodeIcon className={`h-4 w-4 ${socio.CodigoQR ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {/* Added onClick handlers for edit and delete */}
                              <Button variant="ghost" size="icon" onClick={() => handleOpenMembresiaDialog(socio)}>
                                <CreditCard className="h-4 w-4 blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(socio)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(socio.SocioID)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Added dialog form for creating/editing socios */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSocio ? "Editar Socio" : "Nuevo Socio"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="RUT">RUT *</Label>
                  <Input
                    id="RUT"
                    value={formData.RUT}
                    onChange={(e) => setFormData({ ...formData, RUT: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="FechaNacimiento"
                    type="date"
                    value={formData.FechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, FechaNacimiento: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="Nombre">Nombre *</Label>
                  <Input
                    id="Nombre"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="Apellido">Apellido *</Label>
                  <Input
                    id="Apellido"
                    value={formData.Apellido}
                    onChange={(e) => setFormData({ ...formData, Apellido: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="Email">Email *</Label>
                <Input
                  id="Email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="Telefono">Teléfono</Label>
                <Input
                  id="Telefono"
                  value={formData.Telefono}
                  onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="Direccion">Dirección</Label>
                <Input
                  id="Direccion"
                  value={formData.Direccion}
                  onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="EstadoSocio">Estado</Label>
                <select
                  id="EstadoSocio"
                  value={formData.EstadoSocio}
                  onChange={(e) => setFormData({ ...formData, EstadoSocio: e.target.value })}
                  className="w-full border rounded-md p-2"
                >

                  <option value="Suspendido">Suspendido</option>
                  <option value="Moroso">Moroso</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Activo">Activo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingSocio ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Código QR de Acceso</DialogTitle>
              <DialogClose onClose={() => setShowQrDialog(false)} />
            </DialogHeader>
            {qrSocio && (
              <div className="flex flex-col items-center space-y-4 p-4">
                <p className="text-center text-lg font-semibold">
                  {qrSocio.Nombre} {qrSocio.Apellido} ({qrSocio.RUT})
                </p>
                {qrSocio.CodigoQR ? (
                  <>
                    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-xl">
                      <QrCodeQuickChart
                        value={qrSocio.CodigoQR} // Pasamos el valor único
                        size={256}               // Opcional: define el tamaño
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Este código se usa para el control de acceso.
                    </p>
                  </>
                ) : (
                  <p className="text-red-500">Este socio no tiene un Código QR asignado.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showMembresiaDialog} onOpenChange={setShowMembresiaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Proceder al Pago para {membresiaSocio?.Nombre} {membresiaSocio?.Apellido}</DialogTitle>
              <DialogClose onClose={() => setShowMembresiaDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleProcederPago} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Plan actual:
                <span className={`font-semibold ml-1 ${membresiaSocio?.EstadoMembresia === 'Vigente' ? 'text-green-600' : 'text-red-600'}`}>
                  {membresiaSocio?.NombrePlan || "Sin Plan"} ({membresiaSocio?.EstadoMembresia || "N/A"})
                </span>
              </p>

              <div>
                <Label htmlFor="selectedPlanID">Seleccionar Plan *</Label>
                <select
                  id="selectedPlanID"
                  value={selectedPlanID === 0 ? '' : selectedPlanID}
                  onChange={(e) => setSelectedPlanID(parseInt(e.target.value))}
                  className="w-full border rounded-md p-2"
                  required
                >
                  {selectedPlanID === 0 && planes.length > 0 && (
                    <option value="" disabled>Seleccione un plan</option>
                  )}
                  {planes.length === 0 ? (
                    <option value="" disabled>Cargando planes...</option>
                  ) : (
                    planes.map((plan) => (
                      <option key={plan.PlanID} value={plan.PlanID}>
                        {plan.NombrePlan} (${plan.Precio.toLocaleString()} / {plan.DuracionDias} días)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowMembresiaDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={selectedPlanID === 0}
                >
                  Proceder al Pago
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
