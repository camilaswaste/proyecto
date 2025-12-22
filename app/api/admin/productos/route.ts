// /api/admin/productos/route.ts (Optimizado para TPV)

import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db"; 

// [GET] /api/admin/productos
// Devuelve la lista de productos disponibles con stock para la venta
export async function GET() {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        ProductoID,
        NombreProducto,
        PrecioVenta,
        StockActual,
        UnidadMedida
      FROM Inventario
      WHERE StockActual > 0 
      AND Estado = 'Disponible' -- O 'Activo' si usas ese estado
      ORDER BY NombreProducto ASC
    `);

    // Usamos el mismo formato de interfaz que el frontend espera
    const productosParaVenta = result.recordset.map((p: any) => ({
      ProductoID: p.ProductoID,
      NombreProducto: p.NombreProducto,
      PrecioVenta: p.PrecioVenta,
      StockActual: p.StockActual,
      UnidadMedida: p.UnidadMedida,
    }));

    return NextResponse.json(productosParaVenta);
  } catch (error) {
    console.error("[PRODUCTOS_TPV_GET_ERROR]", error);
    return new NextResponse("Error interno al obtener productos.", { status: 500 });
  }
}