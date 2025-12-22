import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dumbbell, Users, Calendar, TrendingUp, Shield, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header con Login */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Mundo Fitness</h1>
          </div>
          <Link href="/login">
            <Button variant="default">Iniciar Sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-balance">Transforma Tu Vida en Mundo Fitness Chimbarongo</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          El gimnasio más completo de Chimbarongo. Equipamiento de última generación, entrenadores certificados y un
          ambiente motivador para alcanzar tus metas.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/planes">
            <Button size="lg" className="text-lg">
              Ver Planes de Membresía
            </Button>
          </Link>
          <Link href="/contacto">
            <Button size="lg" variant="outline" className="text-lg bg-transparent">
              Contáctanos
            </Button>
          </Link>
        </div>
      </section>

      {/* Características */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">¿Por Qué Elegirnos?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Entrenadores Certificados</h4>
            <p className="text-muted-foreground">
              Equipo profesional con certificaciones técnicas y diplomados especializados en medicina deportiva y
              nutrición.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Dumbbell className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Equipamiento Completo</h4>
            <p className="text-muted-foreground">
              Máquinas de musculación de última generación, zona de entrenamiento funcional y área de pesas libres.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Calendar className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Clases Grupales</h4>
            <p className="text-muted-foreground">
              Variedad de clases dirigidas por profesionales: funcional, spinning, yoga y más. Reserva tu cupo online.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Seguimiento Personalizado</h4>
            <p className="text-muted-foreground">
              Programas de entrenamiento adaptados a tus objetivos con evaluaciones periódicas de progreso.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Acceso Seguro</h4>
            <p className="text-muted-foreground">
              Sistema de acceso con código QR digital. Control de asistencia y seguridad garantizada.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h4 className="text-xl font-semibold mb-2">Horarios Flexibles</h4>
            <p className="text-muted-foreground">
              Abierto de lunes a domingo con horarios amplios para que entrenes cuando mejor te convenga.
            </p>
          </Card>
        </div>
      </section>

      {/* Planes Destacados */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Nuestros Planes</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <h4 className="text-xl font-bold mb-2">Mensual Básico</h4>
              <p className="text-3xl font-bold text-primary mb-4">$25.000</p>
              <p className="text-sm text-muted-foreground mb-4">Acceso ilimitado por 30 días</p>
              <Link href="/planes">
                <Button className="w-full">Más Información</Button>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow border-primary border-2">
              <div className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full inline-block mb-2">
                POPULAR
              </div>
              <h4 className="text-xl font-bold mb-2">Trimestral</h4>
              <p className="text-3xl font-bold text-primary mb-4">$65.000</p>
              <p className="text-sm text-muted-foreground mb-4">10% de descuento</p>
              <Link href="/planes">
                <Button className="w-full">Más Información</Button>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <h4 className="text-xl font-bold mb-2">Semestral</h4>
              <p className="text-3xl font-bold text-primary mb-4">$120.000</p>
              <p className="text-sm text-muted-foreground mb-4">20% de descuento + clases</p>
              <Link href="/planes">
                <Button className="w-full">Más Información</Button>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow bg-primary text-primary-foreground">
              <h4 className="text-xl font-bold mb-2">Anual Premium</h4>
              <p className="text-3xl font-bold mb-4">$200.000</p>
              <p className="text-sm mb-4">Beneficios exclusivos</p>
              <Link href="/planes">
                <Button variant="secondary" className="w-full">
                  Más Información
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-8">Encuéntranos</h3>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg mb-4">
            <strong>Dirección:</strong> Longitudinal Sur Km 155, Chimbarongo, Región de O'Higgins
          </p>
          <p className="text-lg mb-4">
            <strong>Teléfono:</strong> +56 9 1234 5678
          </p>
          <p className="text-lg mb-8">
            <strong>Email:</strong> contacto@mundofitness.cl
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Mundo Fitness Chimbarongo. Todos los derechos reservados.</p>
          <p className="mt-2 text-sm">Sistema de Gestión Integral - Proyecto de Título Ingeniería en Informática</p>
        </div>
      </footer>
    </div>
  )
}
