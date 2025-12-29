import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// GET: listado de pagos para el historial
export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.query(`
      SELECT
        p.PagoID,
        p.MontoPago       AS Monto,
        p.MedioPago       AS MetodoPago,
        p.FechaPago,
        ISNULL(LTRIM(RTRIM(s.Nombre + ' ' + s.Apellido)), 'Sin nombre') AS NombreSocio,
        pm.NombrePlan
      FROM Pagos p
      INNER JOIN Socios s ON p.SocioID = s.SocioID
      LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
      LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      ORDER BY p.FechaPago DESC, p.PagoID DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

// POST: registrar un nuevo pago desde /admin/pagos/procesar
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, monto, metodoPago, concepto, usuarioRegistro } = body

    if (!socioID || !monto || !metodoPago) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const pool = await getConnection()

    const numeroComprobante = `COMP-${Date.now()}-${socioID}`

    const result = await pool
      .request()
      .input("SocioID", socioID)
      .input("MontoPago", monto)
      .input("MedioPago", metodoPago)
      .input("Concepto", concepto ?? null)
      .input("NumeroComprobante", numeroComprobante)
      .input("UsuarioRegistro", usuarioRegistro ?? null)
      .query(`
        INSERT INTO Pagos (SocioID, MontoPago, MedioPago, Concepto, NumeroComprobante, UsuarioRegistro)
        OUTPUT INSERTED.PagoID
        VALUES (@SocioID, @MontoPago, @MedioPago, @Concepto, @NumeroComprobante, @UsuarioRegistro)
      `)

    const pagoID = result.recordset[0].PagoID
    return NextResponse.json({ pagoID, numeroComprobante })
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 })
  }
}