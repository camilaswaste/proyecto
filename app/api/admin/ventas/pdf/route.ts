import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { uploadComprobantePDF } from "@/lib/s3"

export const runtime = "nodejs"

// Función auxiliar para dibujar texto y actualizar la posición Y
const createPdfRenderer = (pdfDoc: PDFDocument, page: any, font: any, fontBold: any) => {
    const { width, height } = page.getSize()
    let y = height - 50
    const fontSizeTitle = 20
    const fontSizeNormal = 10
    
    const drawText = (
        text: string,
        options: {
            x?: number
            yPos?: number
            size?: number
            bold?: boolean
            color?: { r: number; g: number; b: number }
        } = {}
    ) => {
        const {
            x = 50,
            yPos,
            size = fontSizeNormal,
            bold = false,
            color = { r: 0, g: 0, b: 0 },
        } = options

        page.drawText(text, {
            x,
            y: yPos ?? y,
            size,
            font: bold ? fontBold : font,
            color: rgb(color.r, color.g, color.b),
        })
        return yPos ?? y // Devuelve la Y usada
    }

    return { drawText, width, height };
}

// Función para formatear el dinero
const formatMoney = (m: number) => {
    return Number(m || 0).toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
    })
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "id (VentaID) es requerido" }, { status: 400 })
        }

        const ventaID = parseInt(id, 10)
        if (Number.isNaN(ventaID)) {
            return NextResponse.json({ error: "id inválido" }, { status: 400 })
        }

        const pool = await getConnection()

        // 1. OBTENER DATOS DE LA VENTA Y DETALLES
        const result = await pool
            .request()
            .input("VentaID", ventaID)
            .query(`
                SELECT 
                    V.VentaID,
                    V.SocioID,
                    V.NumeroComprobante,
                    V.FechaVenta,
                    V.MontoTotal AS Monto,
                    V.MetodoPago,
                    V.TipoVenta,
                    
                    -- Datos del Cliente/Socio
                    ISNULL(S.Nombre, 'Venta') AS Nombre,
                    ISNULL(S.Apellido, 'al Público') AS Apellido,
                    ISNULL(S.RUT, 'N/A') AS RUT,
                    ISNULL(S.Email, 'N/A') AS Email,
                    ISNULL(S.Telefono, 'N/A') AS Telefono,

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
                    V.VentaID = @VentaID;
            `)

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: "Comprobante de venta no encontrado" }, { status: 404 })
        }

        const cabecera = result.recordset[0]
        const detalles = result.recordset.map(row => ({
            NombreProducto: row.NombreProducto,
            Cantidad: row.Cantidad,
            PrecioUnitario: row.PrecioUnitario,
            Subtotal: row.Subtotal,
            UnidadMedida: row.UnidadMedida,
        }));


        // 2. CREAR PDF con pdf-lib
        const pdfDoc = await PDFDocument.create()
        let page = pdfDoc.addPage()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        let { drawText, width, height } = createPdfRenderer(pdfDoc, page, font, fontBold);
        
        let y = height - 50; // Posición Y de inicio
        const fontSizeTitle = 20
        const fontSizeNormal = 10
        const fontSizeSmall = 8
        
        // Encabezado izquierda (Empresa)
        drawText("MUNDO FITNESS", { x: 50, yPos: y, size: fontSizeTitle, bold: true })
        y -= 18
        drawText("Chimbarongo, Región de O'Higgins", { x: 50, yPos: y })
        y -= 12
        drawText("RUT: 76.XXX.XXX-X", { x: 50, yPos: y })

        // Encabezado derecha (datos del comprobante)
        const rightX = width - 250
        let yRight = height - 50
        drawText("COMPROBANTE DE VENTA", { x: rightX, yPos: yRight, size: 14, bold: true })
        yRight -= 14
        
        // MODIFICACIÓN CLAVE 1: Usar ventaID, que es el número seguro.
        const numeroComprobanteDisplay = cabecera.NumeroComprobante || `VTA-${ventaID}`; 
        drawText(numeroComprobanteDisplay, {
            x: rightX,
            yPos: yRight,
            size: 10,
        })
        yRight -= 12
        drawText(new Date(cabecera.FechaVenta).toLocaleString("es-CL"), {
            x: rightX,
            yPos: yRight,
            size: 10,
        })

        // Línea separadora
        y = Math.min(y, yRight) 
        y -= 28
        page.drawLine({
            start: { x: 50, y: y },
            end: { x: width - 50, y: y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        })
        y -= 25

        // Cliente
        drawText("Cliente", { x: 50, yPos: y, size: 12, bold: true })
        y -= 16
        drawText(`Nombre: ${cabecera.Nombre} ${cabecera.Apellido}`, { x: 50, yPos: y })
        y -= 12
        drawText(`RUT: ${cabecera.RUT}`, { x: 50, yPos: y })
        y -= 12
        drawText(`ID Venta: #${ventaID}`, { x: 50, yPos: y }) // Usamos ventaID, el valor entero
        // drawText(`ID Venta: #${cabecera.VentaID}`, { x: 50, yPos: y }) // Línea original
        
        // Resumen de Pago
        y -= 24
        drawText("Resumen de Pago", { x: 50, yPos: y, size: 12, bold: true })
        y -= 16
        drawText(`Método: ${cabecera.MetodoPago}`, { x: 50, yPos: y })
        y -= 12
        drawText("Estado: Pagado", { x: 50, yPos: y })
        y -= 20


        // 3. TABLA DE DETALLES DE PRODUCTOS
        
        // Encabezado de la tabla
        drawText("Detalle de Productos", { x: 50, yPos: y, size: 12, bold: true })
        y -= 15
        
        const colProducto = 50;
        const colCant = width - 200;
        const colPrecio = width - 150;
        const colTotal = width - 75;

        // Fila de encabezado de tabla
        page.drawRectangle({
            x: 50,
            y: y - fontSizeNormal,
            width: width - 100,
            height: fontSizeNormal + 4,
            color: rgb(0.95, 0.95, 0.95),
        })
        drawText("PRODUCTO", { x: colProducto, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } })
        drawText("CANT.", { x: colCant, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } })
        drawText("PRECIO UNIT.", { x: colPrecio, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } })
        drawText("TOTAL", { x: colTotal, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } })
        y -= 15;

        // Filas de detalles
        for (const item of detalles) {
            // Revisa si es necesario añadir una nueva página antes de dibujar el ítem
            if (y < 50) { 
                page = pdfDoc.addPage();
                // Necesitamos re-crear el renderer para usar la nueva página
                const newRenderer = createPdfRenderer(pdfDoc, page, font, fontBold);
                drawText = newRenderer.drawText;
                width = newRenderer.width;
                height = newRenderer.height;
                y = height - 50;
                
                // Redibujar encabezado de tabla en la nueva página
                page.drawRectangle({ x: 50, y: y - fontSizeNormal, width: width - 100, height: fontSizeNormal + 4, color: rgb(0.95, 0.95, 0.95) });
                drawText("PRODUCTO", { x: colProducto, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } });
                drawText("CANT.", { x: colCant, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } });
                drawText("PRECIO UNIT.", { x: colPrecio, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } });
                drawText("TOTAL", { x: colTotal, yPos: y, size: fontSizeSmall, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } });
                y -= 15;
            }

            drawText(item.NombreProducto, { x: colProducto, yPos: y, size: fontSizeNormal })
            drawText(`${item.Cantidad} ${item.UnidadMedida}`, { x: colCant, yPos: y, size: fontSizeNormal, x: colCant + 10 })
            drawText(formatMoney(item.PrecioUnitario), { x: colPrecio, yPos: y, size: fontSizeNormal, x: colPrecio + 10 })
            drawText(formatMoney(item.Subtotal), { x: colTotal, yPos: y, size: fontSizeNormal, x: colTotal + 10, bold: true })
            y -= 18;
        }
        
        // 4. TOTAL Y PIE DE PÁGINA
        y -= 15;
        page.drawLine({
            start: { x: width - 200, y: y },
            end: { x: width - 50, y: y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        })
        y -= 15

        drawText("TOTAL PAGADO:", { x: width - 200, yPos: y, size: 14, bold: true })
        drawText(formatMoney(cabecera.Monto), { x: width - 100, yPos: y, size: 14, bold: true, color: {r: 0.1, g: 0.5, b: 0.1} })
        y -= 40
        
        // Footer
        drawText("Documento generado electrónicamente. Gracias por su compra en Mundo Fitness.", {
            x: 50,
            yPos: y,
            size: 8,
            color: { r: 0.5, g: 0.5, b: 0.5 }
        })

        // 5. GUARDAR, SUBIR A S3 Y ACTUALIZAR BD
        const pdfBytes = await pdfDoc.save() 
        const tipo: "planes" | "productos" = "productos" 

        const { url: pdfUrl } = await uploadComprobantePDF(tipo, ventaID, pdfBytes)

        // 6. ACTUALIZAR Ventas y Comprobantes
        
        // Actualizar la tabla Ventas con la ruta del comprobante
        await pool
            .request()
            .input("url", pdfUrl)
            .input("VentaID", ventaID)
            .query(`
                UPDATE Ventas
                SET ComprobantePath = @url
                WHERE VentaID = @VentaID;
            `)

        // Insertar registro en la tabla Comprobantes (requiere que Comprobantes haya sido modificado)
        // MODIFICACIÓN CLAVE 2: Usar ventaID, el número seguro de la URL.
        const numeroComprobante = cabecera.NumeroComprobante ?? `VTA-${ventaID}`
        const nombreCliente = `${cabecera.Nombre} ${cabecera.Apellido}`.trim()

        await pool.request()
            .input("VentaID", ventaID) // Usar ventaID
            .input("SocioID", cabecera.SocioID ?? null) 
            .input("PagoID", null) 
            // CORRECCIÓN DEL ERROR DE MEMBRESÍA: Declarar explícitamente las variables de Membresía como NULL
            .input("MembresíaID", null)       
            .input("NombrePlan", null)        
            .input("DuracionPlan", null)      
            .input("FechaInicio", null)       
            .input("FechaVencimiento", null)  
            // FIN CORRECCIÓN
            .input("NumeroComprobante", numeroComprobante)
            .input("MontoPago", cabecera.Monto)
            .input("MedioPago", cabecera.MetodoPago)
            .input("NombreSocio", nombreCliente)
            .input("EmailSocio", cabecera.Email === 'N/A' ? null : cabecera.Email)
            .input("TelefonoSocio", cabecera.Telefono === 'N/A' ? null : cabecera.Telefono)
            .input("Concepto", "Venta de Productos")
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Comprobantes WHERE VentaID = @VentaID)
                BEGIN
                    INSERT INTO Comprobantes (
                        VentaID,
                        PagoID,
                        SocioID,
                        MembresíaID,       
                        NumeroComprobante,
                        FechaEmision,
                        MontoPago,
                        MedioPago,
                        NombreSocio,
                        EmailSocio,
                        TelefonoSocio,
                        NombrePlan,        
                        DuracionPlan,      
                        FechaInicio,       
                        FechaVencimiento,  
                        Concepto,
                        Estado,
                        FechaCreacion
                    )
                    VALUES (
                        @VentaID,
                        @PagoID,
                        @SocioID,
                        @MembresíaID,      
                        @NumeroComprobante,
                        GETDATE(),
                        @MontoPago,
                        @MedioPago,
                        @NombreSocio,
                        @EmailSocio,
                        @TelefonoSocio,
                        @NombrePlan,       
                        @DuracionPlan,     
                        @FechaInicio,      
                        @FechaVencimiento, 
                        @Concepto,
                        'Emitido',
                        GETDATE()
                    )
                END
            `)


        // 7. DEVOLVER PDF
        return new NextResponse(pdfBytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="comprobante-venta-${ventaID}.pdf"`,
                "x-comprobante-url": pdfUrl,
            },
        })
    } catch (err) {
        // PUNTO CLAVE: LOG DEL ERROR REAL EN EL SERVIDOR
        console.error("================================================")
        console.error("Error al generar PDF de Venta:", err)
        console.error("================================================")
        
        // El servidor siempre debe devolver JSON con 500 en caso de fallo.
        return NextResponse.json({ 
            error: "Error interno al generar PDF de Venta. Consulte el log del servidor." 
        }, {
            status: 500
        })
    }
}