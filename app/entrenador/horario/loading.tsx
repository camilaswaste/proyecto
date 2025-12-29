import { DashboardLayout } from "@/components/dashboard-layout"

export default function Loading() {
  return (
    <DashboardLayout role="Entrenador">
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando horarios...</p>
      </div>
    </DashboardLayout>
  )
}
