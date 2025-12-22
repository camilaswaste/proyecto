import { type NextRequest, NextResponse } from "next/server"
import { uploadFotoPerfil } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload request received")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] No file in formData")
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.size, file.type)

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Validar tipo de archivo (solo imágenes)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      console.error("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "Invalid file type. Only images allowed" }, { status: 400 })
    }

    console.log("[v0] Starting S3 upload")
    const { url } = await uploadFotoPerfil(file)
    console.log("[v0] Upload successful, returning URL:", url)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error uploading file" },
      { status: 500 },
    )
  }
}
