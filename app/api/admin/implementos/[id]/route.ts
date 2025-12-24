import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const pool = await sql.connect(config)

    // Calcular próxima revisión si hay frecuencia
    let proximaRevision = null
    if (body.FrecuenciaRevision) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + Number.parseInt(body.FrecuenciaRevision))
      proximaRevision = fecha.toISOString().split("T")[0]
    }

    await pool
      .request()
      .input("ID", sql.Int, params.id)
      .input("Nombre", sql.NVarChar, body.Nombre)
      .input("Categoria", sql.NVarChar, body.Categoria)
      .input("CodigoInterno", sql.NVarChar, body.CodigoInterno)
      .input("Descripcion", sql.NVarChar, body.Descripcion || null)
      .input("Ubicacion", sql.NVarChar, body.Ubicacion || null)
      .input("Estado", sql.NVarChar, body.Estado)
      .input("FechaAdquisicion", sql.Date, body.FechaAdquisicion || null)
      .input("VidaUtilMeses", sql.Int, body.VidaUtilMeses || null)
      .input("CostoAdquisicion", sql.Decimal(10, 2), body.CostoAdquisicion || null)
      .input("FrecuenciaRevision", sql.Int, body.FrecuenciaRevision || null)
      .input("ProximaRevision", sql.Date, proximaRevision)
      .input("Observaciones", sql.NVarChar, body.Observaciones || null)
      .query(`
        UPDATE Implementos
        SET Nombre = @Nombre,
            Categoria = @Categoria,
            CodigoInterno = @CodigoInterno,
            Descripcion = @Descripcion,
            Ubicacion = @Ubicacion,
            Estado = @Estado,
            FechaAdquisicion = @FechaAdquisicion,
            VidaUtilMeses = @VidaUtilMeses,
            CostoAdquisicion = @CostoAdquisicion,
            FrecuenciaRevision = @FrecuenciaRevision,
            ProximaRevision = @ProximaRevision,
            Observaciones = @Observaciones,
            FechaModificacion = GETDATE()
        WHERE ImplementoID = @ID
      `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar implemento:", error)
    return NextResponse.json({ error: "Error al actualizar implemento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pool = await sql.connect(config)

    await pool
      .request()
      .input("ID", sql.Int, params.id)
      .query(`
        UPDATE Implementos
        SET Activo = 0
        WHERE ImplementoID = @ID
      `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar implemento:", error)
    return NextResponse.json({ error: "Error al eliminar implemento" }, { status: 500 })
  }
}