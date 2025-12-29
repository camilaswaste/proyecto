import crypto from "crypto"

// Función auxiliar para crear firma HMAC
function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest()
}

// Función auxiliar para hash SHA256
function hash(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex")
}

// Genera la firma AWS v4
function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmac("AWS4" + key, dateStamp)
  const kRegion = hmac(kDate, regionName)
  const kService = hmac(kRegion, serviceName)
  const kSigning = hmac(kService, "aws4_request")
  return kSigning
}

async function uploadToS3WithSignature(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION || "sa-east-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN // Agregado soporte para session token de AWS Academy

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Faltan credenciales de AWS. Verifica AWS_S3_BUCKET, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY")
  }

  const host = `${bucket}.s3.${region}.amazonaws.com`
  const url = `https://${host}/${key}`

  // Fecha en formato AWS
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.substring(0, 8)

  // Canonical request
  const method = "PUT"
  const canonicalUri = `/${key}`
  const canonicalQuerystring = ""
  const canonicalHeaders =
    `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n` +
    (sessionToken ? `x-amz-security-token:${sessionToken}\n` : "")
  const signedHeaders = sessionToken
    ? "content-type;host;x-amz-date;x-amz-security-token"
    : "content-type;host;x-amz-date"

  const payloadHash = crypto.createHash("sha256").update(Buffer.from(body)).digest("hex")

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  // String to sign
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [algorithm, amzDate, credentialScope, hash(canonicalRequest)].join("\n")

  // Calcular firma
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, "s3")
  const signature = hmac(signingKey, stringToSign).toString("hex")

  // Authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Headers para la petición
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "x-amz-date": amzDate,
    Authorization: authorization,
    "x-amz-content-sha256": payloadHash,
  }

  if (sessionToken) {
    headers["x-amz-security-token"] = sessionToken
  }

  console.log("[v0] Uploading to S3:", url)
  console.log("[v0] Using session token:", sessionToken ? "Yes" : "No")

  // Hacer la petición PUT
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] S3 Error:", response.status, errorText)
    throw new Error(`Error al subir a S3: ${response.status} ${response.statusText}`)
  }

  console.log("[v0] Upload successful:", url)

  return { url, key }
}

export async function uploadComprobantePDF(
  tipo: "planes" | "productos",
  pagoID: number,
  pdfBytes: Uint8Array,
): Promise<{ url: string; key: string }> {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const key = `comprobantes/${tipo}/${year}/comprobante-${pagoID}.pdf`

  return await uploadToS3WithSignature(key, pdfBytes, "application/pdf")
}

export async function uploadFotoPerfil(file: File): Promise<{ url: string; key: string }> {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000000000)
  const extension = file.name.split(".").pop() || "jpg"
  const fileName = `entre-${timestamp}-${randomNum}.${extension}`
  const key = `fotoPerfil/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return await uploadToS3WithSignature(key, buffer, file.type)
}

export async function uploadFotoPerfilToS3(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000000000)
  const extension = fileName.split(".").pop() || "jpg"
  const uniqueFileName = `perfil-${timestamp}-${randomNum}.${extension}`
  const key = `fotoPerfil/${uniqueFileName}`

  const buffer = Buffer.from(arrayBuffer)

  return await uploadToS3WithSignature(key, buffer, contentType)
}
