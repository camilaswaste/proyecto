"use client"

import { getNavItems } from "@/lib/nav-items"
import Image from "next/image"
import type React from "react"

import { Footer } from "@/components/footer"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { User as UserType } from "@/lib/auth-client"
import { getUser, logout } from "@/lib/auth-client"

import {
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react"

import { useTheme } from "@/lib/theme-provider"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "Administrador" | "Entrenador" | "Socio"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  /* ===============================
     Responsive sidebar
  =============================== */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
    }

    if (window.innerWidth < 1024) setSidebarOpen(false)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [pathname])

  /* ===============================
     Session validation
  =============================== */
  useEffect(() => {
    const userData = getUser()
    if (!userData || userData.rol !== role) {
      router.push("/login")
      return
    }
    setUser(userData)
  }, [router, role])

  /* ===============================
     Profile photo
  =============================== */
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
          if (photoUrl) setProfilePhoto(photoUrl)
        }
      } catch (error) {
        console.error("[layout] Error fetching profile photo:", error)
      }
    }

    fetchProfilePhoto()
  }, [user, role])

  /* ===============================
     Notifications (toast)
  =============================== */
  const fetchAndToast = useCallback(async () => {
    if (!user) return

    const tipoUsuario = role === "Administrador" ? "Admin" : role
    const usuarioID = role === "Administrador" ? undefined : user.entrenadorID || user.socioID

    let lastShownId = Number(localStorage.getItem("last_notification_shown_id") || "0")

    try {
      const params = new URLSearchParams({ tipoUsuario })
      if (usuarioID) params.append("usuarioID", String(usuarioID))

      const res = await fetch(`/api/notificaciones?${params.toString()}`, { cache: "no-store" })
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

  useEffect(() => {
    const handler = () => fetchAndToast()
    window.addEventListener("notificacion:nueva", handler)
    return () => window.removeEventListener("notificacion:nueva", handler)
  }, [fetchAndToast])

  useEffect(() => {
    if (!user) return
    fetchAndToast()
    const interval = setInterval(fetchAndToast, 5000)
    return () => clearInterval(interval)
  }, [user, fetchAndToast])

  const handleLogout = () => logout()

  const getRolePrefix = () => {
    if (role === "Administrador") return "/admin"
    if (role === "Entrenador") return "/entrenador"
    return "/socio"
  }

  const navItems = getNavItems(role)

  const roleBadge = useMemo(() => {
    if (role === "Administrador")
      return { label: "Administrador", cls: "bg-primary/10 text-primary border-primary/25" }
    if (role === "Entrenador")
      return { label: "Entrenador", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25" }
    return { label: "Socio", cls: "bg-zinc-900/5 text-foreground border-border/60 dark:bg-white/5" }
  }, [role])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-12 w-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          "fixed top-0 left-0 z-40 h-screen transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "bg-background border-r w-64",
        ].join(" ")}
      >
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="relative px-4 py-6 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* LOGO — CAMBIA SEGÚN TEMA */}
            <div className="flex justify-center">
              <Image
                src={isDark ? "/images/logoMundoBlanco.png" : "/images/logoMundo.png"}
                alt="Mundo Fitness Logo"
                width={150}
                height={44}
                className="object-contain transition-all"
                priority
              />
            </div>

            {/* ROLE BADGE */}
            <div className="mt-4 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${roleBadge.cls}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {roleBadge.label}
              </span>
            </div>
          </div>

          {/* NAV */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start hover:bg-muted/60 ${
                      isActive ? "bg-primary/10 text-primary border border-primary/20" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* USER */}
          <div className="p-4 border-t space-y-1">
            <Link href={`${getRolePrefix()}/perfil`}>
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" /> Perfil
              </Button>
            </Link>
            <Link href={`${getRolePrefix()}/configuracion`}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" /> Configuración
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className={`flex flex-col min-h-screen ${sidebarOpen ? "lg:ml-64" : ""}`}>
        {/* TOPBAR */}
        <header className="bg-background/80 backdrop-blur border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <NotificationsDropdown
                tipoUsuario={role === "Administrador" ? "Admin" : role}
                usuarioID={role === "Administrador" ? undefined : user.entrenadorID || user.socioID}
              />

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold">
                  {user.nombre} {user.apellido}
                </span>
                <span className="text-xs text-muted-foreground">{role}</span>
              </div>

              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Perfil"
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

        <main className="flex-1 p-6">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

export default DashboardLayout
