"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"

interface Notificacion {
  NotificacionID: number
  Titulo: string
  Mensaje: string
  Leida: boolean
  FechaCreacion: string
}

interface Params {
  tipoUsuario: "Admin" | "Socio" | "Entrenador"
  usuarioID?: number
}

export function useNotificationToast({ tipoUsuario, usuarioID }: Params) {
  const lastShownId = useRef<number | null>(null)

  useEffect(() => {
    // Si no es Admin y no hay usuarioID, no ejecutamos
    if (tipoUsuario !== "Admin" && !usuarioID) return;

    const fetchNotificaciones = async () => {
      try {
        const params = new URLSearchParams({ tipoUsuario })
        if (usuarioID) params.append("usuarioID", String(usuarioID))

        const res = await fetch(`/api/notificaciones?${params.toString()}`)
        const data = await res.json()

        // Según tu route.ts, la respuesta es el array directo o un objeto con notificaciones
        const lista: Notificacion[] = Array.isArray(data) ? data : (data.notificaciones ?? [])
        
        if (lista.length === 0) return

        const ultima = lista[0] // La más reciente por el ORDER BY FechaCreacion DESC

        // Solo mostrar si no es la que ya mostramos y no está leída
        if (!ultima.Leida && ultima.NotificacionID !== lastShownId.current) {
          lastShownId.current = ultima.NotificacionID

          toast({
            title: ultima.Titulo,
            description: ultima.Mensaje,
            duration: 5000,
            // Estilo visual mejorado para destacar sobre otros toasts
            className: "border-l-4 border-l-red-600 bg-white dark:bg-slate-950 shadow-2xl",
          })
        }
      } catch (error) {
        console.error("Error fetching notifications toast:", error)
      }
    }

    // Ejecución inmediata y luego intervalo
    fetchNotificaciones()
    const interval = setInterval(fetchNotificaciones, 5000)

    return () => clearInterval(interval)
  }, [tipoUsuario, usuarioID])
}