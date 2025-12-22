import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipoUsuario = searchParams.get("tipoUsuario")
    const usuarioID = searchParams.get("usuarioID")

    if (!tipoUsuario) {
      return NextResponse.json({ error: "TipoUsuario es requerido" }, { status: 400 })
    }

    const pool = await getConnection()
    
    // 1. Usamos TOP 20 para no saturar la conexión si hay muchas notificaciones
    let query = `
      SELECT TOP 20
        NotificacionID,
        TipoEvento,
        Titulo,
        Mensaje,
        Leida,
        FechaCreacion
      FROM Notificaciones
      WHERE TipoUsuario = @tipoUsuario
    `

    const requestSql = pool.request().input("tipoUsuario", sql.NVarChar, tipoUsuario)

    if (tipoUsuario === "Admin") {
      query += " AND UsuarioID IS NULL"
    } else {
      if (!usuarioID || usuarioID === "null") {
        return NextResponse.json({ notificaciones: [] }) // Retorno seguro si no hay ID
      }
      query += " AND UsuarioID = @usuarioID"
      requestSql.input("usuarioID", sql.Int, Number.parseInt(usuarioID))
    }

    query += " ORDER BY FechaCreacion DESC"

    const result = await requestSql.query(query)
    const notificaciones = result.recordset || []

    // 2. Formateo seguro: verificamos que FechaCreacion exista antes de usar toISOString()
    const notificacionesFormateadas = notificaciones.map((n: any) => ({
      ...n,
      FechaCreacion: n.FechaCreacion instanceof Date 
        ? n.FechaCreacion.toISOString() 
        : new Date().toISOString(),
    }))

    return NextResponse.json({ notificaciones: notificacionesFormateadas })

  } catch (error: any) {
    console.error("[v0] Error crítico en notificaciones:", error)
    // 3. IMPORTANTE: Retornamos un objeto válido aunque falle para no bloquear el Frontend
    return NextResponse.json({ notificaciones: [], error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificacionID, marcarTodasLeidas, tipoUsuario, usuarioID } = body

    console.log("[v0] PATCH notificaciones:", body)

    const pool = await getConnection()

    if (marcarTodasLeidas) {
      // Marcar todas como leídas
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

      console.log("[v0] Todas las notificaciones marcadas como leídas")
      return NextResponse.json({ success: true })
    } else if (notificacionID) {
      // Marcar una específica como leída
      await pool
        .request()
        .input("notificacionID", notificacionID)
        .query(`
        UPDATE Notificaciones
        SET Leida = 1
        WHERE NotificacionID = @notificacionID
      `)

      console.log("[v0] Notificación marcada como leída:", notificacionID)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error al actualizar notificaciones:", error)
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 })
  }
}
