// app/api/admin/inventario/movimientos/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

type TipoMovimiento = "Entrada" | "Salida" | "Ajuste"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const productoID = Number(body?.productoID)
    const tipoMovimiento = (body?.tipoMovimiento as TipoMovimiento) || "Entrada"
    const cantidad = Number(body?.cantidad)
    const motivo = (body?.motivo as string) || null
    const usuarioRegistro = body?.usuarioRegistro ? Number(body.usuarioRegistro) : null

    if (!productoID || Number.isNaN(productoID)) {
      return NextResponse.json({ error: "productoID inválido" }, { status: 400 })
    }

    if (!cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      return NextResponse.json({ error: "cantidad debe ser > 0" }, { status: 400 })
    }

    if (!["Entrada", "Salida", "Ajuste"].includes(tipoMovimiento)) {
      return NextResponse.json({ error: "tipoMovimiento inválido" }, { status: 400 })
    }

    const pool = await getConnection()
    const tx = new sql.Transaction(pool)

    await tx.begin()

    try {
      // 1) Obtener stock actual con lock (evita condiciones de carrera)
      const stockRes = await new sql.Request(tx)
        .input("ProductoID", sql.Int, productoID)
        .query(`
          SELECT StockActual, StockMinimo, NombreProducto
          FROM Inventario WITH (UPDLOCK, ROWLOCK)
          WHERE ProductoID = @ProductoID
        `)

      const producto = stockRes.recordset?.[0]
      if (!producto) {
        await tx.rollback()
        return NextResponse.json({ error: "Producto no existe" }, { status: 404 })
      }

      const stockActual = Number(producto.StockActual ?? 0)

      // 2) Calcular nuevo stock según tipo
      let nuevoStock = stockActual
      if (tipoMovimiento === "Entrada") {
        nuevoStock = stockActual + cantidad
      } else if (tipoMovimiento === "Salida") {
        nuevoStock = stockActual - cantidad
        if (nuevoStock < 0) {
          await tx.rollback()
          return NextResponse.json({ error: "No puedes dejar el stock negativo" }, { status: 400 })
        }
      } else {
        // Ajuste: interpreta "cantidad" como el nuevo stock (si prefieres otra lógica, dímelo)
        nuevoStock = cantidad
      }

      // 3) Update inventario
      await new sql.Request(tx)
        .input("ProductoID", sql.Int, productoID)
        .input("StockActual", sql.Int, nuevoStock)
        .query(`
          UPDATE Inventario
          SET StockActual = @StockActual
          WHERE ProductoID = @ProductoID
        `)

      // 4) Insert movimiento
      await new sql.Request(tx)
        .input("ProductoID", sql.Int, productoID)
        .input("TipoMovimiento", sql.NVarChar(20), tipoMovimiento)
        .input("Cantidad", sql.Int, cantidad)
        .input("Motivo", sql.NVarChar(255), motivo)
        .input("UsuarioRegistro", sql.Int, usuarioRegistro)
        .query(`
          INSERT INTO MovimientosInventario (ProductoID, TipoMovimiento, Cantidad, Motivo, UsuarioRegistro, FechaMovimiento)
          VALUES (@ProductoID, @TipoMovimiento, @Cantidad, @Motivo, @UsuarioRegistro, GETDATE())
        `)

      await tx.commit()

      return NextResponse.json({
        success: true,
        productoID,
        tipoMovimiento,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
      })
    } catch (err) {
      await tx.rollback()
      console.error("TX inventario/movimientos error:", err)
      return NextResponse.json({ error: "Error registrando movimiento" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error inventario/movimientos:", error)
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}