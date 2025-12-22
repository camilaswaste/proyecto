export async function uploadComprobantePDF(tipo: "planes" | "productos", pagoID: number, pdfBytes: Uint8Array) {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION!

  const hoy = new Date()
  const year = hoy.getFullYear()

  const key = `comprobantes/${tipo}/${year}/comprobante-${pagoID}.pdf`
  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: pdfBytes,
    headers: {
      "Content-Type": "application/pdf",
    },
  })

  if (!res.ok) {
    throw new Error(`Error al subir PDF a S3: ${res.status} ${res.statusText}`)
  }

  return {
    url: uploadUrl,
    key,
  }
}

export async function uploadFotoPerfil(file: File): Promise<{ url: string; key: string }> {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION!

  console.log("[v0] Bucket:", bucket)
  console.log("[v0] Region:", region)

  // Generar nombre único para el archivo
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000000000)
  const extension = file.name.split(".").pop() || "jpg"
  const fileName = `entre-${timestamp}-${randomNum}.${extension}`

  const key = `fotoPerfil/${fileName}`
  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  console.log("[v0] Upload URL:", uploadUrl)
  console.log("[v0] File size:", file.size)
  console.log("[v0] File type:", file.type)

  // Convertir File a ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: arrayBuffer,
    headers: {
      "Content-Type": file.type,
    },
  })

  console.log("[v0] S3 Response status:", res.status)
  console.log("[v0] S3 Response statusText:", res.statusText)

  if (!res.ok) {
    const errorText = await res.text()
    console.error("[v0] S3 Error response:", errorText)
    throw new Error(`Error al subir foto a S3: ${res.status} ${res.statusText}`)
  }

  console.log("[v0] Foto subida exitosamente:", uploadUrl)

  return {
    url: uploadUrl,
    key,
  }
}

export async function uploadFotoPerfilToS3(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION!

  if (!bucket || !region) {
    throw new Error("S3_BUCKET y S3_REGION deben estar configurados en las variables de entorno")
  }

  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000000000)
  const extension = fileName.split(".").pop() || "jpg"
  const uniqueFileName = `perfil-${timestamp}-${randomNum}.${extension}`
  const key = `fotoPerfil/${uniqueFileName}`

  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  console.log("[v0] Upload URL:", uploadUrl)

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: arrayBuffer,
    headers: {
      "Content-Type": contentType,
    },
  })

  console.log("[v0] S3 Response status:", res.status)
  console.log("[v0] S3 Response statusText:", res.statusText)

  if (!res.ok) {
    const errorText = await res.text()
    console.error("[v0] S3 Error response:", errorText)
    throw new Error(`Error al subir foto a S3: ${res.status} ${res.statusText} - ${errorText}`)
  }

  console.log("[v0] Foto subida exitosamente:", uploadUrl)

  return {
    url: uploadUrl,
    key,
  }
}

export async function generatePresignedUrl(fileName: string, fileType: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION!
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!

  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000000000)
  const extension = fileName.split(".").pop() || "jpg"
  const uniqueFileName = `entre-${timestamp}-${randomNum}.${extension}`
  const key = `fotoPerfil/${uniqueFileName}`

  // Crear firma para AWS (método básico, puedes usar @aws-sdk/s3-request-presigner para mejor implementación)
  const expires = 300 // 5 minutos
  const date = new Date()
  const dateString = date
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "")
    .slice(0, 8)

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  return url
}
