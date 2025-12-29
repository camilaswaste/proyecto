"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Award, Building2, Eye, Target, Users } from "lucide-react"

export default function SobreNosotrosPage() {
  const router = useRouter()

  const gallery = [
    { src: "/images/mundoFitness.jpg", alt: "Mundo Fitness 1" },
    { src: "/images/mundoFitness2.jpg", alt: "Mundo Fitness 2" },
    { src: "/images/gym-2.jpg", alt: "Mundo Fitness 3" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50 text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Back */}
      <Button
        onClick={() => router.back()}
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 bg-background/75 backdrop-blur border-border shadow-sm hover:shadow-md"
        aria-label="Volver atrás"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* HERO */}
      <section className="relative">
        {/* Imagen */}
        <div className="relative h-[480px] w-full">
          <Image src="/images/mundoFitness.jpg" alt="Mundo Fitness Chimbarongo" fill className="object-cover" priority />
          {/* Overlay elegante */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/65 to-white/10 dark:from-slate-950 dark:via-slate-950/55 dark:to-slate-950/10" />
          {/* Detalle rojo sutil */}
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
          </div>
        </div>

        {/* Contenido del Hero */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-6 pb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-background/60 px-4 py-2 text-xs font-medium text-foreground backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              MUNDO FITNESS • CHIMBARONGO
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
              Sobre Nosotros
            </h1>
            <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
              Conoce nuestra historia, misión y visión — y cómo construimos una comunidad fitness sólida en Chimbarongo.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button className="rounded-full px-7 bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm">
                  Únete a Nuestra Comunidad
                </Button>
              </Link>

              <Button
                variant="outline"
                className="rounded-full px-7 bg-background/60 backdrop-blur border-border hover:bg-muted"
                onClick={() => {
                  const el = document.getElementById("contenido")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                Ver más
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO */}
      <section id="contenido" className="w-full">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* TEXTO */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-red-600 dark:text-red-400">
                <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-red-600/70 to-rose-600/70" />
                HISTORIA
              </div>

              <h2 className="mt-4 text-3xl font-bold">
                Comprometidos con la comunidad de Chimbarongo
              </h2>

              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Mundo Fitness Chimbarongo fue fundado el <span className="font-semibold text-foreground">26 de febrero de 2024</span>{" "}
                  por <span className="font-semibold text-foreground">Juan Pablo Fuentes</span> y{" "}
                  <span className="font-semibold text-foreground">Álvaro Gangas</span>, con el objetivo de ofrecer
                  servicios de acondicionamiento físico y actividades deportivas a la comunidad local.
                </p>

                <p>
                  Desde nuestra apertura, buscamos entregar un espacio moderno y accesible, equipado con máquinas de
                  musculación, zonas de entrenamiento funcional, clases grupales y programas personalizados guiados por
                  entrenadores certificados.
                </p>

                <p>
                  Estamos ubicados en <span className="font-semibold text-foreground">Longitudinal Sur Km 155</span>,
                  Región de O&apos;Higgins, siendo el primer centro de acondicionamiento físico integral de Chimbarongo.
                </p>
              </div>

              {/* CTA secundario */}
              <div className="mt-8 rounded-2xl border border-border/70 bg-background/60 backdrop-blur p-6">
                <p className="text-sm text-muted-foreground">
                  Nuestra meta es que cada socio sienta un acompañamiento real: <span className="font-medium text-foreground">progreso medible</span>,{" "}
                  <span className="font-medium text-foreground">disciplina</span> y{" "}
                  <span className="font-medium text-foreground">bienestar</span>.
                </p>
              </div>
            </div>

            {/* MÉTRICAS + BLOQUES */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Metric icon={<Building2 className="h-5 w-5" />} title="Fundado en" value="2024" />
                <Metric icon={<Users className="h-5 w-5" />} title="Público objetivo" value="13 – 80 años" />
              </div>

              {/* BLOQUE DESTACADO (no sólido rojo, sino glass con detalles) */}
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-background/60 to-rose-500/10 backdrop-blur p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold">Nuestra Comunidad</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Respeto · Disciplina · Motivación
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-muted-foreground">PROGRESO</span>
                    <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-red-600/80 to-rose-600/80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Misión / Visión / Servicios */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<Target className="h-5 w-5" />}
                  title="Nuestra Misión"
                  text="Ofrecer servicios de acondicionamiento físico y actividades deportivas, brindando un espacio profesional, accesible y guiado por entrenadores certificados."
                />

                <InfoCard
                  icon={<Eye className="h-5 w-5" />}
                  title="Nuestra Visión"
                  text="Construir una comunidad fitness sólida, basada en el respeto, la disciplina y el bienestar físico."
                />

                <InfoCard
                  icon={<Award className="h-5 w-5" />}
                  title="Nuestros Servicios"
                  text="Musculación · Entrenamiento funcional · Clases grupales · Programas personalizados · Asesoría nutricional."
                  full
                />
              </div>
            </div>
          </div>

          {/* GALERÍA */}
          <div className="mt-14 md:mt-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-widest text-red-600 dark:text-red-400">GALERÍA</p>
                <h3 className="mt-2 text-2xl font-bold">Nuestro espacio</h3>
                <p className="mt-1 text-sm text-muted-foreground">Ambiente, equipos y zonas de entrenamiento.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {gallery.map((g) => (
                <div
                  key={g.src}
                  className="group relative h-56 overflow-hidden rounded-2xl border border-border/70 bg-background"
                >
                  <Image src={g.src} alt={g.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-white/90">{g.alt}</span>
                    <span className="h-2 w-10 rounded-full bg-gradient-to-r from-red-500/80 to-rose-500/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-14 border-t border-border/60 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Mundo Fitness Chimbarongo · Longitudinal Sur Km 155 · Región de O&apos;Higgins
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* COMPONENTES AUXILIARES */

function Metric({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 backdrop-blur p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/15 to-rose-500/10 ring-1 ring-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  icon,
  title,
  text,
  full,
}: {
  icon: React.ReactNode
  title: string
  text: string
  full?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-background/70 backdrop-blur p-6 shadow-sm hover:shadow-md transition-shadow ${
        full ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted text-foreground/80 flex items-center justify-center">
          {icon}
        </div>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{text}</p>
      <div className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-red-600/70 to-rose-600/70" />
    </div>
  )
}
