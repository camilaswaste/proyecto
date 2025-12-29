// app/privacidad/page.tsx
"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Shield,
  FileText,
  Lock,
  Share2,
  UserCheck,
  Database,
  Cookie,
  Baby,
  RefreshCw,
  Mail,
  MapPin,
  Instagram,
} from "lucide-react"

type Section = {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

export default function PrivacidadPage() {
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
      id: "recopilamos",
      title: "1. Información que Recopilamos",
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Al registrarte en <span className="font-medium text-foreground">Mundo Fitness Chimbarongo</span>, recopilamos información
            necesaria para gestionar tu membresía y tu experiencia.
          </p>

          <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold text-foreground/80 mb-2">1.1 Información personal</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Nombre completo</li>
              <li>RUT</li>
              <li>Fecha de nacimiento</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Fotografía para credencial de socio</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold text-foreground/80 mb-2">1.2 Información de uso</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Registramos información sobre tu uso de instalaciones y servicios (asistencia, clases reservadas y pagos realizados).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "uso",
      title: "2. Uso de la Información",
      icon: UserCheck,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos tu información personal para:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Gestionar tu membresía y acceso a las instalaciones</li>
            <li>Procesar pagos y facturación</li>
            <li>Programar clases y sesiones de entrenamiento</li>
            <li>Comunicar avisos importantes del gimnasio</li>
            <li>Enviar información de servicios y promociones (si aplica)</li>
            <li>Mejorar nuestros servicios y experiencia</li>
            <li>Cumplir obligaciones legales y tributarias</li>
          </ul>

          <div className="mt-2 rounded-lg border border-border/70 bg-red-500/5 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Nota:</span> solo tratamos datos para fines legítimos, claros y
              compatibles con el servicio.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "proteccion",
      title: "3. Protección de Datos",
      icon: Lock,
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground/80 mb-1">3.1 Seguridad</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Medidas técnicas y organizativas contra accesos no autorizados, pérdida o alteración.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground/80 mb-1">3.2 Acceso limitado</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acceso solo para personal autorizado y únicamente con fines descritos.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground/80 mb-1">3.3 Encriptación</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Contraseñas y datos sensibles se almacenan de forma encriptada.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Además, revisamos y mejoramos controles cuando corresponde, para mantener un estándar de protección adecuado.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "compartir",
      title: "4. Compartir Información",
      icon: Share2,
      content: (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">No compartimos, vendemos ni alquilamos</span> tu información personal a
              terceros, excepto en estos casos:
            </p>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Cuando sea requerido por ley o autoridad competente</li>
            <li>Para procesar pagos mediante proveedores autorizados</li>
            <li>Con tu consentimiento explícito</li>
          </ul>
        </div>
      ),
    },
    {
      id: "derechos",
      title: "5. Derechos del Usuario",
      icon: Shield,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">Tienes derecho a:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Acceso", "Solicitar copia de tus datos personales."],
              ["Rectificación", "Corregir información inexacta o incompleta."],
              ["Eliminación", "Solicitar eliminación (sujeto a retención legal)."],
              ["Oposición", "Oponerte al tratamiento para ciertos fines."],
              ["Portabilidad", "Solicitar transferencia a otro proveedor."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "retencion",
      title: "6. Retención de Datos",
      icon: Database,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conservamos tu información personal el tiempo necesario para cumplir los fines descritos y según lo exijan leyes fiscales y
            comerciales aplicables en Chile.
          </p>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tras la cancelación de tu membresía, conservaremos cierta información básica por un período de{" "}
              <span className="font-semibold text-foreground">5 años</span> para cumplir obligaciones legales.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "cookies",
      title: "7. Cookies y Tecnologías Similares",
      icon: Cookie,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nuestro sistema web utiliza cookies y tecnologías similares para mejorar tu experiencia, mantener sesión activa y analizar
            el uso del sistema.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Puedes configurar tu navegador para rechazar cookies, pero algunas funcionalidades podrían verse afectadas.
          </p>
        </div>
      ),
    },
    {
      id: "menores",
      title: "8. Menores de Edad",
      icon: Baby,
      content: (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para socios menores de 18 años, requerimos el consentimiento de un padre o tutor legal para recopilar y procesar su
          información personal.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "9. Cambios a esta Política",
      icon: RefreshCw,
      content: (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Podemos actualizar esta Política de Privacidad periódicamente. Cambios significativos serán notificados por correo electrónico
          y/o avisos en nuestras instalaciones.
        </p>
      ),
    },
    {
      id: "contacto",
      title: "10. Contacto",
      icon: Mail,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para ejercer tus derechos o realizar consultas sobre esta política, contáctanos:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="mailto:mundofitnesschimbarongo08@gmail.com"
              className="group rounded-lg border border-border/70 bg-muted/30 p-4 transition hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition">
                    mundofitnesschimbarongo08@gmail.com
                  </p>
                </div>
              </div>
            </a>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Dirección</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Calle Longitudinal Sur Km 155, Chimbarongo, Región de O&apos;Higgins
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://www.instagram.com/mundofitness_chimbarongo"
              target="_blank"
              rel="noopener noreferrer"
              className="group sm:col-span-2 rounded-lg border border-border/70 bg-muted/30 p-4 transition hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Instagram</p>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition">
                    @mundofitness_chimbarongo
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
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
        className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur border-border/60 shadow-sm hover:shadow-md"
        aria-label="Volver atrás"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* HERO (blanco/oscuro con acento rojo elegante) */}
      <section className="relative overflow-hidden">
        {/* fondo suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        {/* glow rojo sutil */}
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-red-500/20 via-rose-500/10 to-transparent blur-3xl" />
        {/* línea superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
            Política oficial — Protección de datos
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Políticas de Privacidad
          </h1>
          <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
            Cómo recopilamos, usamos y protegemos tu información en Mundo Fitness Chimbarongo.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-300">
              <Shield className="h-4 w-4" />
              Transparencia y seguridad
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-muted-foreground">
              <RefreshCw className="h-4 w-4 text-red-600 dark:text-red-400" />
              Última actualización: <span className="text-foreground/90">{lastUpdated}</span>
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          {/* TOC */}
          <aside className="md:sticky md:top-6 h-fit">
            <Card className="border-border/60 bg-background/70 backdrop-blur">
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
                      <span className="h-1.5 w-1.5 rounded-full bg-transparent group-hover:bg-red-500 transition" />
                    </a>
                  ))}
                </nav>

                <Separator className="my-4" />

                <div className="text-xs text-muted-foreground leading-relaxed">
                  Si tienes dudas, revisa la sección <span className="font-medium text-foreground">Contacto</span>.
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* SECTIONS */}
          <div className="space-y-6">
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <Card
                  key={s.id}
                  id={s.id}
                  className="border-border/60 bg-background/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg md:text-xl">{s.title}</CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Información oficial aplicable al uso del gimnasio y la plataforma.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">{s.content}</CardContent>
                </Card>
              )
            })}

            <Separator className="mt-8" />
            <p className="text-center text-xs text-muted-foreground">
              Última actualización: <span className="font-medium text-foreground">{lastUpdated}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
