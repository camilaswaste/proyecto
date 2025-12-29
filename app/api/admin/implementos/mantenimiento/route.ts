import sql from "mssql"
import { NextResponse } from "next/server"

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: false },
}

declare global {
  // eslint-disable-next-line no-var
  var __mfPool: sql.ConnectionPool | undefined
}
async function getPool() {
  if (global.__mfPool?.connected) return global.__mfPool
  global.__mfPool = await sql.connect(config)
  return global.__mfPool
}

const toNullIfEmpty = (v: any) => {
  if (v === undefined || v === null) return null
  if (typeof v === "string" && v.trim() === "") return null
  return v
}
const toDecimalOrNull = (v: any) => {
  const x = toNullIfEmpty(v)
  if (x === null) return null
  const n = Number.parseFloat(String(x))
  return Number.isFinite(n) ? n : null
}
const toIntOrNull = (v: any) => {
  const x = toNullIfEmpty(v)
  if (x === null) return null
  const n = Number.parseInt(String(x), 10)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const ImplementoID = Number.parseInt(String(body?.ImplementoID ?? ""), 10)
    const TipoMantenimiento = String(body?.TipoMantenimiento ?? "Preventivo").trim()
    const Descripcion = String(body?.Descripcion ?? "").trim()
    const EstadoAntes = toNullIfEmpty(body?.EstadoAntes)
    const EstadoDespues = String(body?.EstadoDespues ?? "").trim()
    const ResponsableNombre = toNullIfEmpty(body?.ResponsableNombre)
    const Costo = toDecimalOrNull(body?.Costo)

    if (!Number.isFinite(ImplementoID)) {
      return NextResponse.json({ error: "ImplementoID inválido" }, { status: 400 })
    }
    if (!Descripcion) {
      return NextResponse.json({ error: "Descripción es obligatoria" }, { status: 400 })
    }
    if (!EstadoDespues) {
      return NextResponse.json({ error: "EstadoDespues es obligatorio" }, { status: 400 })
    }

    // si mandan frecuencia opcional, si no, usamos la del implemento
    const frecuenciaOverride = toIntOrNull(body?.FrecuenciaRevision)

    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      // 1) Insert mantenimiento
      await new sql.Request(tx)
        .input("ImplementoID", sql.Int, ImplementoID)
        .input("TipoMantenimiento", sql.NVarChar(50), TipoMantenimiento)
        .input("Descripcion", sql.NVarChar(1000), Descripcion)
        .input("Costo", sql.Decimal(10, 2), Costo)
        .input("EstadoAntes", sql.NVarChar(30), EstadoAntes)
        .input("EstadoDespues", sql.NVarChar(30), EstadoDespues)
        .input("ResponsableNombre", sql.NVarChar(150), ResponsableNombre)
        .query(`
          INSERT INTO HistorialMantenimiento (
            ImplementoID, TipoMantenimiento, Descripcion, Costo,
            EstadoAntes, EstadoDespues, ResponsableNombre, FechaMantenimiento
          )
          VALUES (
            @ImplementoID, @TipoMantenimiento, @Descripcion, @Costo,
            @EstadoAntes, @EstadoDespues, @ResponsableNombre, GETDATE()
          )
        `)

      // 2) Traer FrecuenciaRevision real (o usar override)
      const freqRes = await new sql.Request(tx)
        .input("ImplementoID", sql.Int, ImplementoID)
        .query(`
          SELECT FrecuenciaRevision
          FROM Implementos
          WHERE ImplementoID = @ImplementoID AND Activo = 1
        `)

      const freqDB = freqRes.recordset?.[0]?.FrecuenciaRevision ?? 30
      const freq = frecuenciaOverride ?? freqDB

      // 3) Actualizar implemento (estado + ultima/proxima revision)
      await new sql.Request(tx)
        .input("ImplementoID", sql.Int, ImplementoID)
        .input("Estado", sql.NVarChar(30), EstadoDespues)
        .input("FrecuenciaRevision", sql.Int, freq)
        .query(`
          UPDATE Implementos
          SET
            Estado = @Estado,
            UltimaRevision = CAST(GETDATE() AS DATE),
            ProximaRevision = DATEADD(day, @FrecuenciaRevision, CAST(GETDATE() AS DATE)),
            FechaModificacion = GETDATE()
          WHERE ImplementoID = @ImplementoID AND Activo = 1
        `)

      await tx.commit()
      return NextResponse.json({ success: true })
    } catch (err) {
      await tx.rollback()
      throw err
    }
  } catch (error) {
    console.error("Error al registrar mantenimiento:", error)
    return NextResponse.json({ error: "Error al registrar mantenimiento" }, { status: 500 })
  }
}