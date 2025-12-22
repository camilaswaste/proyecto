import { getUser } from "@/lib/auth-server"
import { getConnection, sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// DELETE - Cancelar solicitud pendiente
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(request)
    if (!user || user.rol !== "Socio") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const socioID = user.socioID || user.usuarioID
    const { id } = await params
    const solicitudID = Number.parseInt(id)

    const pool = await getConnection()

    // Verificar que la solicitud pertenece al socio y está pendiente
    const solicitud = await pool
      .request()
      .input("solicitudID", sql.Int, solicitudID)
      .input("socioID", sql.Int, socioID)
      .query(`
        SELECT SolicitudID, Estado 
        FROM SolicitudesMembresia 
        WHERE SolicitudID = @solicitudID AND SocioID = @socioID
      `)

    if (solicitud.recordset.length === 0) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    if (solicitud.recordset[0].Estado !== "Pendiente") {
      return NextResponse.json({ error: "Solo se pueden cancelar solicitudes pendientes" }, { status: 400 })
    }

    // Eliminar la solicitud
    await pool
      .request()
      .input("solicitudID", sql.Int, solicitudID)
      .query(`DELETE FROM SolicitudesMembresia WHERE SolicitudID = @solicitudID`)

    return NextResponse.json({ message: "Solicitud cancelada exitosamente" })
  } catch (error) {
    console.error("Error al cancelar solicitud:", error)
    return NextResponse.json({ error: "Error al cancelar solicitud" }, { status: 500 })
  }
}
