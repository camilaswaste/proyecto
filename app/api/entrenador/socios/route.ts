// app/api/entrenador/socios/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const entrenadorID = searchParams.get("entrenadorID")
        const searchTerm = searchParams.get("search")

        const pool = await getConnection()

        // --- MODO 1: Búsqueda Rápida de Socio (Para el Modal de Clase Personal) ---
        // Corregido: Buscamos directamente en la tabla Socios para evitar el error de 'UsuarioID'
        if (searchTerm) {
            if (searchTerm.length < 3) {
                 return NextResponse.json([]) 
            }

            const searchResult = await pool.request()
                .input("SearchTerm", sql.NVarChar, `%${searchTerm}%`)
                .query(`
                    SELECT 
                        SocioID, Nombre, Apellido, Email
                    FROM Socios
                    WHERE (Nombre LIKE @SearchTerm OR Apellido LIKE @SearchTerm OR Email LIKE @SearchTerm)
                    AND EstadoSocio = 'Activo'
                    ORDER BY Nombre, Apellido
                `)
            
            return NextResponse.json(searchResult.recordset)
        }

        // --- MODO 2: Obtener Lista Completa y KPIs ---
        if (!entrenadorID) {
             return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
        }

        // 1. Obtener la data completa
        const allSociosResult = await pool
          .request()
          .input("entrenadorID", sql.Int, entrenadorID)
          .query(`
            SELECT DISTINCT 
              s.SocioID, s.RUT, s.Nombre, s.Apellido, s.Email, s.Telefono,
              s.FechaNacimiento, s.Direccion, s.EstadoSocio, s.CodigoQR,
              m.NombrePlan, mem.Estado as EstadoMembresia,
              mem.FechaInicio, mem.FechaVencimiento AS FechaFin
            FROM Socios s
            INNER JOIN ReservasClases rc ON s.SocioID = rc.SocioID 
            INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
            LEFT JOIN Membresías mem ON s.SocioID = mem.SocioID AND mem.Estado = 'Vigente'
            LEFT JOIN PlanesMembresía m ON mem.PlanID = m.PlanID
            WHERE c.EntrenadorID = @entrenadorID AND s.EstadoSocio = 'Activo'
            ORDER BY s.Nombre, s.Apellido
          `)

        // 2. Obtener conteo de sesiones
        const sociosConSesionesResult = await pool
          .request()
          .input("entrenadorID", sql.Int, entrenadorID)
          .query(`
            SELECT s.SocioID, COUNT(rc.ReservaID) as TotalSesiones 
            FROM Socios s
            INNER JOIN ReservasClases rc ON s.SocioID = rc.SocioID
            INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
            WHERE c.EntrenadorID = @entrenadorID
            GROUP BY s.SocioID
          `)
          
        const todosSociosRecordset = allSociosResult.recordset;
        const totalReservas = sociosConSesionesResult.recordset.reduce((sum, current) => sum + current.TotalSesiones, 0);

        const kpis = {
            totalSociosAsignados: todosSociosRecordset.length,
            sociosConMembresiaVigente: todosSociosRecordset.filter(s => s.EstadoMembresia === 'Vigente').length,
            sociosSinPlan: todosSociosRecordset.filter(s => !s.NombrePlan || s.EstadoMembresia !== 'Vigente').length,
            totalReservasClases: totalReservas
        };

        return NextResponse.json({
          todosSocios: todosSociosRecordset,
          sociosConSesiones: sociosConSesionesResult.recordset,
          kpis: kpis, 
        })
    } catch (error) {
        console.error("Error en API Socios:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}