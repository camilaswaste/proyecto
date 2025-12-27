"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"

interface Notificacion {
  NotificacionID: number
  TipoEvento: string
  Titulo: string
  Mensaje: string
  Leida: boolean
  FechaCreacion: string
}

interface NotificationsDropdownProps {
  tipoUsuario: "Admin" | "Entrenador" | "Socio"
  usuarioID?: number
}

export function NotificationsDropdown({ tipoUsuario, usuarioID }: NotificationsDropdownProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotificaciones = async () => {
    try {
      const params = new URLSearchParams({ tipoUsuario })
      if (usuarioID) params.append("usuarioID", usuarioID.toString())

      const response = await fetch(`/api/notificaciones?${params}`)
      const data = await response.json()

      if (data.notificaciones) {
        setNotificaciones(data.notificaciones)
        setNoLeidas(data.notificaciones.filter((n: Notificacion) => !n.Leida).length)
      }
    } catch (error) {
      console.error("[v0] Error al cargar notificaciones:", error)
    }
  }

  useEffect(() => {
    fetchNotificaciones()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000)
    return () => clearInterval(interval)
  }, [tipoUsuario, usuarioID])

  const marcarComoLeida = async (notificacionID: number) => {
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificacionID }),
      })
      fetchNotificaciones()
    } catch (error) {
      console.error("[v0] Error al marcar como leída:", error)
    }
  }

  const marcarTodasLeidas = async () => {
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcarTodasLeidas: true,
          tipoUsuario,
          usuarioID,
        }),
      })
      fetchNotificaciones()
    } catch (error) {
      console.error("[v0] Error al marcar todas como leídas:", error)
    }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha)
    const ahora = new Date()
    const diff = ahora.getTime() - date.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (minutos < 1) return "Ahora"
    if (minutos < 60) return `Hace ${minutos}m`
    if (horas < 24) return `Hace ${horas}h`
    if (dias < 7) return `Hace ${dias}d`
    return date.toLocaleDateString("es-CL")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {noLeidas > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={marcarTodasLeidas}>
              Marcar todas leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notificaciones.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
          ) : (
            notificaciones.map((notif) => (
              <DropdownMenuItem
                key={notif.NotificacionID}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notif.Leida ? "bg-accent/50" : ""}`}
                onClick={() => {
                  if (!notif.Leida) {
                    marcarComoLeida(notif.NotificacionID)
                  }
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notif.Titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.Mensaje}</p>
                  </div>
                  {!notif.Leida && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground mt-1">{formatFecha(notif.FechaCreacion)}</span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
