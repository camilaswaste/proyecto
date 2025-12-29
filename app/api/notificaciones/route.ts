import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipoUsuario = searchParams.get("tipoUsuario")
    const usuarioID = searchParams.get("usuarioID")

    if (!tipoUsuario) {
      return NextResponse.json({ error: "TipoUsuario es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    let notificaciones

    if (tipoUsuario === "Admin") {
      const result = await pool
        .request()
        .input("tipoUsuario", tipoUsuario)
        .query(`
          SELECT TOP 100
            NotificacionID,
            TipoEvento,
            Titulo,
            Mensaje,
            Leida,
            FechaCreacion
          FROM Notificaciones
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
          ORDER BY FechaCreacion DESC
        `)
      notificaciones = result.recordset
    } else {
      if (!usuarioID) {
        return NextResponse.json({ error: "UsuarioID es requerido para Entrenador/Socio" }, { status: 400 })
      }

      const result = await pool
        .request()
        .input("tipoUsuario", tipoUsuario)
        .input("usuarioID", Number.parseInt(usuarioID))
        .query(`
          SELECT TOP 100
            NotificacionID,
            TipoEvento,
            Titulo,
            Mensaje,
            Leida,
            FechaCreacion
          FROM Notificaciones
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
          ORDER BY FechaCreacion DESC
        `)
      notificaciones = result.recordset
    }

    const notificacionesFormateadas = notificaciones.map((n: any) => ({
      ...n,
      FechaCreacion: n.FechaCreacion.toISOString(),
    }))

    return NextResponse.json({ notificaciones: notificacionesFormateadas })
  } catch (error: any) {
    console.error("Error al obtener notificaciones:", error)

    if (error.code === "ETIMEOUT") {
      console.warn("⚠️ Timeout en notificaciones - devolviendo array vacío. EJECUTA LOS ÍNDICES URGENTE.")
      return NextResponse.json({
        notificaciones: [],
        warning: "Timeout - Necesitas agregar índices a la tabla Notificaciones",
      })
    }

    return NextResponse.json(
      {
        error: "Error al obtener notificaciones",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificacionID, marcarTodasLeidas, tipoUsuario, usuarioID } = body

    const pool = await getConnection()

    if (marcarTodasLeidas) {
      if (tipoUsuario === "Admin") {
        await pool
          .request()
          .input("tipoUsuario", tipoUsuario)
          .query(`
          UPDATE Notificaciones
          SET Leida = 1
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
        `)
      } else {
        await pool
          .request()
          .input("tipoUsuario", tipoUsuario)
          .input("usuarioID", usuarioID)
          .query(`
          UPDATE Notificaciones
          SET Leida = 1
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
        `)
      }

      return NextResponse.json({ success: true })
    } else if (notificacionID) {
      await pool
        .request()
        .input("notificacionID", notificacionID)
        .query(`
        UPDATE Notificaciones
        SET Leida = 1
        WHERE NotificacionID = @notificacionID
      `)

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error al actualizar notificaciones:", error)
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 })
  }
}
