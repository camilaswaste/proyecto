import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

const ESTADOS_VALIDOS = ["Reservada", "Asistió", "NoAsistió", "Cancelada", "Reprogramada"] as const

export async function PUT(request: Request, { params }: { params: { claseID: string; reservaID: string } }) {
  try {
    const { reservaID } = await params
    const { estado } = await request.json()
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!usuarioID) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        {
          error: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const pool = await getConnection()

    const validation = await pool
      .request()
      .input("ReservaID", sql.Int, reservaID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT rc.ReservaID, rc.Estado as EstadoActual, s.Nombre, s.Apellido
        FROM ReservasClases rc
        INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        INNER JOIN Socios s ON rc.SocioID = s.SocioID
        WHERE rc.ReservaID = @ReservaID AND e.UsuarioID = @UsuarioID
      `)

    if (validation.recordset.length === 0) {
      return NextResponse.json({ error: "No autorizado para modificar esta reserva" }, { status: 403 })
    }

    const { EstadoActual, Nombre, Apellido } = validation.recordset[0]

    await pool
      .request()
      .input("ReservaID", sql.Int, reservaID)
      .input("Estado", sql.NVarChar, estado)
      .query(`
        UPDATE ReservasClases 
        SET Estado = @Estado
        WHERE ReservaID = @ReservaID
      `)

    console.log(`[v0] Estado de reserva ${reservaID} actualizado: ${EstadoActual} → ${estado} (${Nombre} ${Apellido})`)

    return NextResponse.json({
      message: "Estado actualizado correctamente",
      socio: `${Nombre} ${Apellido}`,
      estadoAnterior: EstadoActual,
      estadoNuevo: estado,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { claseID: string; reservaID: string } }) {
  try {
    const { reservaID } = await params
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!usuarioID) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const pool = await getConnection()

    const validation = await pool
      .request()
      .input("ReservaID", sql.Int, reservaID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT rc.ReservaID
        FROM ReservasClases rc
        INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        WHERE rc.ReservaID = @ReservaID AND e.UsuarioID = @UsuarioID
      `)

    if (validation.recordset.length === 0) {
      return NextResponse.json({ error: "No autorizado para eliminar esta reserva" }, { status: 403 })
    }

    await pool
      .request()
      .input("ReservaID", sql.Int, reservaID)
      .query(`DELETE FROM ReservasClases WHERE ReservaID = @ReservaID`)

    return NextResponse.json({ message: "Reserva eliminada correctamente" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar reserva" }, { status: 500 })
  }
}
