import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ claseID: string }> }
) {
  try {
    const { claseID } = await params 
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!claseID || !usuarioID) {
      return NextResponse.json({ error: "Parámetros faltantes." }, { status: 400 })
    }

    const pool = await getConnection()

    // CORRECCIÓN: Unimos la tabla Usuarios (u) para obtener el Nombre y Email
    const result = await pool.request()
      .input("ClaseID", sql.Int, claseID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT 
            c.*, 
            u.Nombre as NombreEntrenador, 
            u.Email as EmailEntrenador,
            e.FotoURL as FotoEntrenador
        FROM Clases c
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE c.ClaseID = @ClaseID AND e.UsuarioID = @UsuarioID
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "No autorizado o clase no encontrada." }, 
        { status: 404 }
      )
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error en API Detalle Clase:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}