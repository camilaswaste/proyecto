// /api/admin/ventas/historial/route.ts

import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

// [GET] /api/admin/ventas/historial
// Lista las últimas 50 ventas de productos
export async function GET() {
    try {
        const pool = await getConnection();

        const result = await pool
            .request()
            // Utilizamos TOP 50 para evitar sobrecargar la consulta con un historial infinito
            // y ordenamos por la más reciente.
            .query(`
                SELECT TOP 50
                    V.VentaID,
                    V.FechaVenta,
                    V.MontoTotal,
                    V.MetodoPago,
                    V.ComprobantePath,
                    
                    -- Nombre del Usuario que registró la venta
                    U.Nombre + ' ' + U.Apellido AS NombreUsuarioRegistro,
                    
                    -- Nombre del Socio (NULL si es Venta al Público)
                    ISNULL(S.Nombre + ' ' + S.Apellido, NULL) AS SocioNombre
                FROM 
                    Ventas V
                JOIN 
                    Usuarios U ON V.UsuarioRegistro = U.UsuarioID
                LEFT JOIN 
                    Socios S ON V.SocioID = S.SocioID
                WHERE
                    V.TipoVenta = 'Producto' -- Solo ventas de productos
                ORDER BY
                    V.FechaVenta DESC;
        `);

        return NextResponse.json(result.recordset);

    } catch (err) {
        console.error("Error al obtener historial de ventas:", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}