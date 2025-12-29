// /api/admin/ventas/route.ts

import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db"; // Tu función de conexión SQL
import sql from "mssql"; // Necesario para gestionar las transacciones

// Define la estructura esperada del cuerpo de la solicitud POST
interface VentaRequest {
  socioID: number | null;
  montoTotal: number;
  metodoPago: string;
  carrito: {
    productoID: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

// Función auxiliar para registrar movimientos de inventario (reutilizable)
async function registrarMovimiento(transaction: sql.Transaction, ProductoID: number, Cantidad: number, UsuarioRegistro: number, VentaID: number) {
  await transaction.request()
    .input("ProductoID", ProductoID)
    .input("TipoMovimiento", "Salida")
    .input("Cantidad", Cantidad)
    .input("UsuarioRegistro", UsuarioRegistro)
    .input("Motivo", `Venta TPV #${VentaID}`)
    .query(`
      INSERT INTO MovimientosInventario (ProductoID, TipoMovimiento, Cantidad, FechaMovimiento, Motivo, UsuarioRegistro)
      VALUES (@ProductoID, @TipoMovimiento, @Cantidad, GETDATE(), @Motivo, @UsuarioRegistro)
    `);
}

// [POST] /api/admin/ventas
// Procesa la venta, registra los detalles y actualiza el inventario
export async function POST(request: Request) {
  // Asumimos que obtienes el UsuarioRegistroID del administrador de la sesión
  const USUARIO_REGISTRO_ID = 1; // **IMPORTANTE: Reemplazar con la ID real del usuario logueado**
  
  try {
    const body: VentaRequest = await request.json();
    const { socioID, montoTotal, metodoPago, carrito } = body;

    if (carrito.length === 0 || montoTotal <= 0) {
      return new NextResponse("El carrito no debe estar vacío y el monto debe ser positivo.", { status: 400 });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // 1. GENERAR NÚMERO DE COMPROBANTE Y REGISTRAR VENTA (Cabecera)

      // a. Obtener el último VentaID para generar el número de comprobante (opcional, si no usas una secuencia)
      const lastVentaResult = await transaction.request()
        .query(`SELECT ISNULL(MAX(VentaID), 0) as lastId FROM Ventas`);
      const nextVentaID = lastVentaResult.recordset[0].lastId + 1;
      const numeroComprobante = `VTA-${nextVentaID.toString().padStart(5, '0')}`;
      
      // b. Insertar en la tabla Ventas
      const ventaResult = await transaction.request()
        .input("SocioID", socioID || null)
        .input("MontoTotal", montoTotal)
        .input("MetodoPago", metodoPago)
        .input("UsuarioRegistro", USUARIO_REGISTRO_ID)
        .input("NumeroComprobante", numeroComprobante)
        .input("TipoVenta", 'Producto')
        .query(`
          INSERT INTO Ventas (SocioID, MontoTotal, MetodoPago, UsuarioRegistro, NumeroComprobante, TipoVenta, FechaVenta)
          VALUES (@SocioID, @MontoTotal, @MetodoPago, @UsuarioRegistro, @NumeroComprobante, @TipoVenta, GETDATE());
          
          SELECT SCOPE_IDENTITY() as VentaID; -- Obtener el ID recién creado
        `);

      const ventaID = ventaResult.recordset[0].VentaID;
      if (!ventaID) throw new Error("No se pudo obtener el VentaID.");

      // 2. PROCESAR CARRO: INSERTAR DETALLE, REDUCIR STOCK Y REGISTRAR MOVIMIENTO
      for (const item of carrito) {
        // Validación de Stock (se puede hacer antes de la transacción para mejorar performance)
        const stockCheck = await transaction.request()
          .input("ProductoID", item.productoID)
          .query(`SELECT StockActual FROM Inventario WHERE ProductoID = @ProductoID`);
        
        const currentStock = stockCheck.recordset[0]?.StockActual || 0;

        if (currentStock < item.cantidad) {
            // Si el stock es insuficiente, lanzamos un error y la transacción hará rollback
            throw new Error(`Stock insuficiente para el producto ID ${item.productoID}. Disponible: ${currentStock}, Solicitado: ${item.cantidad}.`);
        }

        // i. Insertar en DetalleVenta
        await transaction.request()
          .input("VentaID", ventaID)
          .input("ProductoID", item.productoID)
          .input("Cantidad", item.cantidad)
          .input("PrecioUnitario", item.precioUnitario)
          .input("Subtotal", item.subtotal)
          .query(`
            INSERT INTO DetalleVenta (VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal)
            VALUES (@VentaID, @ProductoID, @Cantidad, @PrecioUnitario, @Subtotal)
          `);

        // ii. Reducir Stock en Inventario (Tu consulta C)
        await transaction.request()
          .input("ProductoID", item.productoID)
          .input("CantidadVendida", item.cantidad)
          .query(`
            UPDATE Inventario
            SET StockActual = StockActual - @CantidadVendida
            WHERE ProductoID = @ProductoID
          `);

        // iii. Registrar Movimiento de Inventario
        await registrarMovimiento(transaction, item.productoID, item.cantidad, USUARIO_REGISTRO_ID, ventaID);
      }

      // 3. CONFIRMAR TRANSACCIÓN
      await transaction.commit();

      return NextResponse.json({ ventaID: ventaID, message: "Venta procesada exitosamente" });

    } catch (innerError) {
      // 4. ROLLBACK EN CASO DE ERROR
      await transaction.rollback();
      console.error("[VENTAS_TRANSACTION_ERROR]", innerError);
      
      const errorMessage = innerError instanceof Error ? innerError.message : "Error desconocido al procesar la transacción.";
      
      return new NextResponse(errorMessage, { status: 400 }); 
    }

  } catch (error) {
    console.error("[VENTAS_POST_ERROR]", error);
    return new NextResponse("Error de conexión o datos inválidos.", { status: 500 });
  }
}