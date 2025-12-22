import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// This endpoint should be called periodically (e.g., daily via cron job)
// to synchronize data and update statuses automatically
export async function POST() {
  try {
    const pool = await getConnection()
    const results = {
      memberships: 0,
      socios: 0,
      reservations: 0,
      sessions: 0,
    }

    // 1. Update expired memberships
    const membershipsResult = await pool.request().query(`
      UPDATE Membresías
      SET Estado = 'Vencida'
      WHERE Estado = 'Vigente'
      AND FechaVencimiento < CAST(GETDATE() AS DATE)
    `)
    results.memberships = membershipsResult.rowsAffected[0]

    // 2. Update socio status based on membership
    // Set to 'Moroso' if they have an expired membership and no active one
    await pool.request().query(`
      UPDATE Socios
      SET EstadoSocio = 'Moroso'
      WHERE SocioID IN (
        SELECT DISTINCT s.SocioID
        FROM Socios s
        LEFT JOIN Membresías m ON s.SocioID = m.SocioID AND m.Estado = 'Vigente'
        WHERE s.EstadoSocio = 'Activo'
        AND m.MembresíaID IS NULL
        AND EXISTS (
          SELECT 1 FROM Membresías m2
          WHERE m2.SocioID = s.SocioID
          AND m2.Estado = 'Vencida'
        )
      )
    `)

    // Set to 'Inactivo' if they haven't had any membership for 90+ days
    const sociosResult = await pool.request().query(`
      UPDATE Socios
      SET EstadoSocio = 'Inactivo'
      WHERE SocioID IN (
        SELECT s.SocioID
        FROM Socios s
        LEFT JOIN Membresías m ON s.SocioID = m.SocioID
        WHERE s.EstadoSocio IN ('Activo', 'Moroso')
        AND NOT EXISTS (
          SELECT 1 FROM Membresías m2
          WHERE m2.SocioID = s.SocioID
          AND m2.FechaVencimiento >= DATEADD(day, -90, GETDATE())
        )
      )
    `)
    results.socios = sociosResult.rowsAffected[0]

    // 3. Mark past class reservations as 'NoAsistió' if still 'Reservada'
    const reservationsResult = await pool.request().query(`
      UPDATE ReservasClases
      SET Estado = 'NoAsistió'
      WHERE Estado = 'Reservada'
      AND FechaClase < CAST(GETDATE() AS DATE)
    `)
    results.reservations = reservationsResult.rowsAffected[0]

    // 4. Mark past personal sessions as 'NoAsistio' if still 'Agendada'
    const sessionsResult = await pool.request().query(`
      UPDATE SesionesPersonales
      SET Estado = 'NoAsistio'
      WHERE Estado = 'Agendada'
      AND FechaSesion < CAST(GETDATE() AS DATE)
    `)
    results.sessions = sessionsResult.rowsAffected[0]

    return NextResponse.json({
      success: true,
      message: "Sincronización completada",
      results,
    })
  } catch (error) {
    console.error("Error en sincronización:", error)
    return NextResponse.json({ error: "Error en sincronización" }, { status: 500 })
  }
}

// GET endpoint to check what would be updated without actually updating
export async function GET() {
  try {
    const pool = await getConnection()

    // Check expired memberships
    const expiredMemberships = await pool.request().query(`
      SELECT COUNT(*) as Count
      FROM Membresías
      WHERE Estado = 'Vigente'
      AND FechaVencimiento < CAST(GETDATE() AS DATE)
    `)

    // Check socios that should be marked as Moroso
    const morososCount = await pool.request().query(`
      SELECT COUNT(DISTINCT s.SocioID) as Count
      FROM Socios s
      LEFT JOIN Membresías m ON s.SocioID = m.SocioID AND m.Estado = 'Vigente'
      WHERE s.EstadoSocio = 'Activo'
      AND m.MembresíaID IS NULL
      AND EXISTS (
        SELECT 1 FROM Membresías m2
        WHERE m2.SocioID = s.SocioID
        AND m2.Estado = 'Vencida'
      )
    `)

    // Check past reservations
    const pastReservations = await pool.request().query(`
      SELECT COUNT(*) as Count
      FROM ReservasClases
      WHERE Estado = 'Reservada'
      AND FechaClase < CAST(GETDATE() AS DATE)
    `)

    // Check past sessions
    const pastSessions = await pool.request().query(`
      SELECT COUNT(*) as Count
      FROM SesionesPersonales
      WHERE Estado = 'Agendada'
      AND FechaSesion < CAST(GETDATE() AS DATE)
    `)

    return NextResponse.json({
      pendingUpdates: {
        expiredMemberships: expiredMemberships.recordset[0].Count,
        morososToUpdate: morososCount.recordset[0].Count,
        pastReservations: pastReservations.recordset[0].Count,
        pastSessions: pastSessions.recordset[0].Count,
      },
    })
  } catch (error) {
    console.error("Error al verificar sincronización:", error)
    return NextResponse.json({ error: "Error al verificar sincronización" }, { status: 500 })
  }
}
