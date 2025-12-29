import { Instagram, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand / Info */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h3 className="font-semibold text-foreground">Mundo Fitness Chimbarongo</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Tu centro de acondicionamiento físico integral en Chimbarongo.
            </p>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 text-primary/80" />
              <span>Longitudinal Sur Km 155</span>
            </div>

            {/* Línea decorativa sutil */}
            <div className="h-px w-24 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Sobre Nosotros
                </Link>
              </li>
              
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terminos"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Políticas de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Contacto</h3>

            <div className="space-y-2 text-sm">
              <a
                href="https://www.instagram.com/mundofitness_chimbarongo"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border bg-background/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                  <Instagram className="h-4 w-4" />
                </span>
                <span>@mundofitness_chimbarongo</span>
              </a>

              <a
                href="mailto:mundofitnesschimbarongo08@gmail.com"
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border bg-background/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="break-all">mundofitnesschimbarongo08@gmail.com</span>
              </a>
            </div>

            {/* Hint de color (rojo + azul suave opcional para contraste) */}
            <div className="flex items-center gap-2 pt-2">
              <span className="h-2 w-2 rounded-full bg-primary/80" />
              <span className="h-2 w-2 rounded-full bg-sky-500/40" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-muted-foreground md:flex-row md:text-left">
            <p>&copy; {year} Mundo Fitness Chimbarongo. Todos los derechos reservados.</p>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline">Hecho con</span>
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span className="text-xs">Mundo Fitness System</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
