// /api/admin/ventas/comprobante/route.ts

import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

// [GET] /api/admin/ventas/comprobante?id=[ventaId]
// Devuelve los datos de la venta y sus detalles para generar el comprobante.
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ventaID = searchParams.get("id");

        if (!ventaID) {
            return new NextResponse("VentaID es requerido", { status: 400 });
        }

        const pool = await getConnection();
        
        // Consulta D que une Ventas, DetalleVenta, Inventario y Socios
        const result = await pool.request()
            .input("VentaID", ventaID)
            .query(`
                SELECT 
                    V.VentaID,
                    V.NumeroComprobante,
                    V.FechaVenta,
                    V.MontoTotal,
                    V.MetodoPago,
                    
                    -- Datos del Cliente/Socio
                    ISNULL(S.Nombre, 'Venta') AS NombreCliente,
                    ISNULL(S.Apellido, 'al Público') AS ApellidoCliente,
                    ISNULL(S.RUT, 'N/A') AS RUT,

                    -- Detalles de los Productos
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
                    V.VentaID = @VentaID
            `);

        if (result.recordset.length === 0) {
            return new NextResponse("Comprobante de venta no encontrado", { status: 404 });
        }
        
        // Estructurar la respuesta: Cabecera + Lista de Detalles
        const cabecera = {
            VentaID: result.recordset[0].VentaID,
            NumeroComprobante: result.recordset[0].NumeroComprobante,
            FechaVenta: result.recordset[0].FechaVenta,
            MontoTotal: result.recordset[0].MontoTotal,
            MetodoPago: result.recordset[0].MetodoPago,
            NombreCliente: result.recordset[0].NombreCliente,
            ApellidoCliente: result.recordset[0].ApellidoCliente,
            RUT: result.recordset[0].RUT,
        };
        
        const detalles = result.recordset.map((row: any) => ({
            NombreProducto: row.NombreProducto,
            Cantidad: row.Cantidad,
            PrecioUnitario: row.PrecioUnitario,
            Subtotal: row.Subtotal,
            UnidadMedida: row.UnidadMedida,
        }));


        return NextResponse.json({ ...cabecera, detalles });
    } catch (error) {
        console.error("[COMPROBANTE_GET_ERROR]", error);
        return new NextResponse("Error interno al obtener el comprobante.", { status: 500 });
    }
}