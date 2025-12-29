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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

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

    const hoy = new Date()
    const proxima = new Date(hoy)
    proxima.setDate(hoy.getDate() + FrecuenciaRevision)

    const pool = await getPool()

    await pool
      .request()
      .input("ID", sql.Int, id)
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
        UPDATE Implementos
        SET
          Nombre = @Nombre,
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
        WHERE ImplementoID = @ID AND Activo = 1
      `)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al actualizar implemento:", error)
    const msg =
      String(error?.message || "").includes("UNIQUE") || String(error?.message || "").includes("duplicate")
        ? "El Código Interno ya existe. Debe ser único."
        : "Error al actualizar implemento"

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const pool = await getPool()

    await pool
      .request()
      .input("ID", sql.Int, id)
      .query(`
        UPDATE Implementos
        SET Activo = 0, FechaModificacion = GETDATE()
        WHERE ImplementoID = @ID
      `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar implemento:", error)
    return NextResponse.json({ error: "Error al eliminar implemento" }, { status: 500 })
  }
}