import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Building2, Eye, Target, Users } from "lucide-react"
import Link from "next/link"

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Sobre Nosotros</h1>
          <p className="text-lg text-white/90">Conoce la historia de Mundo Fitness Chimbarongo</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Historia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              Nuestra Historia
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none text-slate-700">
            <p>
              Mundo Fitness Chimbarongo fue fundado el <strong>26 de febrero de 2024</strong> por{" "}
              <strong>Juan Pablo Fuentes</strong> y <strong>Álvaro Gangas</strong>, con el objetivo de ofrecer servicios
              de acondicionamiento físico y actividades deportivas a la comunidad local de Chimbarongo.
            </p>
            <p>
              Desde nuestra apertura, hemos buscado brindar un espacio equipado con máquinas de musculación, zonas de
              entrenamiento funcional, clases grupales y programas personalizados dirigidos por entrenadores
              certificados.
            </p>
            <p>
              Ubicados en <strong>Calle Longitudinal Sur Km 155</strong>, en la Región de O'Higgins, nos enorgullecemos
              de ser el primer centro de acondicionamiento físico integral de Chimbarongo.
            </p>
          </CardContent>
        </Card>

        {/* Misión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Nuestra Misión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Ofrecer servicios de acondicionamiento físico y actividades deportivas a la comunidad local, brindando un
              espacio equipado con máquinas de musculación, zonas de entrenamiento funcional, clases grupales y
              programas personalizados dirigidos por entrenadores certificados.
            </p>
          </CardContent>
        </Card>

        {/* Visión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-red-600" />
              Nuestra Visión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Tener una buena comunidad, ofrecer un espacio motivador y profesional, y entregar respeto y disciplina a
              la comunidad de Chimbarongo.
            </p>
          </CardContent>
        </Card>

        {/* Público Objetivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              ¿Para Quién Somos?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Nuestro gimnasio está diseñado para personas de <strong>13 hasta 80 años</strong>. No somos un gimnasio de
              élite, sino un centro accesible para toda la población de Chimbarongo que busca mejorar su salud y
              bienestar físico.
            </p>
            <p className="text-slate-700">
              Ofrecemos una solución fitness completa que va más allá del equipamiento básico, brindando valor a través
              de la variedad y calidad de nuestros servicios.
            </p>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-red-600" />
              Nuestros Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Máquinas de musculación modernas y mantenidas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Zonas de entrenamiento funcional</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Clases grupales variadas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Programas de entrenamiento personalizados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Atención de entrenadores certificados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Asesoría nutricional deportiva</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Únete a Nuestra Comunidad
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
