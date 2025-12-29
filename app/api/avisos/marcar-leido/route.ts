import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { avisoID, socioID } = await request.json()

    if (!avisoID || !socioID) {
      return NextResponse.json({ error: "AvisoID y SocioID son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    // Insertar o ignorar si ya existe (MERGE o INSERT IGNORE)
    await pool
      .request()
      .input("avisoID", sql.Int, avisoID)
      .input("socioID", sql.Int, socioID)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM AvisosLeidos WHERE AvisoID = @avisoID AND SocioID = @socioID)
        BEGIN
          INSERT INTO AvisosLeidos (AvisoID, SocioID) VALUES (@avisoID, @socioID)
        END
      `)

    return NextResponse.json({ success: true, message: "Aviso marcado como leído" })
  } catch (error) {
    console.error("Error al marcar aviso como leído:", error)
    return NextResponse.json({ error: "Error al marcar aviso como leído" }, { status: 500 })
  }
}
