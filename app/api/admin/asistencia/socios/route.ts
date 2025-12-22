import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    console.log("[v0] Obteniendo lista de socios para asistencia")

    const result = await pool.request().query(`
      SELECT 
        s.SocioID,
        s.RUT,
        s.Nombre,
        s.Apellido,
        s.Email,
        s.FotoURL,
        s.EstadoSocio,
        a.FechaHoraIngreso,
        CASE 
          WHEN a.FechaHoraSalida IS NULL AND a.FechaHoraIngreso IS NOT NULL 
          THEN 1 
          ELSE 0 
        END as EnGimnasio,
        FORMAT(a.FechaHoraIngreso, 'HH:mm') as HoraIngreso,
        pm.NombrePlan,
        m.Estado as EstadoMembresia
      FROM Socios s
      LEFT JOIN (
        SELECT SocioID, FechaHoraIngreso, FechaHoraSalida
        FROM Asistencias
        WHERE CAST(FechaHoraIngreso AS DATE) = CAST(GETDATE() AS DATE)
          AND FechaHoraSalida IS NULL
      ) a ON s.SocioID = a.SocioID
      LEFT JOIN (
        SELECT SocioID, PlanID, Estado,
        ROW_NUMBER() OVER (PARTITION BY SocioID ORDER BY FechaCreacion DESC) as rn
        FROM Membresías
      ) m ON s.SocioID = m.SocioID AND m.rn = 1
      LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      WHERE s.EstadoSocio IN ('Activo', 'Suspendido')
      ORDER BY 
        CASE WHEN a.FechaHoraIngreso IS NOT NULL THEN 0 ELSE 1 END,
        s.Nombre, s.Apellido
    `)

    console.log("[v0] Socios obtenidos:", result.recordset.length)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("[v0] Error fetching socios:", error)
    return NextResponse.json({ error: "Error al obtener socios" }, { status: 500 })
  }
}
