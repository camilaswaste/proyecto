import { Instagram, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información del Gimnasio */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Mundo Fitness Chimbarongo</h3>
            <p className="text-sm text-slate-600">Tu centro de acondicionamiento físico integral en Chimbarongo.</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>Longitudinal Sur Km 155</span>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sobre-nosotros" className="text-slate-600 hover:text-red-600 transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/horarios-publicos" className="text-slate-600 hover:text-red-600 transition-colors">
                  Horarios
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terminos" className="text-slate-600 hover:text-red-600 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-slate-600 hover:text-red-600 transition-colors">
                  Políticas de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Contacto</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://www.instagram.com/mundofitness_chimbarongo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span>@mundofitness_chimbarongo</span>
              </a>
              <a
                href="mailto:mundofitnesschimbarongo08@gmail.com"
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>mundofitnesschimbarongo08@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-slate-600">
          <p>&copy; {new Date().getFullYear()} Mundo Fitness Chimbarongo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
