import { DashboardLayout } from "@/components/dashboard-layout"

export default function SocioAvisosLoading() {
  return (
    <DashboardLayout role="Socio">
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando avisos...</p>
      </div>
    </DashboardLayout>
  )
}
