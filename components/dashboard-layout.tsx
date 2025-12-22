"use client"

import { CalendarCheck, RefreshCw } from "lucide-react"
import Image from "next/image"
import type React from "react"

import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { User as UserType } from "@/lib/auth-client"
import { getUser, logout } from "@/lib/auth-client"
import { FileText, ShoppingCart } from "lucide-react"

import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  Sun,
  User,
  UserCircle,
  Users,
  X,
} from "lucide-react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "Administrador" | "Entrenador" | "Socio"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  // Validación de sesión
  useEffect(() => {
    const userData = getUser()
    if (!userData || userData.rol !== role) {
      router.push("/login")
      return
    }
    setUser(userData)
  }, [router, role])

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user) return

      try {
        let endpoint = ""
        let params = ""

        if (role === "Administrador") {
          endpoint = "/api/admin/perfil"
          params = `?usuarioID=${user.usuarioID}`
        } else if (role === "Entrenador") {
          endpoint = "/api/entrenador/profile"
          params = `?entrenadorID=${user.entrenadorID}`
        } else {
          endpoint = "/api/socio/perfil"
          params = `?socioID=${user.socioID}`
        }

        const res = await fetch(`${endpoint}${params}`)
        if (res.ok) {
          const data = await res.json()
          const photoUrl = data.FotoPerfil || data.FotoURL
          if (photoUrl) {
            setProfilePhoto(photoUrl)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching profile photo:", error)
      }
    }

    fetchProfilePhoto()
  }, [user, role])

  // FUNCIÓN ÚNICA para leer notificaciones y mostrar toast
  const fetchAndToast = useCallback(async () => {
    if (!user) return

    const tipoUsuario = role === "Administrador" ? "Admin" : role
    const usuarioID = role === "Administrador" ? undefined : user.entrenadorID || user.socioID

    let lastShownId = Number(localStorage.getItem("last_notification_shown_id") || "0")

    try {
      const params = new URLSearchParams({ tipoUsuario })
      if (usuarioID) params.append("usuarioID", String(usuarioID))

      const res = await fetch(`/api/notificaciones?${params.toString()}`, {
        cache: "no-store",
      })
      const data = await res.json()

      const notificaciones = data?.notificaciones ?? []
      if (!Array.isArray(notificaciones)) return

      const nuevas = notificaciones
        .filter((n: any) => n && n.Leida === false && Number(n.NotificacionID) > lastShownId)
        .sort((a: any, b: any) => Number(a.NotificacionID) - Number(b.NotificacionID))
        .slice(0, 3)

      for (const n of nuevas) {
        lastShownId = Math.max(lastShownId, Number(n.NotificacionID))
        localStorage.setItem("last_notification_shown_id", String(lastShownId))

        const Icon = n.TipoEvento === "membresia_inactiva" ? AlertCircle : CheckCircle2

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{n.Titulo}</span>
            </div>
          ) as any,
          description: n.Mensaje,
          duration: 5000,
          className: "rounded-xl shadow-lg border bg-background",
        })
      }
    } catch (e) {
      console.error("[notificaciones] error:", e)
    }
  }, [user, role])

  // Evento inmediato (cuando haces dispatch desde agregarReserva)
  useEffect(() => {
    const handler = () => {
      fetchAndToast()
    }

    window.addEventListener("notificacion:nueva", handler)
    return () => {
      window.removeEventListener("notificacion:nueva", handler)
    }
  }, [fetchAndToast])

  // Polling cada 5 segundos
  useEffect(() => {
    if (!user) return

    fetchAndToast()
    const interval = setInterval(fetchAndToast, 5000)
    return () => clearInterval(interval)
  }, [user, fetchAndToast])

  const handleLogout = () => {
    logout()
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark)

    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }
  const getRolePrefix = () => {
    if (role === "Administrador") return "/admin"
    if (role === "Entrenador") return "/entrenador"
    return "/socio"
  }

  // Navigation items based on role
  const getNavItems = () => {
    const basePrefix = getRolePrefix()

    if (role === "Administrador") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
        { icon: CreditCard, label: "Membresías", href: `${basePrefix}/membresias` },
        { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
        { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
        { icon: Package, label: "Inventario", href: `${basePrefix}/inventario` },
        { icon: ShoppingCart, label: "Punto de Venta", href: `${basePrefix}/ventas` },
        { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
        { icon: Clock, label: "Cronograma", href: `${basePrefix}/cronograma` },
        { icon: UserCircle, label: "Recepción", href: `${basePrefix}/recepcion` },
        { icon: ClipboardCheck, label: "Asistencia", href: `${basePrefix}/asistencia` },
        { icon: RefreshCw, label: "Sincronización", href: `${basePrefix}/sync` },
        { icon: BarChart3, label: "KPIs", href: `${basePrefix}/kpis` },
        { icon: FileText, label: "Reportes", href: `${basePrefix}/reportes` },
      ]
    } else if (role === "Entrenador") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
        { icon: Calendar, label: "Mis Clases", href: `${basePrefix}/clases` },
        { icon: Clock, label: "Horario", href: `${basePrefix}/horario` },
        { icon: CalendarCheck, label: "Mis Sesiones", href: `${basePrefix}/sesiones` },
        { icon: RefreshCw, label: "Gestión Horario", href: `${basePrefix}/gestion-horario` },
      ]
    } else {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: CreditCard, label: "Mi Membresía", href: `${basePrefix}/membresia` },
        { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
        { icon: CalendarCheck, label: "Mis Sesiones", href: `${basePrefix}/sesiones` },
        { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
        { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
      ]
    }
  }

  const navItems = getNavItems()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-background border-r w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-2 border-b">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logoMundo.png"
                  alt="Mundo Fitness Logo"
                  width={120}
                  height={35}
                  className="object-contain"
                  priority
                />
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary" : ""}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t space-y-1">
            <Link href={`${getRolePrefix()}/perfil`}>
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
            </Link>
            <Link href={`${getRolePrefix()}/configuracion`}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all ${sidebarOpen ? "lg:ml-64" : ""}`}>
        {/* Top bar */}
        <header className="bg-background border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <NotificationsDropdown
                tipoUsuario={role === "Administrador" ? "Admin" : role}
                usuarioID={role === "Administrador" ? undefined : user.entrenadorID || user.socioID}
              />
              <span className="text-sm font-medium">
                {user.nombre} {user.apellido}
              </span>
              {profilePhoto ? (
                <img
                  src={profilePhoto || "/placeholder.svg"}
                  alt={`${user.nombre} ${user.apellido}`}
                  className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
