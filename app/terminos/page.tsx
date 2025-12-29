// app/terminos/page.tsx
"use client"

import type React from "react"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CreditCard,
  Dumbbell,
  Users,
  HeartPulse,
  CalendarClock,
  Mail,
} from "lucide-react"

type Section = {
  id: string
  title: string
  subtitle?: string
  icon: React.ElementType
  content: React.ReactNode
}

export default function TerminosPage() {
  const router = useRouter()

  const lastUpdated = useMemo(
    () =>
      new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [],
  )

  const sections: Section[] = [
    {
      id: "aceptacion",
      title: "1. Aceptación de los Términos",
      subtitle: "Condiciones para usar el gimnasio y la plataforma.",
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Al utilizar los servicios de{" "}
            <span className="font-medium text-foreground">Mundo Fitness Chimbarongo</span>, aceptas estos Términos y
            Condiciones.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si no estás de acuerdo con alguno de estos puntos, te recomendamos no utilizar nuestros servicios.
          </p>
        </div>
      ),
    },
    {
      id: "membresias",
      title: "2. Membresías y Pagos",
      subtitle: "Planes, medios de pago, renovaciones y reembolsos.",
      icon: CreditCard,
      content: (
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Tipos:</span> diaria, semanal, mensual, trimestral,
            semestral y anual.
          </p>
          <p>
            <span className="font-semibold text-foreground">Pagos:</span> por adelantado vía efectivo, transferencia o
            tarjeta.
          </p>
          <p>
            <span className="font-semibold text-foreground">Renovación:</span> no automática (depende del socio).
          </p>
          <p>
            <span className="font-semibold text-foreground">Reembolsos:</span> solo en casos excepcionales evaluados por
            administración.
          </p>
        </div>
      ),
    },
    {
      id: "instalaciones",
      title: "3. Uso de las Instalaciones",
      subtitle: "Normas de convivencia y uso responsable del equipamiento.",
      icon: Dumbbell,
      content: (
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Horarios:</span> sujetos a modificaciones por mantención o
            eventos, con aviso previo cuando corresponda.
          </p>
          <p>
            <span className="font-semibold text-foreground">Edad mínima:</span> 13 años (menores con autorización).
          </p>
          <p>
            <span className="font-semibold text-foreground">Conducta:</span> respeto obligatorio hacia socios, personal e
            instalaciones.
          </p>
          <p>
            <span className="font-semibold text-foreground">Equipamiento:</span> uso responsable siguiendo indicaciones
            del staff.
          </p>
        </div>
      ),
    },
    {
      id: "clases",
      title: "4. Clases y Entrenamientos",
      subtitle: "Reservas, cupos y cancelaciones.",
      icon: Users,
      content: (
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Reservas:</span> obligatorias cuando aplique; cancelación con
            al menos 2 horas.
          </p>
          <p>
            <span className="font-semibold text-foreground">Disponibilidad:</span> sujeta a cupos y programación.
          </p>
        </div>
      ),
    },
    {
      id: "salud",
      title: "5. Salud y Seguridad",
      subtitle: "Responsabilidad individual y lineamientos generales.",
      icon: HeartPulse,
      content: (
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Se recomienda evaluación o consulta médica previa antes de iniciar actividad física.</p>
          <p>El gimnasio no se responsabiliza por uso incorrecto del equipamiento o incumplimiento de indicaciones.</p>
          <p>Personal capacitado para primeros auxilios y gestión de emergencias.</p>
        </div>
      ),
    },
    {
      id: "suspension",
      title: "6. Suspensión de Membresías",
      subtitle: "Pausas temporales por motivos justificados.",
      icon: CalendarClock,
      content: (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Disponible por motivos médicos (con respaldo) o viajes prolongados, sujeta a evaluación y aprobación de la
          administración.
        </p>
      ),
    },
    {
      id: "modificaciones",
      title: "7. Modificaciones",
      subtitle: "Actualizaciones del documento y notificaciones.",
      icon: FileText,
      content: (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Mundo Fitness Chimbarongo puede modificar estos términos cuando sea necesario, notificando oportunamente a
          través de avisos en el gimnasio y/o canales oficiales.
        </p>
      ),
    },
    {
      id: "contacto",
      title: "8. Contacto",
      subtitle: "Canal oficial para consultas.",
      icon: Mail,
      content: (
        <a
          href="mailto:mundofitnesschimbarongo08@gmail.com"
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          <Mail className="h-4 w-4" />
          mundofitnesschimbarongo08@gmail.com
        </a>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Back */}
      <Button
        onClick={() => router.back()}
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 bg-background/70 backdrop-blur border-border shadow-sm hover:shadow-md"
        aria-label="Volver atrás"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Header / Hero (blanco + glow rojo sutil) */}
      <header className="relative overflow-hidden border-b">
        {/* base neutral */}
        <div className="absolute inset-0 bg-background" />
        {/* subtle red glow (no bloque rojo) */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-red-500/12 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />
        {/* thin accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-rose-500 to-red-600 opacity-90" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
            Documento legal
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Términos y Condiciones
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
            Normas de uso, membresías, pagos y responsabilidades aplicables al gimnasio y la plataforma.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
              Transparencia y seguridad
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 backdrop-blur">
              <CalendarClock className="h-4 w-4 text-red-600 dark:text-red-400" />
              Última actualización: <span className="font-medium text-foreground">{lastUpdated}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          {/* TOC */}
          <aside className="md:sticky md:top-6 h-fit">
            <Card className="border-border/70 bg-background/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contenido</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                    >
                      <span className="truncate">{s.title}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500/30 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                  ))}
                </nav>

                <Separator className="my-4" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Si tienes dudas, revisa la sección <span className="font-medium text-foreground">Contacto</span>.
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Sections */}
          <section className="space-y-6">
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <Card
                  key={s.id}
                  id={s.id}
                  className="border-border/70 bg-background/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {/* icon badge (accent red, no sólido) */}
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/12 to-rose-500/10 ring-1 ring-red-500/15">
                        <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>

                      <div className="min-w-0">
                        <CardTitle className="text-base md:text-lg">{s.title}</CardTitle>
                        {s.subtitle ? (
                          <p className="mt-1 text-xs md:text-sm text-muted-foreground">{s.subtitle}</p>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">{s.content}</CardContent>
                </Card>
              )
            })}

            <div className="pt-2">
              <Separator className="mb-4" />
              <p className="text-center text-xs text-muted-foreground">
                Última actualización: <span className="font-medium text-foreground">{lastUpdated}</span>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
