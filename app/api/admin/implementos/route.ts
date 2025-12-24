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

export async function GET() {
  try {
    const pool = await sql.connect(config)
    const result = await pool.request().query(`
      SELECT * FROM Implementos 
      WHERE Activo = 1
      ORDER BY FechaCreacion DESC
    `)

    return NextResponse.json({ implementos: result.recordset })
  } catch (error) {
    console.error("Error al obtener implementos:", error)
    return NextResponse.json({ error: "Error al obtener implementos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const result = await pool
      .request()
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
        INSERT INTO Implementos (
          Nombre, Categoria, CodigoInterno, Descripcion, Ubicacion,
          Estado, FechaAdquisicion, VidaUtilMeses, CostoAdquisicion,
          FrecuenciaRevision, ProximaRevision, Observaciones, UltimaRevision
        )
        VALUES (
          @Nombre, @Categoria, @CodigoInterno, @Descripcion, @Ubicacion,
          @Estado, @FechaAdquisicion, @VidaUtilMeses, @CostoAdquisicion,
          @FrecuenciaRevision, @ProximaRevision, @Observaciones, GETDATE()
        )
      `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al crear implemento:", error)
    return NextResponse.json({ error: "Error al crear implemento" }, { status: 500 })
  }
}