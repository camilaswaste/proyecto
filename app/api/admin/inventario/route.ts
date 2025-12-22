import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

async function crearNotificacionStockBajo(pool: any, producto: any) {
  try {
    if (producto.StockActual <= producto.StockMinimo) {
      await pool
        .request()
        .input("tipoEvento", "StockCritico")
        .input("titulo", "Stock Crítico")
        .input(
          "mensaje",
          `El producto "${producto.NombreProducto}" tiene stock crítico (${producto.StockActual} unidades, mínimo: ${producto.StockMinimo})`,
        )
        .input("tipoUsuario", "Admin")
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM Notificaciones 
            WHERE TipoEvento = @tipoEvento 
            AND Mensaje LIKE '%${producto.NombreProducto}%'
            AND Leida = 0
            AND DATEDIFF(hour, FechaCreacion, GETDATE()) < 24
          )
          BEGIN
            INSERT INTO Notificaciones (TipoEvento, Titulo, Mensaje, TipoUsuario, UsuarioID, Leida, FechaCreacion)
            VALUES (@tipoEvento, @titulo, @mensaje, @tipoUsuario, NULL, 0, GETDATE())
          END
        `)
    } else if (producto.StockActual <= producto.StockMinimo * 1.5) {
      await pool
        .request()
        .input("tipoEvento", "StockBajo")
        .input("titulo", "Stock Bajo")
        .input(
          "mensaje",
          `El producto "${producto.NombreProducto}" tiene stock bajo (${producto.StockActual} unidades, mínimo: ${producto.StockMinimo})`,
        )
        .input("tipoUsuario", "Admin")
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM Notificaciones 
            WHERE TipoEvento = @tipoEvento 
            AND Mensaje LIKE '%${producto.NombreProducto}%'
            AND Leida = 0
            AND DATEDIFF(hour, FechaCreacion, GETDATE()) < 24
          )
          BEGIN
            INSERT INTO Notificaciones (TipoEvento, Titulo, Mensaje, TipoUsuario, UsuarioID, Leida, FechaCreacion)
            VALUES (@tipoEvento, @titulo, @mensaje, @tipoUsuario, NULL, 0, GETDATE())
          END
        `)
    }
  } catch (error) {
    console.error("Error al crear notificación:", error)
  }
}

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        i.ProductoID,
        i.NombreProducto,
        i.Descripcion,
        i.CategoriaID,
        c.NombreCategoria,
        c.TipoCategoria,
        i.StockActual,
        i.PrecioVenta,
        i.StockMinimo,
        i.UnidadMedida,
        i.Estado,
        i.FechaCreacion
      FROM Inventario i
      INNER JOIN CategoriasInventario c ON i.CategoriaID = c.CategoriaID
      ORDER BY i.NombreProducto ASC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener inventario:", error)
    return NextResponse.json({ error: "Error al obtener inventario" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombreProducto, descripcion, categoriaID, stockActual, precioVenta, stockMinimo, unidadMedida } = body

    const pool = await getConnection()

    await pool
      .request()
      .input("nombreProducto", nombreProducto)
      .input("descripcion", descripcion || null)
      .input("categoriaID", categoriaID)
      .input("stockActual", stockActual)
      .input("precioVenta", precioVenta || null)
      .input("stockMinimo", stockMinimo)
      .input("unidadMedida", unidadMedida || null)
      .input("estado", "Disponible")
      .query(`
        INSERT INTO Inventario (CategoriaID, NombreProducto, Descripcion, PrecioVenta, StockActual, StockMinimo, UnidadMedida, Estado, FechaCreacion)
        VALUES (@categoriaID, @nombreProducto, @descripcion, @precioVenta, @stockActual, @stockMinimo, @unidadMedida, @estado, GETDATE())
      `)

    await crearNotificacionStockBajo(pool, {
      NombreProducto: nombreProducto,
      StockActual: Number.parseInt(stockActual),
      StockMinimo: Number.parseInt(stockMinimo),
    })

    return NextResponse.json({ success: true, message: "Producto creado exitosamente" })
  } catch (error) {
    console.error("Error al crear producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      productoID,
      nombreProducto,
      descripcion,
      categoriaID,
      stockActual,
      precioVenta,
      stockMinimo,
      unidadMedida,
      estado,
    } = body

    const pool = await getConnection()

    await pool
      .request()
      .input("productoID", productoID)
      .input("nombreProducto", nombreProducto)
      .input("descripcion", descripcion)
      .input("categoriaID", categoriaID)
      .input("stockActual", stockActual)
      .input("precioVenta", precioVenta)
      .input("stockMinimo", stockMinimo)
      .input("unidadMedida", unidadMedida)
      .input("estado", estado)
      .query(`
        UPDATE Inventario
        SET NombreProducto = @nombreProducto, Descripcion = @descripcion, CategoriaID = @categoriaID,
            StockActual = @stockActual, PrecioVenta = @precioVenta, StockMinimo = @stockMinimo, 
            UnidadMedida = @unidadMedida, Estado = @estado
        WHERE ProductoID = @productoID
      `)

    await crearNotificacionStockBajo(pool, {
      NombreProducto: nombreProducto,
      StockActual: Number.parseInt(stockActual),
      StockMinimo: Number.parseInt(stockMinimo),
    })

    return NextResponse.json({ success: true, message: "Producto actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productoID = searchParams.get("productoID")

    if (!productoID) {
      return NextResponse.json({ error: "ProductoID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("productoID", productoID)
      .query(`
        DELETE FROM Inventario
        WHERE ProductoID = @productoID
      `)

    return NextResponse.json({ success: true, message: "Producto eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
