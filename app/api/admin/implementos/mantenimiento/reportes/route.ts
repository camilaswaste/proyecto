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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pool = await sql.connect(config)

    // Registrar mantenimiento
    await pool
      .request()
      .input("ImplementoID", sql.Int, body.ImplementoID)
      .input("TipoMantenimiento", sql.NVarChar, body.TipoMantenimiento)
      .input("Descripcion", sql.NVarChar, body.Descripcion)
      .input("Costo", sql.Decimal(10, 2), body.Costo || null)
      .input("EstadoAntes", sql.NVarChar, body.EstadoAntes)
      .input("EstadoDespues", sql.NVarChar, body.EstadoDespues)
      .input("ResponsableNombre", sql.NVarChar, body.ResponsableNombre || null)
      .query(`
        INSERT INTO HistorialMantenimiento (
          ImplementoID, TipoMantenimiento, Descripcion, Costo,
          EstadoAntes, EstadoDespues, ResponsableNombre
        )
        VALUES (
          @ImplementoID, @TipoMantenimiento, @Descripcion, @Costo,
          @EstadoAntes, @EstadoDespues, @ResponsableNombre
        )
      `)

    // Actualizar estado e implemento y calcular próxima revisión
    const resultFrecuencia = await pool
      .request()
      .input("ImplementoID", sql.Int, body.ImplementoID)
      .query(`
        SELECT FrecuenciaRevision FROM Implementos WHERE ImplementoID = @ImplementoID
      `)

    let proximaRevision = null
    if (resultFrecuencia.recordset[0]?.FrecuenciaRevision) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + resultFrecuencia.recordset[0].FrecuenciaRevision)
      proximaRevision = fecha.toISOString().split("T")[0]
    }

    await pool
      .request()
      .input("ImplementoID", sql.Int, body.ImplementoID)
      .input("Estado", sql.NVarChar, body.EstadoDespues)
      .input("ProximaRevision", sql.Date, proximaRevision)
      .query(`
        UPDATE Implementos
        SET Estado = @Estado,
            UltimaRevision = GETDATE(),
            ProximaRevision = @ProximaRevision
        WHERE ImplementoID = @ImplementoID
      `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al registrar mantenimiento:", error)
    return NextResponse.json({ error: "Error al registrar mantenimiento" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const implementoId = searchParams.get("implementoId")

    const pool = await sql.connect(config)

    let query = `
      SELECT 
        h.*,
        i.Nombre as NombreImplemento,
        i.CodigoInterno
      FROM HistorialMantenimiento h
      INNER JOIN Implementos i ON h.ImplementoID = i.ImplementoID
    `

    if (implementoId) {
      query += ` WHERE h.ImplementoID = @ImplementoID`
    }

    query += ` ORDER BY h.FechaMantenimiento DESC`

    const result = await pool.request().input("ImplementoID", sql.Int, implementoId).query(query)

    return NextResponse.json({ historial: result.recordset })
  } catch (error) {
    console.error("Error al obtener historial:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}