"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, User, Calendar, Receipt, Printer } from "lucide-react"

// Definición de la interfaz de datos de pago
interface ComprobantePago {
  PagoID: number;
  FechaPago: string;
  MontoPago: number;
  MedioPago: string;
  Concepto: string;
  SocioNombre: string;
  SocioApellido: string;
  SocioRUT: string;
  SocioEmail: string;
}

export default function ComprobantePagoPage() {
  const params = useParams();
  const pagoID = params.pagoId as string;
  
  const [comprobante, setComprobante] = useState<ComprobantePago | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pagoID) {
      fetchComprobante(pagoID);
    }
  }, [pagoID]);

  const fetchComprobante = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pagos/receipt?pagoID=${id}`);
      if (response.ok) {
        const data = await response.json();
        setComprobante(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "No se pudo cargar el comprobante.");
      }
    } catch (err) {
      console.error("Error fetching comprobante:", err);
      setError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando comprobante...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="Administrador">
        <div className="p-6 text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!comprobante) {
    return (
      <DashboardLayout role="Administrador">
        <div className="p-6 text-center text-gray-500">Comprobante no disponible.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center print:hidden">
            <h1 className="text-3xl font-bold">Comprobante de Pago</h1>
            <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / Guardar PDF
            </Button>
        </div>

        {/* Contenedor del Comprobante para Imprimir */}
        <Card className="shadow-lg border-2 border-primary">
          <CardHeader className="bg-primary text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
                <Receipt className="w-6 h-6 mr-3" />
                Recibo #{comprobante.PagoID}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Sección de la Transacción */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> Fecha de Pago
                </p>
                <p className="text-lg font-semibold">{formatDate(comprobante.FechaPago)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 flex items-center justify-end">
                  <DollarSign className="w-4 h-4 mr-2" /> Medio de Pago
                </p>
                <p className="text-lg font-semibold">{comprobante.MedioPago}</p>
              </div>
            </div>

            {/* Sección del Socio */}
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-xl font-semibold flex items-center text-primary">
                <User className="w-5 h-5 mr-2" /> Información del Socio
              </h3>
              <p><strong>Socio:</strong> {comprobante.SocioNombre} {comprobante.SocioApellido}</p>
              <p><strong>RUT:</strong> {comprobante.SocioRUT}</p>
              <p><strong>Email:</strong> {comprobante.SocioEmail}</p>
            </div>

            {/* Sección de Concepto y Monto */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-primary">Detalle del Pago</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-600">Concepto</p>
                  <p className="text-lg">{comprobante.Concepto}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-600">Monto Pagado</p>
                  <p className="text-3xl font-extrabold text-green-600">
                    ${comprobante.MontoPago.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm italic text-gray-400 pt-4">
                Documento no válido como factura. Comprobante interno de transacción.
            </p>

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}