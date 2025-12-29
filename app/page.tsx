import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, Dumbbell, Shield, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-black text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mundo Fitness</h1>
              <p className="text-xs text-gray-400">Chimbarongo</p>
            </div>
          </div>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white">Iniciar Sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
              <span className="text-red-500 text-sm font-semibold">Tu transformación comienza aquí</span>
            </div>
            <h2 className="text-5xl lg:text-7xl font-bold mb-6 text-balance leading-tight">
              Transforma Tu Cuerpo, <span className="text-red-600">Transforma Tu Vida</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
              El gimnasio más completo de Chimbarongo. Equipamiento de última generación, entrenadores certificados y un
              ambiente motivador para alcanzar tus metas.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6">
                  Comienza Ahora
                </Button>
              </Link>
              <Link href="#planes">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-gray-600 text-white hover:bg-white/10 bg-transparent"
                >
                  Ver Planes
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-y">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">5+</div>
              <p className="text-gray-600 text-sm">Años de experiencia</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">500+</div>
              <p className="text-gray-600 text-sm">Socios activos</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">15+</div>
              <p className="text-gray-600 text-sm">Clases semanales</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">98%</div>
              <p className="text-gray-600 text-sm">Satisfacción</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-balance">¿Por Qué Elegirnos?</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto text-pretty">
              Ofrecemos todo lo que necesitas para alcanzar tus objetivos de fitness
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <Users className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Entrenadores Certificados</h4>
              <p className="text-gray-600 leading-relaxed">
                Equipo profesional con certificaciones técnicas y diplomados especializados en medicina deportiva y
                nutrición.
              </p>
            </Card>

            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <Dumbbell className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Equipamiento Premium</h4>
              <p className="text-gray-600 leading-relaxed">
                Máquinas de musculación de última generación, zona de entrenamiento funcional y área de pesas libres.
              </p>
            </Card>

            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <Calendar className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Clases Grupales</h4>
              <p className="text-gray-600 leading-relaxed">
                Variedad de clases dirigidas: funcional, spinning, yoga y más. Reserva tu cupo fácilmente online.
              </p>
            </Card>

            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <TrendingUp className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Seguimiento Personalizado</h4>
              <p className="text-gray-600 leading-relaxed">
                Programas de entrenamiento adaptados a tus objetivos con evaluaciones periódicas de progreso.
              </p>
            </Card>

            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <Shield className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Acceso Seguro</h4>
              <p className="text-gray-600 leading-relaxed">
                Sistema de acceso con código QR digital. Control de asistencia y seguridad garantizada.
              </p>
            </Card>

            <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 border-0 group">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                <Clock className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">Horarios Flexibles</h4>
              <p className="text-gray-600 leading-relaxed">
                Abierto de lunes a domingo con horarios amplios para que entrenes cuando mejor te convenga.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planes" className="bg-white py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-balance">Planes de Membresía</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto text-pretty">
              Elige el plan que mejor se adapte a tus necesidades y objetivos
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-white border-2 border-gray-100">
              <h4 className="text-xl font-bold mb-2">Mensual Básico</h4>
              <div className="my-6">
                <span className="text-5xl font-bold text-black">$25.000</span>
                <p className="text-gray-500 mt-2">por mes</p>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Acceso ilimitado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Todas las máquinas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  App de seguimiento
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">Comenzar</Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-white border-2 border-gray-100">
              <div className="bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-full inline-block mb-3">
                POPULAR
              </div>
              <h4 className="text-xl font-bold mb-2">Trimestral</h4>
              <div className="my-6">
                <span className="text-5xl font-bold text-black">$65.000</span>
                <p className="text-gray-500 mt-2">3 meses</p>
                <p className="text-red-600 text-sm font-semibold mt-1">Ahorra 10%</p>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Todo lo del básico
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Evaluación inicial
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />2 clases grupales/mes
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Comenzar</Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-white border-2 border-gray-100">
              <h4 className="text-xl font-bold mb-2">Semestral</h4>
              <div className="my-6">
                <span className="text-5xl font-bold text-black">$120.000</span>
                <p className="text-gray-500 mt-2">6 meses</p>
                <p className="text-red-600 text-sm font-semibold mt-1">Ahorra 20%</p>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Todo lo del trimestral
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Clases ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Plan nutricional
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">Comenzar</Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-black text-white border-0">
              <div className="bg-white text-black text-xs font-bold py-1.5 px-3 rounded-full inline-block mb-3">
                PREMIUM
              </div>
              <h4 className="text-xl font-bold mb-2">Anual</h4>
              <div className="my-6">
                <span className="text-5xl font-bold">$200.000</span>
                <p className="text-gray-400 mt-2">12 meses</p>
                <p className="text-red-500 text-sm font-semibold mt-1">Mejor precio</p>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Todo lo del semestral
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Sesiones personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Seguimiento premium
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Comenzar</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">¿Listo para empezar tu transformación?</h3>
            <p className="text-xl text-gray-300 mb-8 text-pretty leading-relaxed">
              Únete a nuestra comunidad y descubre todo lo que puedes lograr con el apoyo adecuado
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6">
                Comienza Hoy Mismo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
