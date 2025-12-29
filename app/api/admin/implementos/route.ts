import sql from "mssql"
import { NextResponse } from "next/server"

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: false },
}

// Reutilizar pool (evita reconectar siempre)
declare global {
  // eslint-disable-next-line no-var
  var __mfPool: sql.ConnectionPool | undefined
}

async function getPool() {
  if (global.__mfPool?.connected) return global.__mfPool
  global.__mfPool = await sql.connect(config)
  return global.__mfPool
}

// Helpers para convertir strings vacíos a null
const toNullIfEmpty = (v: any) => {
  if (v === undefined || v === null) return null
  if (typeof v === "string" && v.trim() === "") return null
  return v
}
const toIntOrNull = (v: any) => {
  const x = toNullIfEmpty(v)
  if (x === null) return null
  const n = Number.parseInt(String(x), 10)
  return Number.isFinite(n) ? n : null
}
const toDecimalOrNull = (v: any) => {
  const x = toNullIfEmpty(v)
  if (x === null) return null
  const n = Number.parseFloat(String(x))
  return Number.isFinite(n) ? n : null
}
const toDateOrNull = (v: any) => {
  const x = toNullIfEmpty(v)
  if (x === null) return null
  const d = new Date(String(x))
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET() {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        ImplementoID, Nombre, Categoria, CodigoInterno, Descripcion, Ubicacion, Estado,
        FechaAdquisicion, VidaUtilMeses, CostoAdquisicion, UltimaRevision,
        ProximaRevision, FrecuenciaRevision, Observaciones, FechaCreacion, FechaModificacion, Activo
      FROM Implementos
      WHERE Activo = 1
      ORDER BY FechaCreacion DESC
    `)

    return NextResponse.json({ implementos: result.recordset })
  } catch (error) {
    console.error("Error al obtener implementos:", error)
    return NextResponse.json({ error: "Error al obtener implementos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const Nombre = String(body?.Nombre ?? "").trim()
    const Categoria = String(body?.Categoria ?? "").trim()
    const CodigoInterno = String(body?.CodigoInterno ?? "").trim()

    if (!Nombre || !Categoria || !CodigoInterno) {
      return NextResponse.json(
        { error: "Datos incompletos: Nombre, Categoria y CodigoInterno son obligatorios." },
        { status: 400 },
      )
    }

    const Descripcion = toNullIfEmpty(body?.Descripcion)
    const Ubicacion = toNullIfEmpty(body?.Ubicacion)
    const Estado = String(body?.Estado ?? "Operativo").trim() || "Operativo"
    const FechaAdquisicion = toDateOrNull(body?.FechaAdquisicion)
    const VidaUtilMeses = toIntOrNull(body?.VidaUtilMeses)
    const CostoAdquisicion = toDecimalOrNull(body?.CostoAdquisicion)
    const FrecuenciaRevision = toIntOrNull(body?.FrecuenciaRevision) ?? 30
    const Observaciones = toNullIfEmpty(body?.Observaciones)

    const pool = await getPool()

    // ProximaRevision = hoy + frecuencia (si hay frecuencia)
    const hoy = new Date()
    const proxima = new Date(hoy)
    proxima.setDate(hoy.getDate() + FrecuenciaRevision)

    await pool
      .request()
      .input("Nombre", sql.NVarChar(150), Nombre)
      .input("Categoria", sql.NVarChar(50), Categoria)
      .input("CodigoInterno", sql.NVarChar(50), CodigoInterno)
      .input("Descripcion", sql.NVarChar(500), Descripcion)
      .input("Ubicacion", sql.NVarChar(100), Ubicacion)
      .input("Estado", sql.NVarChar(30), Estado)
      .input("FechaAdquisicion", sql.Date, FechaAdquisicion)
      .input("VidaUtilMeses", sql.Int, VidaUtilMeses)
      .input("CostoAdquisicion", sql.Decimal(10, 2), CostoAdquisicion)
      .input("FrecuenciaRevision", sql.Int, FrecuenciaRevision)
      .input("ProximaRevision", sql.Date, proxima)
      .input("Observaciones", sql.NVarChar(1000), Observaciones)
      .query(`
        INSERT INTO Implementos (
          Nombre, Categoria, CodigoInterno, Descripcion, Ubicacion,
          Estado, FechaAdquisicion, VidaUtilMeses, CostoAdquisicion,
          UltimaRevision, ProximaRevision, FrecuenciaRevision, Observaciones,
          FechaCreacion, Activo
        )
        VALUES (
          @Nombre, @Categoria, @CodigoInterno, @Descripcion, @Ubicacion,
          @Estado, @FechaAdquisicion, @VidaUtilMeses, @CostoAdquisicion,
          CAST(GETDATE() AS DATE), @ProximaRevision, @FrecuenciaRevision, @Observaciones,
          GETDATE(), 1
        )
      `)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Error típico: UNIQUE constraint por CodigoInterno
    console.error("Error al crear implemento:", error)
    const msg =
      String(error?.message || "").includes("UNIQUE") || String(error?.message || "").includes("duplicate")
        ? "El Código Interno ya existe. Debe ser único."
        : "Error al crear implemento"

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}