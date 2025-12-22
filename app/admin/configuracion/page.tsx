"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/lib/theme-provider"
import { Moon, Sun, Type } from "lucide-react"

export default function AdminConfiguracionPage() {
  const { theme, fontSize, toggleTheme, setFontSize } = useTheme()

  const fontSizeOptions = [
    { value: "small" as const, label: "Pequeño", size: "90%" },
    { value: "normal" as const, label: "Normal", size: "100%" },
    { value: "large" as const, label: "Grande", size: "110%" },
    { value: "xlarge" as const, label: "Muy Grande", size: "120%" },
  ]

  return (
    <DashboardLayout role="Administrador">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Configuración</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la apariencia de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Modo de Color</Label>
                <div className="flex items-center gap-4">
                  <Button variant={theme === "light" ? "default" : "outline"} onClick={toggleTheme} className="flex-1">
                    <Sun className="w-4 h-4 mr-2" />
                    Modo Claro
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} onClick={toggleTheme} className="flex-1">
                    <Moon className="w-4 h-4 mr-2" />
                    Modo Oscuro
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Actualmente usando:{" "}
                  <span className="font-semibold">{theme === "light" ? "Modo Claro" : "Modo Oscuro"}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamaño de Fuente</CardTitle>
              <CardDescription>Ajusta el tamaño del texto en toda la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {fontSizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={fontSize === option.value ? "default" : "outline"}
                    onClick={() => setFontSize(option.value)}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Type className="w-5 h-5" />
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.size}</span>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Tamaño actual:{" "}
                <span className="font-semibold">{fontSizeOptions.find((o) => o.value === fontSize)?.label}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
