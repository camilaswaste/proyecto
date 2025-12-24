import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Términos y Condiciones</h1>
          <p className="text-lg text-white/90">Mundo Fitness Chimbarongo</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              1. Aceptación de los Términos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Al registrarse y utilizar los servicios de Mundo Fitness Chimbarongo, usted acepta estar sujeto a estos
              Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, le recomendamos no utilizar
              nuestros servicios.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Membresías y Pagos</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>2.1 Tipos de Membresía:</strong> Ofrecemos diferentes planes de membresía (diaria, semanal,
              mensual, trimestral, semestral y anual). Los detalles y precios están disponibles en nuestras
              instalaciones y plataforma digital.
            </p>
            <p>
              <strong>2.2 Pagos:</strong> Los pagos deben realizarse por adelantado según el plan seleccionado. Los
              métodos de pago aceptados incluyen efectivo, transferencia bancaria y tarjeta.
            </p>
            <p>
              <strong>2.3 Renovación:</strong> Las membresías no se renuevan automáticamente. Es responsabilidad del
              socio renovar su membresía antes de su vencimiento.
            </p>
            <p>
              <strong>2.4 Reembolsos:</strong> No se realizan reembolsos por membresías ya pagadas, salvo casos
              excepcionales evaluados por la administración.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Uso de las Instalaciones</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>3.1 Horarios:</strong> El gimnasio opera según los horarios publicados. Nos reservamos el derecho
              de modificar los horarios por mantenimiento o eventos especiales, notificando con anticipación.
            </p>
            <p>
              <strong>3.2 Edad Mínima:</strong> Los socios deben tener al menos 13 años de edad. Los menores de 18 años
              requieren autorización de un padre o tutor.
            </p>
            <p>
              <strong>3.3 Conducta:</strong> Se espera que todos los socios mantengan un comportamiento respetuoso hacia
              otros miembros, personal y las instalaciones. Nos reservamos el derecho de suspender o cancelar la
              membresía de cualquier persona que viole este principio.
            </p>
            <p>
              <strong>3.4 Equipamiento:</strong> El uso inadecuado del equipo puede resultar en lesiones. Los socios
              deben seguir las instrucciones de los entrenadores y usar el equipamiento de manera responsable.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Clases y Entrenamientos</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>4.1 Reservas:</strong> Las clases grupales y sesiones con entrenadores requieren reserva previa.
              Las cancelaciones deben hacerse con al menos 2 horas de anticipación.
            </p>
            <p>
              <strong>4.2 Disponibilidad:</strong> Las clases están sujetas a disponibilidad de cupo y pueden ser
              modificadas o canceladas por el gimnasio con previo aviso.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Salud y Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>5.1 Condición Física:</strong> Es responsabilidad del socio asegurarse de estar en condiciones
              físicas adecuadas para realizar actividades deportivas. Recomendamos consultar con un médico antes de
              iniciar cualquier programa de ejercicio.
            </p>
            <p>
              <strong>5.2 Lesiones:</strong> Mundo Fitness Chimbarongo no se hace responsable por lesiones ocurridas por
              mal uso del equipamiento o no seguir las indicaciones de los entrenadores.
            </p>
            <p>
              <strong>5.3 Emergencias:</strong> En caso de emergencia médica, nuestro personal está capacitado para
              brindar primeros auxilios y contactar servicios de emergencia.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Suspensión de Membresías</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Los socios pueden solicitar la suspensión temporal de su membresía por motivos médicos (presentando
              certificado médico) o viaje prolongado. La suspensión debe solicitarse con anticipación y está sujeta a
              aprobación de la administración.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Modificaciones a los Términos</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Mundo Fitness Chimbarongo se reserva el derecho de modificar estos Términos y Condiciones en cualquier
              momento. Los cambios serán notificados a través de avisos en el gimnasio y/o por correo electrónico.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Contacto</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700">
            <p>
              Para cualquier consulta sobre estos términos, puede contactarnos en:{" "}
              <a href="mailto:mundofitnesschimbarongo08@gmail.com" className="text-red-600 hover:underline">
                mundofitnesschimbarongo08@gmail.com
              </a>
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Link href="/login">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
        </div>

        <p className="text-center text-sm text-slate-500 pt-4">
          Última actualización: {new Date().toLocaleDateString("es-CL")}
        </p>
      </div>
    </div>
  )
}
