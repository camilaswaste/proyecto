import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Políticas de Privacidad</h1>
          <p className="text-lg text-white/90">Protección de tus datos personales</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              1. Información que Recopilamos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>1.1 Información Personal:</strong> Al registrarse en Mundo Fitness Chimbarongo, recopilamos
              información personal que incluye:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Nombre completo</li>
              <li>RUT (Rol Único Tributario)</li>
              <li>Fecha de nacimiento</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Fotografía para credencial de socio</li>
            </ul>
            <p>
              <strong>1.2 Información de Uso:</strong> Registramos información sobre su uso de nuestras instalaciones,
              incluyendo asistencia, clases reservadas y pagos realizados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Uso de la Información</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>Utilizamos su información personal para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Gestionar su membresía y acceso a las instalaciones</li>
              <li>Procesar pagos y facturación</li>
              <li>Programar clases y sesiones de entrenamiento</li>
              <li>Comunicar avisos importantes sobre el gimnasio</li>
              <li>Enviar información sobre nuevos servicios y promociones</li>
              <li>Mejorar nuestros servicios y experiencia del cliente</li>
              <li>Cumplir con obligaciones legales y tributarias</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Protección de Datos</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>3.1 Seguridad:</strong> Implementamos medidas de seguridad técnicas y organizativas para proteger
              su información personal contra acceso no autorizado, pérdida o alteración.
            </p>
            <p>
              <strong>3.2 Acceso Limitado:</strong> Solo el personal autorizado de Mundo Fitness Chimbarongo tiene
              acceso a su información personal, y únicamente para los fines descritos en esta política.
            </p>
            <p>
              <strong>3.3 Encriptación:</strong> Todas las contraseñas y datos sensibles se almacenan de forma
              encriptada en nuestros sistemas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Compartir Información</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              <strong>No compartimos, vendemos ni alquilamos</strong> su información personal a terceros, excepto en los
              siguientes casos:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Cuando sea requerido por ley o autoridad competente</li>
              <li>Para procesar pagos a través de proveedores de servicios de pago autorizados</li>
              <li>Con su consentimiento explícito</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Derechos del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Acceso:</strong> Solicitar una copia de la información personal que tenemos sobre usted
              </li>
              <li>
                <strong>Rectificación:</strong> Solicitar la corrección de información inexacta o incompleta
              </li>
              <li>
                <strong>Eliminación:</strong> Solicitar la eliminación de su información personal (sujeto a obligaciones
                legales de retención)
              </li>
              <li>
                <strong>Oposición:</strong> Oponerse al procesamiento de su información para ciertos fines
              </li>
              <li>
                <strong>Portabilidad:</strong> Solicitar la transferencia de su información a otro proveedor de
                servicios
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Retención de Datos</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Conservamos su información personal durante el tiempo que sea necesario para cumplir con los fines
              descritos en esta política, y según lo requieran las leyes fiscales y comerciales aplicables en Chile.
            </p>
            <p>
              Después de la cancelación de su membresía, conservaremos cierta información básica por un período de 5
              años para cumplir con obligaciones legales.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Cookies y Tecnologías Similares</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Nuestro sistema web utiliza cookies y tecnologías similares para mejorar su experiencia de usuario,
              mantener su sesión activa y analizar el uso del sistema. Puede configurar su navegador para rechazar
              cookies, aunque esto puede afectar algunas funcionalidades.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Menores de Edad</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Para socios menores de 18 años, requerimos el consentimiento de un padre o tutor legal para recopilar y
              procesar su información personal.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Cambios a esta Política</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad periódicamente. Los cambios
              significativos serán notificados a través de correo electrónico o avisos en nuestras instalaciones.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Contacto</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-3">
            <p>Para ejercer sus derechos o realizar consultas sobre esta política, puede contactarnos:</p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:mundofitnesschimbarongo08@gmail.com" className="text-red-600 hover:underline">
                  mundofitnesschimbarongo08@gmail.com
                </a>
              </li>
              <li>
                <strong>Dirección:</strong> Calle Longitudinal Sur Km 155, Chimbarongo, Región de O'Higgins
              </li>
              <li>
                <strong>Instagram:</strong>{" "}
                <a
                  href="https://www.instagram.com/mundofitness_chimbarongo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  @mundofitness_chimbarongo
                </a>
              </li>
            </ul>
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
