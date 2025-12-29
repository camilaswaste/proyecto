import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import sql from "mssql"
import { NextResponse } from "next/server"

// Obtener avisos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioID = searchParams.get("usuarioID")
    const tipo = searchParams.get("tipo") // "Socio" o "Entrenador"
    const soloActivos = searchParams.get("soloActivos") === "true"

    const pool = await getConnection()

    if (usuarioID && tipo) {
      // Determinar los destinatarios válidos según el tipo de usuario
      const destinatariosValidos = tipo === "Socio" ? "('Todos', 'Socios')" : "('Todos', 'Entrenadores')"

      let query = `
        SELECT 
          a.AvisoID,
          a.Titulo,
          a.Mensaje,
          a.TipoAviso,
          a.Destinatarios,
          a.FechaInicio,
          a.FechaFin,
          a.Activo,
          a.FechaCreacion,
          a.CreadoPor,
          u.NombreUsuario AS NombreCreador,
          CASE WHEN al.AvisoLeidoID IS NOT NULL THEN 1 ELSE 0 END AS Leido,
          al.FechaLeido
        FROM AvisosGenerales a
        LEFT JOIN Usuarios u ON a.CreadoPor = u.UsuarioID
        LEFT JOIN AvisosLeidos al ON a.AvisoID = al.AvisoID AND al.UsuarioID = @usuarioID
        WHERE a.Destinatarios IN ${destinatariosValidos}
      `

      if (soloActivos) {
        query += ` AND a.Activo = 1 AND (a.FechaFin IS NULL OR a.FechaFin >= GETDATE())`
      }

      query += ` ORDER BY a.FechaCreacion DESC`

      const result = await pool.request().input("usuarioID", sql.Int, Number.parseInt(usuarioID)).query(query)

      // Contar avisos no leídos
      const noLeidos = result.recordset.filter((aviso: any) => !aviso.Leido).length

      return NextResponse.json({
        avisos: result.recordset,
        noLeidos,
      })
    } else {
      // Vista admin: todos los avisos sin filtrar por tipo de usuario
      let query = `
        SELECT 
          a.AvisoID,
          a.Titulo,
          a.Mensaje,
          a.TipoAviso,
          a.Destinatarios,
          a.FechaInicio,
          a.FechaFin,
          a.Activo,
          a.FechaCreacion,
          a.CreadoPor,
          u.NombreUsuario AS CreadoPorNombre
        FROM AvisosGenerales a
        LEFT JOIN Usuarios u ON a.CreadoPor = u.UsuarioID
      `

      if (soloActivos) {
        query += ` WHERE a.Activo = 1 AND (a.FechaFin IS NULL OR a.FechaFin >= GETDATE())`
      }

      query += ` ORDER BY a.FechaCreacion DESC`

      const result = await pool.request().query(query)

      return NextResponse.json(result.recordset)
    }
  } catch (error) {
    console.error("Error al obtener avisos:", error)
    return NextResponse.json({ error: "Error al obtener avisos" }, { status: 500 })
  }
}

// Crear nuevo aviso
export async function POST(request: Request) {
  try {
    const { titulo, mensaje, tipoAviso, destinatarios, fechaInicio, fechaFin, usuarioID } = await request.json()

    if (!titulo || !mensaje || !tipoAviso || !destinatarios) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("titulo", sql.NVarChar(200), titulo)
      .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
      .input("tipoAviso", sql.NVarChar(50), tipoAviso)
      .input("destinatarios", sql.NVarChar(50), destinatarios)
      .input("fechaInicio", sql.DateTime, fechaInicio || new Date())
      .input("fechaFin", sql.DateTime, fechaFin || null)
      .input("creadoPor", sql.Int, usuarioID || null)
      .query(`
        INSERT INTO AvisosGenerales (Titulo, Mensaje, TipoAviso, Destinatarios, FechaInicio, FechaFin, CreadoPor)
        OUTPUT INSERTED.AvisoID
        VALUES (@titulo, @mensaje, @tipoAviso, @destinatarios, @fechaInicio, @fechaFin, @creadoPor)
      `)

    const avisoID = result.recordset[0]?.AvisoID

    // Crear notificaciones según destinatarios
    try {
      if (destinatarios === "Todos" || destinatarios === "Socios") {
        await crearNotificacion({
          tipoUsuario: "Socio",
          tipoEvento: "aviso_general",
          titulo: `Nuevo aviso: ${titulo}`,
          mensaje: mensaje.substring(0, 200) + (mensaje.length > 200 ? "..." : ""),
        })
      }

      if (destinatarios === "Todos" || destinatarios === "Entrenadores") {
        await crearNotificacion({
          tipoUsuario: "Entrenador",
          tipoEvento: "aviso_general",
          titulo: `Nuevo aviso: ${titulo}`,
          mensaje: mensaje.substring(0, 200) + (mensaje.length > 200 ? "..." : ""),
        })
      }

      await crearNotificacion({
        tipoUsuario: "Admin",
        tipoEvento: "aviso_general",
        titulo: "Aviso publicado",
        mensaje: `El aviso "${titulo}" ha sido publicado para ${destinatarios}.`,
      })
    } catch (notifError) {
      console.error("Error al crear notificaciones de aviso:", notifError)
    }

    return NextResponse.json({ success: true, avisoID, message: "Aviso creado exitosamente" })
  } catch (error) {
    console.error("Error al crear aviso:", error)
    return NextResponse.json({ error: "Error al crear aviso" }, { status: 500 })
  }
}

// Actualizar aviso
export async function PUT(request: Request) {
  try {
    const { avisoID, titulo, mensaje, tipoAviso, destinatarios, fechaInicio, fechaFin, activo } = await request.json()

    if (!avisoID) {
      return NextResponse.json({ error: "AvisoID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("avisoID", sql.Int, avisoID)
      .input("titulo", sql.NVarChar(200), titulo)
      .input("mensaje", sql.NVarChar(sql.MAX), mensaje)
      .input("tipoAviso", sql.NVarChar(50), tipoAviso)
      .input("destinatarios", sql.NVarChar(50), destinatarios)
      .input("fechaInicio", sql.DateTime, fechaInicio)
      .input("fechaFin", sql.DateTime, fechaFin || null)
      .input("activo", sql.Bit, activo)
      .query(`
        UPDATE AvisosGenerales
        SET Titulo = @titulo,
            Mensaje = @mensaje,
            TipoAviso = @tipoAviso,
            Destinatarios = @destinatarios,
            FechaInicio = @fechaInicio,
            FechaFin = @fechaFin,
            Activo = @activo
        WHERE AvisoID = @avisoID
      `)

    return NextResponse.json({ success: true, message: "Aviso actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar aviso:", error)
    return NextResponse.json({ error: "Error al actualizar aviso" }, { status: 500 })
  }
}

// Eliminar aviso
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const avisoID = searchParams.get("avisoID")

    if (!avisoID) {
      return NextResponse.json({ error: "AvisoID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("avisoID", sql.Int, Number.parseInt(avisoID))
      .query(`
        DELETE FROM AvisosGenerales WHERE AvisoID = @avisoID
      `)

    return NextResponse.json({ success: true, message: "Aviso eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar aviso:", error)
    return NextResponse.json({ error: "Error al eliminar aviso" }, { status: 500 })
  }
}
