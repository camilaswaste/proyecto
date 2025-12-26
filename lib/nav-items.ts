import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  RefreshCw,
  ShoppingCart,
  UserCircle,
  Users,
  Wrench
} from "lucide-react"

export interface NavItem {
  icon: LucideIcon
  label: string
  href: string
}

export function getNavItems(role: "Administrador" | "Entrenador" | "Socio"): NavItem[] {
  const basePrefix = role === "Administrador" ? "/admin" : role === "Entrenador" ? "/entrenador" : "/socio"

  if (role === "Administrador") {
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
      { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
      { icon: CreditCard, label: "Membresías", href: `${basePrefix}/membresias` },
      { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
      { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
      { icon: Wrench, label: "Implementos", href: `${basePrefix}/implementos` },
      { icon: Package, label: "Inventario", href: `${basePrefix}/inventario` },
      { icon: ShoppingCart, label: "Punto de Venta", href: `${basePrefix}/ventas` },
      { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
      { icon: UserCircle, label: "Recepción", href: `${basePrefix}/recepcion` },
      { icon: ClipboardCheck, label: "Asistencia", href: `${basePrefix}/asistencia` },
      { icon: MessageSquare, label: "Avisos Generales", href: `${basePrefix}/avisos` },
      { icon: Clock, label: "Horarios", href: `${basePrefix}/horarios` },
      { icon: RefreshCw, label: "Sincronización", href: `${basePrefix}/sync` },
      { icon: BarChart3, label: "KPIs", href: `${basePrefix}/kpis` },
      { icon: FileText, label: "Reportes", href: `${basePrefix}/reportes` },
    ]
  } else if (role === "Entrenador") {
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
      { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
      { icon: Calendar, label: "Mis Clases", href: `${basePrefix}/clases` },
      { icon: CalendarCheck, label: "Mis Sesiones", href: `${basePrefix}/sesiones` },
      { icon: RefreshCw, label: "Gestión Horario", href: `${basePrefix}/gestion-horario` },
      { icon: MessageSquare, label: "Avisos", href: `${basePrefix}/avisos` },
      { icon: Clock, label: "Horarios Gimnasio", href: `${basePrefix}/horario` },
    ]
  } else {
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
      { icon: CreditCard, label: "Mi Membresía", href: `${basePrefix}/membresia` },
      { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
      { icon: CalendarCheck, label: "Mis Sesiones", href: `${basePrefix}/sesiones` },
      { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
      { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
      { icon: MessageSquare, label: "Avisos", href: `${basePrefix}/avisos` },
      { icon: Clock, label: "Horarios", href: `${basePrefix}/horarios` },
    ]
  }
}
