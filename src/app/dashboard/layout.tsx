import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardNav } from "@/components/layout/dashboard-nav";

/**
 * La protección de esta ruta la aplica el middleware (src/middleware.ts).
 * La carga real de negocio/usuario se conecta a Supabase en la Fase 3/4.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <DashboardNav />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
