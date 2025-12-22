import type React from "react"

interface QrCodeQuickChartProps {
  value: string
  size?: number
}

const QUICKCHART_BASE_URL = "https://quickchart.io/qr"
export const QrCodeQuickChart: React.FC<QrCodeQuickChartProps> = ({ value, size = 256 }) => {
  if (!value) {
    return <p className="text-red-500">No hay valor de Código QR asignado.</p>
  }
  const encodedValue = encodeURIComponent(value)
  const qrCodeUrl = `${QUICKCHART_BASE_URL}?text=${encodedValue}&size=${size}`

  return (
    <div className="flex justify-center items-center">
      {}
      <img
        src={qrCodeUrl}
        alt={`Código QR para el socio con valor: ${value}`}
        width={size}
        height={size}
        className="block"
      />
    </div>
  )
}
