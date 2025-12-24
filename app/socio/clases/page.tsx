"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, User, Users } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  NombreEntrenador: string
  Especialidad: string
  ReservasActuales: number
}

interface Reservacion {
  ClaseID: number
  FechaClase: string
  Estado: string
}

const formatTime = (timeString: string) => {
  try {
    const date = new Date(timeString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  } catch {
    return timeString
  }
}

export default function SocioClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [fechaClase, setFechaClase] = useState("")

  useEffect(() => {
    fetchClases()
  }, [])

  const fetchClases = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID
      const response = await fetch(`/api/socio/clases?socioID=${socioID}`)
      if (response.ok) {
        const data = await response.json()
        setClases(data.clases)
        setReservaciones(data.reservaciones)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = (clase: Clase) => {
    setSelectedClase(clase)
    const today = new Date()
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    let diff = dias.indexOf(clase.DiaSemana) - today.getDay()
    if (diff <= 0) diff += 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    setFechaClase(next.toISOString().split("T")[0])
    setShowDialog(true)
  }

  const handleSubmitReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClase) return

    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const socioID = user.socioID || user.usuarioID

    const res = await fetch("/api/socio/clases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        socioID,
        claseID: selectedClase.ClaseID,
        fechaClase,
      }),
    })

    if (res.ok) {
      alert("Clase reservada exitosamente")
      setShowDialog(false)
      fetchClases()
    } else {
      alert("Error al reservar clase")
    }
  }

  const diasOrdenados = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <p className="text-center text-muted-foreground">Cargando clases...</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-8">

        {/* HEADER */}
        <div className="rounded-xl bg-white p-8 shadow-sm border-l-8 border-[#00BA70]">
          <h1 className="text-3xl font-bold text-[#007A48]">Clases Grupales</h1>
          <p className="text-[#007A48]">
            Encuentra tu clase ideal y reserva tu lugar
          </p>
        </div>

        {diasOrdenados.map((dia) => {
          const clasesDia = clases.filter(c => c.DiaSemana === dia)
          if (!clasesDia.length) return null

          return (
            <div key={dia} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">{dia}</h2>
                <Badge variant="secondary">{clasesDia.length} clases</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clasesDia.map(clase => {
                  const cupos = clase.CupoMaximo - clase.ReservasActuales
                  const llena = cupos === 0
                  const pocos = cupos > 0 && cupos <= 3

                  return (
                    <Card key={clase.ClaseID} className="relative border hover:shadow-lg transition">
                      <div className="absolute left-0 top-0 h-full w-1 bg-[#00BA70]" />

                      <CardHeader>
                        <CardTitle>{clase.NombreClase}</CardTitle>
                        {clase.Descripcion && (
                          <CardDescription>{clase.Descripcion}</CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-[#B1121A]" />
                          {formatTime(clase.HoraInicio)} – {formatTime(clase.HoraFin)}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-[#B1121A]" />
                          {clase.NombreEntrenador}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span className={
                            llena ? "text-red-600" : pocos ? "text-orange-600" : "text-green-600"
                          }>
                            {llena ? "Clase llena" : `${cupos} cupos disponibles`}
                          </span>
                        </div>

                        <Button
                          disabled={llena}
                          onClick={() => handleReservar(clase)}
                          className={`w-full border-2 border-[#B1121A] text-[#B1121A] bg-red-50 hover:bg-[#B1121A] hover:text-white transition`}
                        >
                          {llena ? "No disponible" : "Reservar ahora"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* DIALOG */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="text-[#B1121A]" />
                Reservar clase
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitReserva} className="space-y-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fechaClase}
                  onChange={(e) => setFechaClase(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#B1121A] hover:bg-[#8E0E14]">
                  Confirmar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
