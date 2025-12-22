import { getConnection } from "@/lib/db"
import { uploadFotoPerfilToS3 } from "@/lib/s3"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const usuarioID = formData.get("usuarioID") as string
    const socioID = formData.get("socioID") as string
    const entrenadorID = formData.get("entrenadorID") as string
    const userType = formData.get("userType") as string

    console.log("[v0] Received upload request for userType:", userType)

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP" },
        { status: 400 },
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB" }, { status: 400 })
    }

    console.log("[v0] File validation passed. Size:", file.size, "Type:", file.type)

    const arrayBuffer = await file.arrayBuffer()

    console.log("[v0] Uploading to S3...")

    // Subir a S3
    const { url, key } = await uploadFotoPerfilToS3(arrayBuffer, file.name, file.type)

    console.log("[v0] Upload successful. URL:", url)

    // Actualizar base de datos según el tipo de usuario
    const pool = await getConnection()

    if (userType === "admin" && usuarioID) {
      await pool
        .request()
        .input("usuarioID", sql.Int, Number.parseInt(usuarioID))
        .input("fotoURL", sql.NVarChar, url)
        .query(`
          UPDATE Usuarios
          SET FotoPerfil = @fotoURL
          WHERE UsuarioID = @usuarioID
        `)
      console.log("[v0] Admin photo updated in database")
    } else if (userType === "socio" && socioID) {
      await pool
        .request()
        .input("socioID", sql.Int, Number.parseInt(socioID))
        .input("fotoURL", sql.NVarChar, url)
        .query(`
          UPDATE Socios
          SET FotoURL = @fotoURL
          WHERE SocioID = @socioID
        `)
      console.log("[v0] Socio photo updated in database")
    } else if (userType === "entrenador" && entrenadorID) {
      await pool
        .request()
        .input("entrenadorID", sql.Int, Number.parseInt(entrenadorID))
        .input("fotoURL", sql.NVarChar, url)
        .query(`
          UPDATE Entrenadores
          SET FotoURL = @fotoURL
          WHERE EntrenadorID = @entrenadorID
        `)
      console.log("[v0] Entrenador photo updated in database")
    } else {
      return NextResponse.json({ error: "Tipo de usuario inválido o ID no proporcionado" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Foto de perfil actualizada exitosamente",
      url,
      key,
    })
  } catch (error: any) {
    console.error("[v0] Error al subir foto de perfil:", error)
    return NextResponse.json({ error: error.message || "Error al subir foto de perfil" }, { status: 500 })
  }
}
