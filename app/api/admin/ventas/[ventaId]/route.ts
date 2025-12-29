// /api/admin/ventas/[ventaId]/route.ts (Modelo de API)

import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(req: NextRequest) {
    
    // CAMBIO CLAVE: Obtener el ID de la URL directamente para evitar el bug de 'params is a Promise'
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // El ID de Venta es el último segmento de la URL
    const rawVentaId = pathSegments.pop(); 

    // Convertir el ID a número de manera segura
    const ventaId = parseInt(rawVentaId || '', 10)

    if (Number.isNaN(ventaId)) {
        return NextResponse.json({ error: "ID de Venta inválido" }, { status: 400 })
    }

    try {
        const pool = await getConnection()

        // Consulta para obtener la cabecera y el detalle de los productos
        const result = await pool
            .request()
            .input("VentaID", ventaId)
            .query(`
                SELECT 
                    V.VentaID,
                    V.NumeroComprobante,
                    V.FechaVenta,
                    V.MontoTotal,
                    V.MetodoPago,
                    V.ComprobantePath, -- Importante para saber si ya existe el PDF
                    
                    -- Datos del Cliente/Socio (maneja el NULL de 'Venta al Público')
                    ISNULL(S.Nombre + ' ' + S.Apellido, 'Venta al Público') AS NombreCliente,
                    ISNULL(S.RUT, 'N/A') AS RUTCliente,

                    -- Detalles de los Productos (para el array Detalle)
                    D.Cantidad,
                    D.PrecioUnitario,
                    D.Subtotal,
                    P.NombreProducto,
                    P.UnidadMedida
                FROM 
                    Ventas V
                JOIN 
                    DetalleVenta D ON V.VentaID = D.VentaID
                JOIN
                    Inventario P ON D.ProductoID = P.ProductoID
                LEFT JOIN
                    Socios S ON V.SocioID = S.SocioID
                WHERE 
                    V.VentaID = @VentaID;
            `)

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
        }

        const cabecera = result.recordset[0]
        
        const responseData = {
            VentaID: cabecera.VentaID,
            NumeroComprobante: cabecera.NumeroComprobante,
            FechaVenta: cabecera.FechaVenta,
            MontoTotal: cabecera.MontoTotal,
            MetodoPago: cabecera.MetodoPago,
            NombreCliente: cabecera.NombreCliente,
            RUTCliente: cabecera.RUTCliente,
            ComprobantePath: cabecera.ComprobantePath,
            Detalle: result.recordset.map(row => ({
                NombreProducto: row.NombreProducto,
                Cantidad: row.Cantidad,
                PrecioUnitario: row.PrecioUnitario,
                Subtotal: row.Subtotal,
                UnidadMedida: row.UnidadMedida,
            })),
        }

        return NextResponse.json(responseData)
    } catch (err) {
        console.error("Error al obtener detalle de venta:", err)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}