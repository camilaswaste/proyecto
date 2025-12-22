import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        s.SocioID,
        s.RUT,
        s.Nombre,
        s.Apellido,
        s.Email,
        s.Telefono,
        pm.PlanID,
        pm.NombrePlan,
        pm.Precio,
        pm.DuracionDias,
        mem.FechaInicio,
        mem.FechaVencimiento,
        mem.Estado AS EstadoMembresia
      FROM Socios s
      INNER JOIN Membresías mem ON s.SocioID = mem.SocioID
      INNER JOIN PlanesMembresía pm ON mem.PlanID = pm.PlanID
      WHERE s.EstadoSocio != 'Inactivo'
        AND mem.Estado = 'Vigente'
        AND mem.MembresíaID = (
          SELECT TOP 1 MembresíaID
          FROM Membresías
          WHERE SocioID = s.SocioID
          ORDER BY FechaCreacion DESC
        )
      ORDER BY s.Nombre, s.Apellido
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener socios con membresía activa:", error)
    return NextResponse.json({ error: "Error al obtener socios" }, { status: 500 })
  }
}
